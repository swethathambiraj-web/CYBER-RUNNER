from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from game_api.models import Character, PlayerProfile, PlayerUnlock, Score, PowerUpConfig

class GameApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create default starter character
        self.char_default = Character.objects.create(
            name='Retro Dash',
            slug='retro-dash',
            cost=0,
            is_default=True,
            speed_multiplier=1.0,
            coin_multiplier=1.0
        )
        
        # Create premium character
        self.char_premium = Character.objects.create(
            name='Neon Cyberpunk',
            slug='neon-cyberpunk',
            cost=200,
            is_default=False,
            speed_multiplier=1.1,
            coin_multiplier=1.2
        )

        # Create user
        self.user = User.objects.create_user(username='testplayer', password='password123')
        # Profile is created via post_save signal with 100 starter coins
        self.profile = self.user.profile

    def test_user_profile_created_on_signup(self):
        self.assertIsNotNone(self.profile)
        self.assertEqual(self.profile.total_coins, 100)
        self.assertEqual(self.profile.active_character, self.char_default)
        self.assertTrue(PlayerUnlock.objects.filter(user=self.user, character=self.char_default).exists())

    def test_auth_login_and_token(self):
        response = self.client.post('/api/auth/login/', {'username': 'testplayer', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data)
        token = response.data['token']

        # Test authenticated endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        profile_res = self.client.get('/api/profile/')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['profile']['username'], 'testplayer')

    def test_guest_score_submission(self):
        payload = {
            'score': 1500,
            'coins_collected': 25,
            'distance_traveled': 300,
            'guest_name': 'GuestRunner99'
        }
        response = self.client.post('/api/scores/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(Score.objects.count(), 1)
        score_obj = Score.objects.first()
        self.assertIsNone(score_obj.user)
        self.assertEqual(score_obj.guest_name, 'GuestRunner99')

    def test_authenticated_score_submission_updates_coins_and_highscore(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'score': 4500,
            'coins_collected': 80,
            'distance_traveled': 950,
            'character_slug': 'retro-dash'
        }
        response = self.client.post('/api/scores/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_new_high_score'])

        # Refresh profile
        self.profile.refresh_from_db()
        # 100 starter + 80 earned = 180 coins
        self.assertEqual(self.profile.total_coins, 180)
        self.assertEqual(self.profile.high_score, 4500)
        self.assertEqual(self.profile.total_runs, 1)

    def test_shop_unlock_flow(self):
        self.client.force_authenticate(user=self.user)
        # Attempt to unlock with 100 coins when cost is 200 -> should fail
        res_fail = self.client.post('/api/shop/unlock/', {'slug': 'neon-cyberpunk'})
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res_fail.data['success'])

        # Give player coins and try again
        self.profile.total_coins = 500
        self.profile.save()

        res_success = self.client.post('/api/shop/unlock/', {'slug': 'neon-cyberpunk'})
        self.assertEqual(res_success.status_code, status.HTTP_200_OK)
        self.assertTrue(res_success.data['success'])
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.total_coins, 300) # 500 - 200

        # Equip character
        res_select = self.client.post('/api/shop/select/', {'slug': 'neon-cyberpunk'})
        self.assertEqual(res_select.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.active_character, self.char_premium)

    def test_leaderboard_endpoint(self):
        Score.objects.create(guest_name='Player A', score=1000, coins_collected=10)
        Score.objects.create(guest_name='Player B', score=5000, coins_collected=50)
        Score.objects.create(user=self.user, score=3000, coins_collected=30)

        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        leaderboard = response.data['leaderboard']
        self.assertEqual(len(leaderboard), 3)
        self.assertEqual(leaderboard[0]['score'], 5000)
        self.assertEqual(leaderboard[1]['score'], 3000)
        self.assertEqual(leaderboard[2]['score'], 1000)
