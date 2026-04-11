'use client';

import Link from 'next/link';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

const rankings = [
  { rank: 1, name: 'Priya Sharma', score: 2850, streak: 45 },
  { rank: 2, name: 'Rahul Verma', score: 2720, streak: 38 },
  { rank: 3, name: 'Ananya Gupta', score: 2680, streak: 42 },
  { rank: 4, name: 'Vikram Singh', score: 2540, streak: 30 },
  { rank: 5, name: 'Sneha Patel', score: 2490, streak: 35 },
  { rank: 6, name: 'Amit Kumar', score: 2410, streak: 28 },
  { rank: 7, name: 'Deepika Reddy', score: 2350, streak: 25 },
  { rank: 8, name: 'Karthik Nair', score: 2280, streak: 22 },
  { rank: 9, name: 'Meera Joshi', score: 2200, streak: 20 },
  { rank: 10, name: 'Arjun Rao', score: 2150, streak: 18 },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-16">Rank</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Score</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Streak</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((user) => (
              <tr key={user.rank} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3"><RankBadge rank={user.rank} /></td>
                <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm text-right">{user.score.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">{user.streak} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
