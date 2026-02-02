from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.db.models import Sum, Count, Prefetch, F
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from .models import Post, Comment, Like, KarmaTransaction
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    PostSerializer, CommentSerializer, UserSerializer, LeaderboardUserSerializer
)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('author').order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        # Optimize like status for the list
        user = request.user
        liked_post_ids = set()
        
        target_posts = page if page is not None else queryset
        
        if user.is_authenticated:
            post_ct = ContentType.objects.get_for_model(Post)
            liked_post_ids = set(Like.objects.filter(
                user=user,
                content_type=post_ct,
                object_id__in=[p.id for p in target_posts]
            ).values_list('object_id', flat=True))
            
        for post in target_posts:
            # We don't load comments for the list view to keep it light, 
            # or we could, but let's stick to just fixing likes for now
            post._user_has_liked = post.id in liked_post_ids
            # Ensure comments didn't crash if serializer expects them
            # existing serializer handles missing _prefetched_comments gracefully?
            # get_comments returns [] if not present. correct.
            
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


    def retrieve(self, request, *args, **kwargs):
        """
        Custom retrieve to build the comment tree efficiently.
        Fetching post + 50 comments should be ~2 queries, not 52.
        """
        instance = self.get_object()
        
        # 1. Fetch all comments in a single query
        all_comments = Comment.objects.filter(post=instance)\
            .select_related('author')\
            .order_by('created_at')
        
        # 2. Check likes context for current user
        user = request.user
        liked_comment_ids = set()
        if user.is_authenticated:
            # Check which comments user liked
            comment_ct = ContentType.objects.get_for_model(Comment)
            liked_comment_ids = set(Like.objects.filter(
                user=user, 
                content_type=comment_ct,
                object_id__in=[c.id for c in all_comments]
            ).values_list('object_id', flat=True))
            
            # Check if user liked the post
            post_ct = ContentType.objects.get_for_model(Post)
            instance._user_has_liked = Like.objects.filter(
                user=user, content_type=post_ct, object_id=instance.id
            ).exists()

        # 3. Build the tree in O(N)
        comment_dict = {}
        root_comments = []
        
        # First pass: create nodes
        for comment in all_comments:
            comment._prefetched_replies = [] # buffer for children
            comment._user_has_liked = comment.id in liked_comment_ids
            comment_dict[comment.id] = comment
            
        # Second pass: assign to parents
        for comment in all_comments:
            if comment.parent_id:
                parent = comment_dict.get(comment.parent_id)
                if parent:
                    parent._prefetched_replies.append(comment)
            else:
                root_comments.append(comment)
                
        # Attach to post instance
        instance._prefetched_comments = root_comments
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        # Race condition handling handled in toggle_like helper
        return toggle_like(request.user, post)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        comment = self.get_object()
        return toggle_like(request.user, comment)

def toggle_like(user, obj):
    """
    Handles liking/unliking with race condition protection and karma accounting.
    """
    ct = ContentType.objects.get_for_model(obj)
    
    with transaction.atomic():
        # Lock not strictly needed for 'create' if using unique constraint, 
        # but 'delete' needs care. 
        # Actually unique constraint on (user, ct, object_id) is sufficient for consistency.
        
        like_qs = Like.objects.select_for_update().filter(
            user=user, 
            content_type=ct, 
            object_id=obj.id
        )
        
        if like_qs.exists():
            # UNLIKE
            like = like_qs.first()
            # Remove karma
            KarmaTransaction.objects.filter(like=like).delete()
            like.delete()
            
            # Update counter
            obj.like_count = F('like_count') - 1
            obj.save(update_fields=['like_count'])
            obj.refresh_from_db()
            return Response({'status': 'unliked', 'likes': obj.like_count})
        
        else:
            # LIKE (try/except IntegrityError for race condition edge case if select_for_update wasn't used)
            try:
                like = Like.objects.create(
                    user=user,
                    content_type=ct,
                    object_id=obj.id
                )
                
                # Add Karma
                points = 5 if ct.model == 'post' else 1
                k_type = 'POST_LIKE' if ct.model == 'post' else 'COMMENT_LIKE'
                
                KarmaTransaction.objects.create(
                    user=obj.author,
                    karma_type=k_type,
                    points=points,
                    like=like
                )
                
                # Update counter
                obj.like_count = F('like_count') + 1
                obj.save(update_fields=['like_count'])
                obj.refresh_from_db()
                return Response({'status': 'liked', 'likes': obj.like_count})
                
            except Exception as e:
                # Should catch IntegrityError
                return Response({'error': 'Already liked'}, status=400)

class LeaderboardView(APIView):
    def get(self, request):
        # Calculate leaderboard efficiently
        cutoff = timezone.now() - timedelta(hours=24)
        
        # Aggregate KarmaTransaction sums
        # We want top 5 users based on SUM(points) where transaction.created_at >= cutoff
        
        top_users = User.objects.filter(
            karma_transactions__created_at__gte=cutoff
        ).annotate(
            karma_24h=Sum('karma_transactions__points')
        ).order_by('-karma_24h')[:5]
        
        serializer = LeaderboardUserSerializer(top_users, many=True)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        # customized to return token
        username = request.data.get('username')
        if not username:
             return Response({'error': 'Username required'}, status=400)
        
        user, created = User.objects.get_or_create(username=username)
        # Using DRF token
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({'token': token.key, 'username': user.username, 'id': user.id})

