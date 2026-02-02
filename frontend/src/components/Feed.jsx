import { useEffect, useState } from 'react';
import api from '../api/api';
import Post from './Post';
import CreatePost from './CreatePost';

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await api.get('posts/');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = (newPost) => {
        setPosts([newPost, ...posts]);
    };

    if (loading) return (
        <div className="max-w-2xl mx-auto py-10 space-y-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
                    <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 relative">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Community Feed</h1>
                <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            </div>

            <CreatePost onPostCreated={handlePostCreated} />

            <div className="space-y-6">
                {posts.map(post => (
                    <Post key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
