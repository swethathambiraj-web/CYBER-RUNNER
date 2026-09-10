from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from game_api.models import PlayerProfile, Character, PlayerUnlock

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # Find or use default character
        default_char = Character.objects.filter(is_default=True).first()
        if not default_char:
            default_char = Character.objects.filter(cost=0).first()
        
        profile = PlayerProfile.objects.create(
            user=instance,
            active_character=default_char,
            total_coins=100  # Starter welcome bonus!
        )
        
        # Unlock all default/free characters for this user
        free_chars = Character.objects.filter(cost=0)
        for char in free_chars:
            PlayerUnlock.objects.get_or_create(user=instance, character=char)
            
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
