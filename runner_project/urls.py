"""
URL configuration for runner_project.
"""
from django.contrib import admin
from django.urls import path, include
from game_api.views import (
    IndexView,
    LeaderboardPageView,
    LoginPageView,
    SignupPageView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('game_api.urls')),
    
    # Web views
    path('', IndexView.as_view(), name='game-home'),
    path('leaderboard/', LeaderboardPageView.as_view(), name='leaderboard-page'),
    path('login/', LoginPageView.as_view(), name='login-page'),
    path('signup/', SignupPageView.as_view(), name='signup-page'),
]
