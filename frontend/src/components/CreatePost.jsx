import { useState } from 'react';
import { Send, PenLine } from 'lucide-react';
import api from '../api/api';

export default function CreatePost({ onPostCreated }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('posts/', { content });
            onPostCreated(res.data);
            setContent('');
            setIsFocused(false);
        } catch (err) {
            console.error(err);
            alert('Failed to post. Are you logged in?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border mb-8 transition-all duration-300 ${isFocused ? 'ring-2 ring-indigo-500/20 border-indigo-200 shadow-md' : 'border-slate-200'
            }`}>
            <form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-1">
                        <PenLine size={20} />
                    </div>
                    <div className="flex-1">
                        <textarea
                            className="w-full resize-none outline-none text-slate-800 placeholder-slate-400 text-lg bg-transparent py-2 min-h-[80px]"
                            placeholder="What's sparking your interest today?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => !content.trim() && setIsFocused(false)}
                        ></textarea>

                        {(isFocused || content) && (
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 rounded-md bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-100 uppercase tracking-wider">Markdown Supported</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !content.trim()}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                                >
                                    <span>{loading ? 'Posting...' : 'Post Update'}</span>
                                    {!loading && <Send size={14} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
