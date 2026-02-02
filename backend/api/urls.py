from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, LeaderboardView, RegisterView
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('register/', RegisterView.as_view(), name='register'),
]

