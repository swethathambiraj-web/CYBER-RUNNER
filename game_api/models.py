from django.db import models
from django.contrib.auth.models import User

class Character(models.Model):
    name = models.CharField(max_length=64)
    slug = models.SlugField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    cost = models.PositiveIntegerField(default=0, help_text="Cost in coins to unlock (0 = free/starter)")
    color_primary = models.CharField(max_length=32, default='#00e5ff', help_text="Primary hex color")
    color_secondary = models.CharField(max_length=32, default='#ff007f', help_text="Secondary/accent hex color")
    speed_multiplier = models.FloatField(default=1.0, help_text="Base speed modifier (e.g. 1.05 = +5% speed)")
    coin_multiplier = models.FloatField(default=1.0, help_text="Coin value modifier (e.g. 1.2 = +20% coins)")
    icon_emoji = models.CharField(max_length=16, default='🏃')
    sprite_key = models.CharField(max_length=64, default='char_runner')
    is_default = models.BooleanField(default=False, help_text="Is this character unlocked by default for new players?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cost', 'name']

    def __str__(self):
        return f"{self.icon_emoji} {self.name} ({self.cost} coins)"


class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    total_coins = models.PositiveIntegerField(default=0)
    high_score = models.PositiveIntegerField(default=0)
    total_runs = models.PositiveIntegerField(default=0)
    total_distance = models.PositiveIntegerField(default=0)
    active_character = models.ForeignKey(
        Character,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_players'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username} (Coins: {self.total_coins}, High: {self.high_score})"

    @property
    def username(self):
        return self.user.username


class PlayerUnlock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='unlocks')
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='unlocked_by')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'character')
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user.username} unlocked {self.character.name}"


class PowerUpConfig(models.Model):
    POWER_TYPES = [
        ('magnet', 'Magnet (Coin Suction)'),
        ('shield', 'Shield (Hit Absorption)'),
        ('speed_boost', 'Speed Boost (Nitro Runner)'),
        ('multiplier', '2x Score Multiplier'),
    ]

    name = models.CharField(max_length=64)
    power_type = models.CharField(max_length=32, choices=POWER_TYPES, unique=True)
    duration_seconds = models.FloatField(default=10.0)
    spawn_weight = models.FloatField(default=1.0, help_text="Relative spawn frequency weight")
    description = models.TextField(blank=True)
    icon_emoji = models.CharField(max_length=16, default='⚡')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.icon_emoji} {self.name} ({self.duration_seconds}s)"


class Score(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scores')
    guest_name = models.CharField(max_length=50, blank=True, default='Guest Runner')
    score = models.PositiveIntegerField(default=0)
    coins_collected = models.PositiveIntegerField(default=0)
    distance_traveled = models.PositiveIntegerField(default=0)
    character_used = models.ForeignKey(Character, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        runner_name = self.user.username if self.user else (self.guest_name or 'Guest')
        return f"{runner_name}: {self.score} pts ({self.coins_collected} coins, {self.distance_traveled}m)"
