from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from game_api.models import Character, PowerUpConfig, Score, PlayerProfile, PlayerUnlock

class Command(BaseCommand):
    help = 'Seeds default characters, power-ups, demo players, and sample leaderboard scores'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Seeding game data..."))

        # 1. Characters
        characters_data = [
            {
                'name': 'Retro Dash',
                'slug': 'retro-dash',
                'description': 'The agile starter runner. Well-balanced and ready for the rails!',
                'cost': 0,
                'color_primary': '#00e5ff',
                'color_secondary': '#ff007f',
                'speed_multiplier': 1.0,
                'coin_multiplier': 1.0,
                'icon_emoji': '🏃',
                'sprite_key': 'char_retro_dash',
                'is_default': True,
            },
            {
                'name': 'Neon Cyberpunk',
                'slug': 'neon-cyberpunk',
                'description': 'Equipped with high-tech turbo sneakers. +8% Speed & +10% Bonus Coins!',
                'cost': 150,
                'color_primary': '#ff007f',
                'color_secondary': '#00ffff',
                'speed_multiplier': 1.08,
                'coin_multiplier': 1.10,
                'icon_emoji': '⚡',
                'sprite_key': 'char_neon_cyberpunk',
                'is_default': False,
            },
            {
                'name': 'Shadow Ninja',
                'slug': 'shadow-ninja',
                'description': 'Master of shadows with ultra-fast lane reflexes. +15% Speed & +25% Coins!',
                'cost': 350,
                'color_primary': '#3a0ca3',
                'color_secondary': '#4cc9f0',
                'speed_multiplier': 1.15,
                'coin_multiplier': 1.25,
                'icon_emoji': '🥷',
                'sprite_key': 'char_shadow_ninja',
                'is_default': False,
            },
            {
                'name': 'Golden King',
                'slug': 'golden-king',
                'description': 'Royalty on the run! Collects 2X DOUBLE coins on all runs!',
                'cost': 750,
                'color_primary': '#ffd700',
                'color_secondary': '#ff8800',
                'speed_multiplier': 1.10,
                'coin_multiplier': 2.00,
                'icon_emoji': '👑',
                'sprite_key': 'char_golden_king',
                'is_default': False,
            },
            {
                'name': 'Mecha Bot',
                'slug': 'mecha-bot',
                'description': 'Maximum overdrive cybernetic chassis! +25% Speed & +50% Coins!',
                'cost': 1200,
                'color_primary': '#7928ca',
                'color_secondary': '#00dfd8',
                'speed_multiplier': 1.25,
                'coin_multiplier': 1.50,
                'icon_emoji': '🤖',
                'sprite_key': 'char_mecha_bot',
                'is_default': False,
            },
        ]

        chars_created = 0
        for data in characters_data:
            char, created = Character.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                chars_created += 1

        self.stdout.write(self.style.SUCCESS(f"Characters initialized ({len(characters_data)} total, {chars_created} newly created)."))

        # 2. Power-ups
        powerups_data = [
            {
                'name': 'Magnet',
                'power_type': 'magnet',
                'duration_seconds': 10.0,
                'spawn_weight': 1.0,
                'description': 'Magnetic coin puller! Collects all gold coins nearby automatically.',
                'icon_emoji': '🧲',
                'is_active': True,
            },
            {
                'name': 'Shield',
                'power_type': 'shield',
                'duration_seconds': 12.0,
                'spawn_weight': 0.8,
                'description': 'Protective energy field. Absorbs 1 fatal obstacle crash!',
                'icon_emoji': '🛡️',
                'is_active': True,
            },
            {
                'name': 'Speed Boost',
                'power_type': 'speed_boost',
                'duration_seconds': 6.0,
                'spawn_weight': 0.6,
                'description': 'Rocket nitro boost! Smashes obstacles in your path with high velocity.',
                'icon_emoji': '🚀',
                'is_active': True,
            },
            {
                'name': '2X Multiplier',
                'power_type': 'multiplier',
                'duration_seconds': 15.0,
                'spawn_weight': 0.9,
                'description': 'Score & Coin Doubler! 2x all points and gold while active.',
                'icon_emoji': '✨',
                'is_active': True,
            },
        ]

        for p_data in powerups_data:
            PowerUpConfig.objects.update_or_create(
                power_type=p_data['power_type'],
                defaults=p_data
            )
        self.stdout.write(self.style.SUCCESS(f"Power-ups initialized ({len(powerups_data)} total)."))

        # 3. Create Admin / Demo Users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@runnergame.com', 'is_staff': True, 'is_superuser': True}
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' created (password: admin123)."))
        
        # Ensure admin has profile and coins
        admin_profile, _ = PlayerProfile.objects.get_or_create(user=admin_user)
        admin_profile.total_coins = max(admin_profile.total_coins, 5000)
        admin_profile.high_score = max(admin_profile.high_score, 12500)
        admin_profile.save()

        # Unlock all characters for admin
        for ch in Character.objects.all():
            PlayerUnlock.objects.get_or_create(user=admin_user, character=ch)

        # 4. Sample Hall of Fame Leaderboard entries
        default_char = Character.objects.get(slug='retro-dash')
        ninja_char = Character.objects.get(slug='shadow-ninja')
        mecha_char = Character.objects.get(slug='mecha-bot')
        golden_char = Character.objects.get(slug='golden-king')

        sample_scores = [
            {'guest_name': 'CyberPhantom', 'score': 18450, 'coins_collected': 240, 'distance_traveled': 3650, 'character_used': mecha_char},
            {'guest_name': 'NeonViper', 'score': 14200, 'coins_collected': 195, 'distance_traveled': 2890, 'character_used': ninja_char},
            {'guest_name': 'MidasRunner', 'score': 11800, 'coins_collected': 380, 'distance_traveled': 2200, 'character_used': golden_char},
            {'guest_name': 'PixelSpeedster', 'score': 9450, 'coins_collected': 130, 'distance_traveled': 1950, 'character_used': default_char},
            {'guest_name': 'TrackBlazer', 'score': 7600, 'coins_collected': 95, 'distance_traveled': 1580, 'character_used': default_char},
            {'user': admin_user, 'score': 12500, 'coins_collected': 210, 'distance_traveled': 2600, 'character_used': mecha_char},
        ]

        if Score.objects.count() == 0:
            for s in sample_scores:
                Score.objects.create(**s)
            self.stdout.write(self.style.SUCCESS(f"Sample leaderboard entries populated ({len(sample_scores)} scores)."))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
