'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Medal, AlertCircle } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  points: number;
  rank: number | null;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  userRank: number | string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="px-4 py-3"><div className="h-5 w-5 rounded bg-white/[0.06] animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" /></td>
      <td className="px-4 py-3 text-right"><div className="h-4 w-16 rounded bg-white/[0.06] animate-pulse ml-auto" /></td>
      <td className="px-4 py-3 text-right"><div className="h-4 w-12 rounded bg-white/[0.06] animate-pulse ml-auto" /></td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load leaderboard (${res.status})`);
        }
        const data: LeaderboardResponse = await res.json();
        setRankings(data.leaderboard || []);
        setUserRank(data.userRank ?? null);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-display font-bold mb-8">Leaderboard</h1>

      {userRank !== null && !loading && !error && (
        <p className="text-sm text-muted-foreground mb-4">
          Your rank: <span className="font-semibold text-foreground">{userRank}</span>
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rankings.length === 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No leaderboard data yet. Start practicing to appear here!</p>
        </div>
      )}

      {/* Table (loading or with data) */}
      {(loading || rankings.length > 0) && !error && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-16">Rank</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Points</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Level</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : rankings.map((user, index) => {
                    const position = index + 1;
                    const level = Math.floor((user.points || 0) / 500) + 1;
                    return (
                      <tr key={user.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3"><RankBadge rank={position} /></td>
                        <td className="px-4 py-3 text-sm font-medium">{user.name || 'Anonymous'}</td>
                        <td className="px-4 py-3 text-sm text-right">{(user.points || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-muted-foreground">Lv. {level}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
