from django.contrib import admin
from game_api.models import Character, PlayerProfile, PlayerUnlock, PowerUpConfig, Score

@admin.action(description="Grant +500 Bonus Coins to selected players")
def grant_500_coins(modeladmin, request, queryset):
    for profile in queryset:
        profile.total_coins += 500
        profile.save()

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'cost', 'speed_multiplier', 'coin_multiplier', 'is_default', 'icon_emoji', 'color_primary')
    list_filter = ('is_default',)
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_coins', 'high_score', 'total_runs', 'total_distance', 'active_character', 'updated_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('active_character', 'created_at')
    actions = [grant_500_coins]


@admin.register(PlayerUnlock)
class PlayerUnlockAdmin(admin.ModelAdmin):
    list_display = ('user', 'character', 'unlocked_at')
    search_fields = ('user__username', 'character__name')
    list_filter = ('character', 'unlocked_at')


@admin.register(PowerUpConfig)
class PowerUpConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'power_type', 'duration_seconds', 'spawn_weight', 'icon_emoji', 'is_active')
    list_filter = ('power_type', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ('get_player', 'score', 'coins_collected', 'distance_traveled', 'character_used', 'created_at')
    list_filter = ('created_at', 'character_used')
    search_fields = ('user__username', 'guest_name')
    ordering = ('-score',)

    def get_player(self, obj):
        return obj.user.username if obj.user else f"Guest ({obj.guest_name})"
    get_player.short_description = 'Player'
