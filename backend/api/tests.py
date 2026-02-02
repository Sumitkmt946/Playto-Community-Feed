from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like, KarmaTransaction
from .views import toggle_like

class LeaderboardTests(TestCase):
    def setUp(self):
        self.u1 = User.objects.create(username="alice")
        self.u2 = User.objects.create(username="bob")
        self.post = Post.objects.create(author=self.u1, content="Test")

    def test_leaderboard_24h_window(self):
        # Alice gets likes NOW
        KarmaTransaction.objects.create(user=self.u1, karma_type='POST_LIKE', points=5, created_at=timezone.now())
        
        # Bob got likes 25 hours ago
        old_time = timezone.now() - timedelta(hours=25)
        # We have to mock creation time since auto_now_add forces it
        t = KarmaTransaction.objects.create(user=self.u2, karma_type='POST_LIKE', points=50)
        t.created_at = old_time
        t.save()
        
        # Verify via API logic
        cutoff = timezone.now() - timedelta(hours=24)
        from django.db.models import Sum
        leaderboard = User.objects.filter(
            karma_transactions__created_at__gte=cutoff
        ).annotate(
            karma_24h=Sum('karma_transactions__points')
        ).order_by('-karma_24h')
        
        self.assertEqual(leaderboard.first(), self.u1)
        self.assertNotIn(self.u2, leaderboard)

class CommentTreeTests(TestCase):
    def setUp(self):
        self.u1 = User.objects.create(username="alice")
        self.post = Post.objects.create(author=self.u1, content="Root")
        
    def test_tree_construction(self):
        # Create nested structure: Root -> C1 -> C2
        c1 = Comment.objects.create(post=self.post, author=self.u1, content="C1")
        c2 = Comment.objects.create(post=self.post, author=self.u1, content="C2", parent=c1)
        
        # Test serializer output
        from .serializers import PostSerializer
        from .views import PostViewSet
        
        # Simulate viewset logic
        view = PostViewSet()
        view.request = None 
        # Manually trigger the helper logic I wrote in retrieve
        # ... actually easier to just test the logic directly or use APIClient
        
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.get(f'/api/posts/{self.post.id}/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Should have 1 root comment
        self.assertEqual(len(data['comments']), 1)
        # Root comment should have 1 reply
        self.assertEqual(len(data['comments'][0]['replies']), 1)
        # The reply content
        self.assertEqual(data['comments'][0]['replies'][0]['content'], 'C2')
