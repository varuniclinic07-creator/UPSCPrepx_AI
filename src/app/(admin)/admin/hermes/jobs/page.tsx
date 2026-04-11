'use client';

import Link from 'next/link';
import { ArrowLeft, Play, Pause, CheckCircle, XCircle, Clock } from 'lucide-react';

const mockJobs = [
    { id: 'job-001', name: 'Daily CA Fetch', status: 'completed', startedAt: '2024-01-15 06:00', duration: '2m 34s' },
    { id: 'job-002', name: 'Weekly Compilation', status: 'running', startedAt: '2024-01-15 07:00', duration: '1m 12s' },
    { id: 'job-003', name: 'Syllabus Sync', status: 'failed', startedAt: '2024-01-14 23:00', duration: '0m 45s' },
    { id: 'job-004', name: 'Quiz Generation', status: 'queued', startedAt: '-', duration: '-' },
    { id: 'job-005', name: 'Notes Indexing', status: 'completed', startedAt: '2024-01-15 05:30', duration: '5m 10s' },
];

const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    running: <Play className="w-4 h-4 text-blue-500 animate-pulse" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    queued: <Clock className="w-4 h-4 text-yellow-500" />,
};

export default function HermesJobsPage() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/hermes" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="text-2xl font-bold">Hermes Jobs</h1>
            </div>
            <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                        <th className="text-left p-3 font-medium">Job ID</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Started</th>
                        <th className="text-left p-3 font-medium">Duration</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                    </tr></thead>
                    <tbody>{mockJobs.map(job => (
                        <tr key={job.id} className="border-t">
                            <td className="p-3 font-mono text-xs">{job.id}</td>
                            <td className="p-3">{job.name}</td>
                            <td className="p-3 flex items-center gap-2">{statusIcon[job.status]} {job.status}</td>
                            <td className="p-3 text-muted-foreground">{job.startedAt}</td>
                            <td className="p-3">{job.duration}</td>
                            <td className="p-3"><button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80">Retry</button></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
