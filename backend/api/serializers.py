from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Like, KarmaTransaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class LeaderboardUserSerializer(serializers.ModelSerializer):
    karma_24h = serializers.IntegerField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'karma_24h']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'like_count', 'post', 'parent', 'replies', 'is_liked']
        read_only_fields = ['like_count', 'created_at']

    def get_replies(self, obj):
        # This is where the magic happens.
        # If we passed pre-computed children to the context, use them.
        # Otherwise this would cause N+1.
        if hasattr(obj, '_prefetched_replies'):
            return CommentSerializer(obj._prefetched_replies, many=True, context=self.context).data
        return []

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
        # If we prefetched likes, use that
        if hasattr(obj, '_user_has_liked'):
            return obj._user_has_liked
        return False

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'created_at', 'like_count', 'comments', 'is_liked']
        read_only_fields = ['like_count', 'created_at']

    def get_comments(self, obj):
        # We expect the view to pass the root comments with their children attached
        if hasattr(obj, '_prefetched_comments'):
            return CommentSerializer(obj._prefetched_comments, many=True, context=self.context).data
        return []

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
        if hasattr(obj, '_user_has_liked'):
            return obj._user_has_liked
        return False
