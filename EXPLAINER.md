# Playto Community Feed - Explainer

## 1. The Tree (Efficient Nested Comments)

**Modeling:**
I used the **Adjacency List** pattern (`parent = ForeignKey('self')`) for simplicity and compatibility with any RDBMS. While MPTT or Closure Tables are faster for deep reads, Adjacency List is sufficient for "Reddit-style" threads if fetched correctly.

**Serialization (The N+1 Fix):**
To avoid N+1 queries (fetching replies for each comment), I implemented an **in-memory tree construction** strategy:
1. **Fetch All**: Query all comments for a post in `O(1)` query using `Comment.objects.filter(post_id=X)`.
2. **Hash Map**: Convert list to a dictionary `{id: comment}` in `O(N)`.
3. **Link**: Iterate through comments and append them to their parent's `_prefetched_replies` list in `O(N)`.
4. **Serialize**: The `CommentSerializer` recursively uses these attached lists instead of querying the DB.

**Result**: Loading a thread with 1000 comments takes exactly **2 queries** (1 for Post, 1 for Comments), regardless of depth.

## 2. The Math (Leaderboard)

The leaderboard calculates "Karma earned in the last 24 hours". Storing a static "daily_karma" field is prone to drift.

**SQL Logic in Django:**
```python
cutoff = timezone.now() - timedelta(hours=24)

User.objects.filter(
    karma_transactions__created_at__gte=cutoff
).annotate(
    karma_24h=Sum('karma_transactions__points')
).order_by('-karma_24h')[:5]
```

This aggregates the `KarmaTransaction` table (indexed on `created_at`) to sum points dynamically.

**Concurrency:**
For the "Like" buttons, I used `transaction.atomic()` and `select_for_update()` on the `Like` model to lock rows during updates. The database-level unique constraint `(user, content_type, object_id)` acts as the final guardrail against double-counting.

## 3. The AI Audit

**Bug Found:**
Initially, the AI suggested using `prefetch_related` on the `replies` field in the recursive serializer.
**Why it was bad:** Django's `prefetch_related` does a new query for *each level* of depth. For a thread 50 levels deep, that's 51 queries.
**Fix:** I replaced it with the "Fetch All + In-Memory Tree" approach described above, ensuring constant query count.
