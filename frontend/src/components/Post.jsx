import { useState } from 'react';
import LikeButton from './LikeButton';
import Comment from './Comment';
import CreateComment from './CreateComment';
import { MessageCircle, Trash2 } from 'lucide-react';
import api from '../api/api';
import { timeAgo } from '../utils';

export default function Post({ post: initialPost }) {
    // ... [state] ...
    const [post, setPost] = useState(initialPost);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [loaded, setLoaded] = useState(!!post.comments);

    const currentUser = localStorage.getItem('username');
    const isAuthor = currentUser === post.author.username;

    // ... [handlers] ...
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`posts/${post.id}/`);
            setIsDeleted(true);
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete post");
        }
    };

    const toggleComments = async () => {
        if (!showComments && !loaded) {
            setLoadingComments(true);
            try {
                const res = await api.get(`posts/${post.id}/`);
                setComments(res.data.comments);
                setLoaded(true);
            } catch (err) {
                console.error("Failed to load comments", err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleCommentCreated = (newComment) => {
        setComments([...comments, newComment]);
    };

    const replyCount = loaded
        ? comments.reduce((acc, c) => acc + 1 + countReplies(c), 0)
        : 'Comments';

    if (isDeleted) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {post.author.username[0].toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors">{post.author.username}</h3>
                            <span className="text-xs text-slate-400 font-medium">{timeAgo(post.created_at)}</span>
                        </div>
                    </div>

                    {isAuthor && (
                        <button
                            onClick={handleDelete}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Delete Post"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                <p className="text-slate-700 mb-5 whitespace-pre-line leading-relaxed text-[15px]">{post.content}</p>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                    <LikeButton
                        initialLikes={post.like_count}
                        initialLiked={post.is_liked}
                        type="post"
                        id={post.id}
                    />

                    <button
                        onClick={toggleComments}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors px-2 py-1 rounded-lg ${showComments ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-50'
                            }`}
                    >
                        <MessageCircle size={18} />
                        <span>{replyCount}</span>
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="bg-slate-50/50 p-5 border-t border-slate-100">
                    <div className="mb-6">
                        <CreateComment postId={post.id} onCommentCreated={handleCommentCreated} />
                    </div>

                    {loadingComments ? (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <Comment key={comment.id} comment={comment} postId={post.id} />
                            ))}
                            {comments.length === 0 && (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm">No comments yet. Be the first to say something!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function countReplies(comment) {
    if (!comment.replies) return 0;
    return comment.replies.length + comment.replies.reduce((acc, c) => acc + countReplies(c), 0);
}
