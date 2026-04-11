'use client';

import Link from 'next/link';
import { ArrowLeft, Users, CreditCard, TrendingUp } from 'lucide-react';

const stats = [
    { label: 'Total Subscribers', value: '1,247', icon: Users, color: 'text-blue-500' },
    { label: 'Active Premium', value: '342', icon: CreditCard, color: 'text-green-500' },
    { label: 'MRR', value: '₹1,71,000', icon: TrendingUp, color: 'text-purple-500' },
];

const mockSubs = [
    { user: 'student1@example.com', plan: 'Premium', status: 'active', since: '2024-01-01', expires: '2025-01-01' },
    { user: 'student2@example.com', plan: 'Free', status: 'active', since: '2024-01-10', expires: '-' },
    { user: 'student3@example.com', plan: 'Premium', status: 'expired', since: '2023-06-01', expires: '2024-01-01' },
    { user: 'student4@example.com', plan: 'Trial', status: 'active', since: '2024-01-12', expires: '2024-01-26' },
];

export default function AdminSubscriptionsPage() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="text-2xl font-bold">Subscriptions</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="rounded-xl border bg-card p-5 flex items-center gap-4">
                        <s.icon className={`w-8 h-8 ${s.color}`} />
                        <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
                    </div>
                ))}
            </div>
            <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                        <th className="text-left p-3 font-medium">User</th>
                        <th className="text-left p-3 font-medium">Plan</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Since</th>
                        <th className="text-left p-3 font-medium">Expires</th>
                    </tr></thead>
                    <tbody>{mockSubs.map((s, i) => (
                        <tr key={i} className="border-t">
                            <td className="p-3">{s.user}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{s.plan}</span></td>
                            <td className="p-3">{s.status === 'active' ? <span className="text-green-500">Active</span> : <span className="text-red-500">Expired</span>}</td>
                            <td className="p-3 text-muted-foreground">{s.since}</td>
                            <td className="p-3 text-muted-foreground">{s.expires}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
