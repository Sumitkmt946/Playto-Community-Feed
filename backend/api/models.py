from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    like_count = models.PositiveIntegerField(default=0)
    
    # Enable cascade delete for GenericForeignKey
    likes = GenericRelation('Like')

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    # Adjacency list for threading
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    like_count = models.PositiveIntegerField(default=0)
    
    # Optional level field if we want to limit depth or optimize rendering
    level = models.PositiveIntegerField(default=0)
    
    # Enable cascade delete for GenericForeignKey
    likes = GenericRelation('Like')

    def __str__(self):
        return f"Comment by {self.author.username}"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    
    # Polymorphic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent double likes
        unique_together = ('user', 'content_type', 'object_id')
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

class KarmaTransaction(models.Model):
    KARMA_TYPES = (
        ('POST_LIKE', 'Post Like'),
        ('COMMENT_LIKE', 'Comment Like'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='karma_transactions')
    karma_type = models.CharField(max_length=20, choices=KARMA_TYPES)
    points = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True) # Indexed for 24h queries
    
    # Link to the like that caused this karma (optional but good for audit)
    like = models.ForeignKey(Like, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} gained {self.points} karma"
