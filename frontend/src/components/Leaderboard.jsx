import { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import api from '../api/api';

export default function Leaderboard() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('leaderboard/');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -mr-16 -mt-16"></div>

            <div className="flex items-center gap-2.5 mb-2 relative z-10">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <Trophy size={20} />
                </div>
                <h2 className="font-bold text-slate-800 text-lg">Leaderboard</h2>
            </div>
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={14} className="text-green-500" />
                <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Live • Last 24 Hours</p>
            </div>

            <div className="space-y-4 relative z-10">
                {users.map((user, index) => (
                    <div key={user.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-transform group-hover:scale-110 ${index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow' :
                                        'bg-slate-100 text-slate-500'
                                }`}>
                                {index + 1}
                            </span>
                            <span className="font-semibold text-slate-700">{user.username}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-bold text-indigo-600">{user.karma_24h}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase">Karma</span>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-sm text-slate-400 italic">No activity yet today.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
