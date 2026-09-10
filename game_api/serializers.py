from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from game_api.models import Character, PlayerProfile, PlayerUnlock, PowerUpConfig, Score

class CharacterSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            'id', 'name', 'slug', 'description', 'cost',
            'color_primary', 'color_secondary',
            'speed_multiplier', 'coin_multiplier',
            'icon_emoji', 'sprite_key', 'is_default',
            'is_unlocked', 'is_active'
        ]

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            # For guest/anonymous, free characters (cost=0) are unlocked
            return obj.cost == 0
        if obj.cost == 0 or obj.is_default:
            return True
        return PlayerUnlock.objects.filter(user=request.user, character=obj).exists()

    def get_is_active(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.is_default or obj.cost == 0
        if hasattr(request.user, 'profile') and request.user.profile.active_character:
            return request.user.profile.active_character_id == obj.id
        return obj.is_default


class PowerUpConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerUpConfig
        fields = ['id', 'name', 'power_type', 'duration_seconds', 'spawn_weight', 'description', 'icon_emoji', 'is_active']


class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    active_character_details = CharacterSerializer(source='active_character', read_only=True)
    unlocked_character_slugs = serializers.SerializerMethodField()

    class Meta:
        model = PlayerProfile
        fields = [
            'id', 'username', 'total_coins', 'high_score',
            'total_runs', 'total_distance',
            'active_character', 'active_character_details',
            'unlocked_character_slugs', 'created_at', 'updated_at'
        ]

    def get_unlocked_character_slugs(self, obj):
        unlocked_ids = PlayerUnlock.objects.filter(user=obj.user).values_list('character__slug', flat=True)
        # Add all free/default characters
        free_slugs = Character.objects.filter(cost=0).values_list('slug', flat=True)
        return list(set(list(unlocked_ids) + list(free_slugs)))


class ScoreSubmitSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=0)
    coins_collected = serializers.IntegerField(min_value=0)
    distance_traveled = serializers.IntegerField(min_value=0, default=0)
    character_slug = serializers.CharField(required=False, allow_blank=True, default='')
    guest_name = serializers.CharField(required=False, allow_blank=True, max_length=50, default='Guest Runner')


class ScoreSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    character_name = serializers.SerializerMethodField()
    character_icon = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = Score
        fields = [
            'id', 'player_name', 'score', 'coins_collected',
            'distance_traveled', 'character_name', 'character_icon',
            'created_at', 'is_current_user'
        ]

    def get_player_name(self, obj):
        if obj.user:
            return obj.user.username
        return obj.guest_name or "Guest Runner"

    def get_character_name(self, obj):
        if obj.character_used:
            return obj.character_used.name
        return "Classic Runner"

    def get_character_icon(self, obj):
        if obj.character_used:
            return obj.character_used.icon_emoji
        return "🏃"

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.user:
            return obj.user_id == request.user.id
        return False


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data.get('username'), password=data.get('password'))
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been disabled.")
        data['user'] = user
        return data
