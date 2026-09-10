from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import TemplateView
from django.db import transaction

from game_api.models import Character, PlayerProfile, PlayerUnlock, PowerUpConfig, Score
from game_api.serializers import (
    CharacterSerializer,
    PlayerProfileSerializer,
    ScoreSerializer,
    ScoreSubmitSerializer,
    PowerUpConfigSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer
)


# ==========================================
# Web Page Views
# ==========================================
class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['characters'] = Character.objects.all()
        context['top_scores'] = Score.objects.select_related('user', 'character_used').order_by('-score')[:10]
        context['powerups'] = PowerUpConfig.objects.filter(is_active=True)
        return context


class LeaderboardPageView(TemplateView):
    template_name = 'leaderboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['top_scores'] = Score.objects.select_related('user', 'character_used').order_by('-score')[:50]
        return context


class LoginPageView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['open_modal'] = 'login'
        return context


class SignupPageView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['open_modal'] = 'signup'
        return context


# ==========================================
# Auth API Views
# ==========================================
class RegisterApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            profile = getattr(user, 'profile', None)
            profile_data = PlayerProfileSerializer(profile, context={'request': request}).data if profile else {}
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'profile': profile_data,
                'message': 'Account created successfully! Welcome to the arena!'
            }, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            login(request, user)
            profile = getattr(user, 'profile', None)
            profile_data = PlayerProfileSerializer(profile, context={'request': request}).data if profile else {}
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'profile': profile_data,
                'message': f'Welcome back, {user.username}!'
            }, status=status.HTTP_200_OK)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            Token.objects.filter(user=request.user).delete()
            logout(request)
        return Response({'success': True, 'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class CurrentUserApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({
                'authenticated': False,
                'user': None,
                'profile': None
            })
        profile = getattr(request.user, 'profile', None)
        profile_data = PlayerProfileSerializer(profile, context={'request': request}).data if profile else None
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email
            },
            'profile': profile_data
        })


# ==========================================
# Game Core API Views
# ==========================================
class SubmitScoreApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ScoreSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        score_val = data['score']
        coins_val = data['coins_collected']
        distance_val = data.get('distance_traveled', 0)
        char_slug = data.get('character_slug', '')
        guest_name = data.get('guest_name', 'Guest Runner')

        # Find character if specified
        character = None
        if char_slug:
            character = Character.objects.filter(slug=char_slug).first()

        is_new_high_score = False
        user_profile_data = None

        with transaction.atomic():
            if request.user.is_authenticated:
                user = request.user
                profile, _ = PlayerProfile.objects.get_or_create(user=user)
                
                # Check if new high score
                if score_val > profile.high_score:
                    profile.high_score = score_val
                    is_new_high_score = True
                
                # Increment coin bank and run stats
                profile.total_coins += coins_val
                profile.total_runs += 1
                profile.total_distance += distance_val
                
                # If character used was selected, save as active
                if character and PlayerUnlock.objects.filter(user=user, character=character).exists():
                    profile.active_character = character
                    
                profile.save()

                score_obj = Score.objects.create(
                    user=user,
                    score=score_val,
                    coins_collected=coins_val,
                    distance_traveled=distance_val,
                    character_used=character or profile.active_character
                )
                user_profile_data = PlayerProfileSerializer(profile, context={'request': request}).data
            else:
                score_obj = Score.objects.create(
                    user=None,
                    guest_name=guest_name or 'Guest Runner',
                    score=score_val,
                    coins_collected=coins_val,
                    distance_traveled=distance_val,
                    character_used=character
                )

        # Global rank of this run
        higher_scores_count = Score.objects.filter(score__gt=score_val).count()
        rank = higher_scores_count + 1

        return Response({
            'success': True,
            'score_id': score_obj.id,
            'score': score_val,
            'coins_collected': coins_val,
            'distance_traveled': distance_val,
            'rank': rank,
            'is_new_high_score': is_new_high_score,
            'profile': user_profile_data,
            'message': 'Score submitted successfully!'
        }, status=status.HTTP_201_CREATED)


class LeaderboardApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        limit = min(max(limit, 1), 50)
        
        top_scores = Score.objects.select_related('user', 'character_used').order_by('-score', '-created_at')[:limit]
        serializer = ScoreSerializer(top_scores, many=True, context={'request': request})
        
        user_best = None
        user_rank = None
        if request.user.is_authenticated:
            best_score_obj = Score.objects.filter(user=request.user).order_by('-score').first()
            if best_score_obj:
                user_best = ScoreSerializer(best_score_obj, context={'request': request}).data
                user_rank = Score.objects.filter(score__gt=best_score_obj.score).count() + 1

        return Response({
            'success': True,
            'leaderboard': serializer.data,
            'user_best': user_best,
            'user_rank': user_rank
        })


class ProfileApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({
                'authenticated': False,
                'guest': True,
                'total_coins': 0,
                'high_score': 0,
                'unlocked_character_slugs': list(Character.objects.filter(cost=0).values_list('slug', flat=True))
            })

        profile, _ = PlayerProfile.objects.get_or_create(user=request.user)
        serializer = PlayerProfileSerializer(profile, context={'request': request})
        recent_scores = Score.objects.filter(user=request.user).order_by('-created_at')[:5]
        recent_scores_data = ScoreSerializer(recent_scores, many=True, context={'request': request}).data

        return Response({
            'authenticated': True,
            'profile': serializer.data,
            'recent_scores': recent_scores_data
        })


# ==========================================
# Shop & Character API Views
# ==========================================
class ShopListApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        characters = Character.objects.all().order_by('cost', 'name')
        serializer = CharacterSerializer(characters, many=True, context={'request': request})
        
        coins = 0
        if request.user.is_authenticated and hasattr(request.user, 'profile'):
            coins = request.user.profile.total_coins

        return Response({
            'success': True,
            'characters': serializer.data,
            'user_coins': coins
        })


class ShopUnlockApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        char_slug = request.data.get('slug')
        char_id = request.data.get('id')

        if char_slug:
            character = get_object_or_404(Character, slug=char_slug)
        elif char_id:
            character = get_object_or_404(Character, id=char_id)
        else:
            return Response({'success': False, 'message': 'Character slug or ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = PlayerProfile.objects.get_or_create(user=request.user)

        # Check if already unlocked
        if character.cost == 0 or PlayerUnlock.objects.filter(user=request.user, character=character).exists():
            return Response({
                'success': True,
                'already_unlocked': True,
                'message': f'{character.name} is already unlocked!',
                'coins_remaining': profile.total_coins
            })

        # Check coin balance
        if profile.total_coins < character.cost:
            return Response({
                'success': False,
                'message': f'Not enough coins! Need {character.cost} coins, but you only have {profile.total_coins}.',
                'coins_needed': character.cost - profile.total_coins
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            profile.total_coins -= character.cost
            profile.save()
            PlayerUnlock.objects.create(user=request.user, character=character)

        return Response({
            'success': True,
            'message': f'Congratulations! You unlocked {character.name}!',
            'character': CharacterSerializer(character, context={'request': request}).data,
            'coins_remaining': profile.total_coins
        }, status=status.HTTP_200_OK)


class ShopSelectApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        char_slug = request.data.get('slug')
        char_id = request.data.get('id')

        if char_slug:
            character = get_object_or_404(Character, slug=char_slug)
        elif char_id:
            character = get_object_or_404(Character, id=char_id)
        else:
            return Response({'success': False, 'message': 'Character slug or ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user owns the character
        is_unlocked = (character.cost == 0) or PlayerUnlock.objects.filter(user=request.user, character=character).exists()
        if not is_unlocked:
            return Response({
                'success': False,
                'message': f'You must unlock {character.name} before equipping it!'
            }, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = PlayerProfile.objects.get_or_create(user=request.user)
        profile.active_character = character
        profile.save()

        return Response({
            'success': True,
            'message': f'{character.name} equipped successfully!',
            'active_character': CharacterSerializer(character, context={'request': request}).data
        })


class PowerUpConfigApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        configs = PowerUpConfig.objects.filter(is_active=True)
        serializer = PowerUpConfigSerializer(configs, many=True)
        return Response({
            'success': True,
            'powerups': serializer.data
        })
