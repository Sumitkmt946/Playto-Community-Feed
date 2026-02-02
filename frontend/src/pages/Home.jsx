import Feed from '../components/Feed';
import Leaderboard from '../components/Leaderboard';

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Feed />
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <Leaderboard />
                    </div>
                </div>
            </div>
        </div>
    );
}
