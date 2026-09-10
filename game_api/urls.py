from django.urls import path
from game_api.views import (
    RegisterApiView,
    LoginApiView,
    LogoutApiView,
    CurrentUserApiView,
    SubmitScoreApiView,
    LeaderboardApiView,
    ProfileApiView,
    ShopListApiView,
    ShopUnlockApiView,
    ShopSelectApiView,
    PowerUpConfigApiView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterApiView.as_view(), name='api-register'),
    path('auth/login/', LoginApiView.as_view(), name='api-login'),
    path('auth/logout/', LogoutApiView.as_view(), name='api-logout'),
    path('auth/me/', CurrentUserApiView.as_view(), name='api-me'),

    # Core Game
    path('scores/', SubmitScoreApiView.as_view(), name='api-submit-score'),
    path('leaderboard/', LeaderboardApiView.as_view(), name='api-leaderboard'),
    path('profile/', ProfileApiView.as_view(), name='api-profile'),

    # Shop & Characters
    path('shop/', ShopListApiView.as_view(), name='api-shop-list'),
    path('shop/unlock/', ShopUnlockApiView.as_view(), name='api-shop-unlock'),
    path('shop/select/', ShopSelectApiView.as_view(), name='api-shop-select'),

    # Configs
    path('powerups/', PowerUpConfigApiView.as_view(), name='api-powerups'),
]
