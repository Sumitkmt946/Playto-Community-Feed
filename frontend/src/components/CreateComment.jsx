import { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api/api';

export default function CreateComment({ postId, parentId = null, onCommentCreated, onCancel }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const payload = {
                post: postId,
                content: content,
                parent: parentId
            };

            const res = await api.post('comments/', payload);
            onCommentCreated(res.data);
            setContent('');
        } catch (err) {
            console.error(err);
            alert('Failed to comment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={parentId ? "Write a reply..." : "Write a comment..."}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                    autoFocus={!!parentId}
                />
            </div>
            <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
            </button>
            {parentId && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                    Cancel
                </button>
            )}
        </form>
    );
}
