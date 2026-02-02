import { useState } from 'react';
import LikeButton from './LikeButton';
import CreateComment from './CreateComment';
import { MessageSquare, Trash2 } from 'lucide-react';
import api from '../api/api';
import { timeAgo } from '../utils';

export default function Comment({ comment, depth = 0, postId }) {
    const [isReplying, setIsReplying] = useState(false);
    // ... [state] ...
    const [replies, setReplies] = useState(comment.replies || []);
    const [isDeleted, setIsDeleted] = useState(false);
    const isRoot = depth === 0;

    const currentUser = localStorage.getItem('username');
    const isAuthor = currentUser === comment.author.username;

    // ... [handlers] ...
    const handleReplyCreated = (newReply) => {
        setReplies([...replies, newReply]);
        setIsReplying(false);
    };

    const handleDelete = async () => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`comments/${comment.id}/`);
            setIsDeleted(true);
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete comment");
        }
    };

    if (isDeleted) return (
        <div className={`text-sm text-slate-400 italic py-2 ${!isRoot ? 'mt-4' : ''}`}>
            Comment deleted.
        </div>
    );

    return (
        <div className={`relative ${isRoot ? '' : 'mt-4'}`}>
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs text-slate-600 font-bold shrink-0 z-10">
                        {comment.author.username[0].toUpperCase()}
                    </div>
                    {/* Thread line */}
                    {replies.length > 0 && (
                        <div className={`w-0.5 bg-slate-200/80 grow mt-1 mb-2 rounded-full`}></div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`group rounded-2xl p-4 transition-colors ${isRoot ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200/50' : 'bg-transparent hover:bg-slate-50'
                        }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-sm text-slate-800 tracking-tight">{comment.author.username}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 tabular-nums">{timeAgo(comment.created_at)}</span>
                                {isAuthor && (
                                    <button
                                        onClick={handleDelete}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Comment"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-[15px] text-slate-700 leading-relaxed mb-3">{comment.content}</p>

                        <div className="flex items-center gap-4">
                            <LikeButton
                                initialLikes={comment.like_count}
                                initialLiked={comment.is_liked}
                                type="comment"
                                id={comment.id}
                            />
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                <MessageSquare size={14} />
                                <span>Reply</span>
                            </button>
                        </div>

                        {isReplying && (
                            <CreateComment
                                postId={postId}
                                parentId={comment.id}
                                onCommentCreated={handleReplyCreated}
                                onCancel={() => setIsReplying(false)}
                            />
                        )}
                    </div>

                    {/* Recursive Rendering */}
                    {replies.length > 0 && (
                        <div className="pl-4 mt-1 relative">
                            <div className="space-y-0">
                                {replies.map(reply => (
                                    <Comment key={reply.id} comment={reply} depth={depth + 1} postId={postId} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
