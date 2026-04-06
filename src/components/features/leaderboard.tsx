'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react';

export function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [userStats, setUserStats] = useState<any>(null);
    const [timeframe, setTimeframe] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
        fetchUserStats();
    }, [timeframe]);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/leaderboard?view=global&timeframe=${timeframe}`);
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const res = await fetch('/api/leaderboard?view=user');
            const data = await res.json();
            setUserStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    };

    return (
        <div className="space-y-6">
            {/* User Stats Card */}
            {userStats && (
                <div className="bento-card p-6">
                    <h3 className="text-lg font-bold mb-4">Your Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{userStats.totalPoints}</p>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">#{userStats.rank}</p>
                            <p className="text-sm text-muted-foreground">Rank</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-500">{userStats.percentile}%</p>
                            <p className="text-sm text-muted-foreground">Percentile</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-amber-500">{userStats.badges?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Badges</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeframe Filter */}
            <div className="flex gap-2">
                {['all', 'weekly', 'monthly'].map(tf => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${timeframe === tf
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border/50 text-foreground hover:border-primary/30'
                            }`}
                    >
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leaderboard */}
            <div className="bento-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Global Leaderboard
                </h3>

                {loading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry.userId}
                                className={`flex items-center justify-between p-4 rounded-xl transition-all ${index < 3
                                        ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20'
                                        : 'bg-muted/20 hover:bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 flex items-center justify-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{entry.userName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {entry.badges?.slice(0, 3).map((badge: string, i: number) => (
                                                <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">{entry.totalPoints}</p>
                                    <p className="text-xs text-muted-foreground">points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {userStats?.recentActivity && userStats.recentActivity.length > 0 && (
                <div className="bento-card p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-2">
                        {userStats.recentActivity.map((activity: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                <p className="text-sm text-foreground">{activity.description}</p>
                                <span className="text-sm font-bold text-green-500">+{activity.points}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
