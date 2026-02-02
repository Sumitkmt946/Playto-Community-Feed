import { ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import api from '../api/api';

export default function LikeButton({ initialLikes, initialLiked, type, id }) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [loading, setLoading] = useState(false);

    const handleLike = async () => {
        if (loading) return;
        setLoading(true);

        // Optimistic update
        const previousLikes = likes;
        const previousIsLiked = isLiked;

        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);

        try {
            const endpoint = type === 'post'
                ? `posts/${id}/like/`
                : `comments/${id}/like/`;

            const response = await api.post(endpoint);
            // Ensure sync with server
            setLikes(response.data.likes);
        } catch (error) {
            console.error('Like failed', error);
            // Revert on error
            setLikes(previousLikes);
            setIsLiked(previousIsLiked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                }`}
        >
            <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{likes}</span>
        </button>
    );
}
