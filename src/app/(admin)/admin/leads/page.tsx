'use client';

import { useState, useEffect } from 'react';
import { UserPlus, ChevronLeft, ChevronRight, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    source: string | null;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    notes: string | null;
    created_at: string;
}

const statusColors = {
    new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    contacted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    converted: 'bg-green-500/10 text-green-500 border-green-500/20',
    lost: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const limit = 20;

    useEffect(() => {
        fetchLeads();
    }, [page, filterStatus]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (filterStatus) params.set('status', filterStatus);

            const response = await fetch(`/api/admin/leads?${params}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setLeads(data.leads);
            setTotal(data.total);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (leadId: string, status: string) => {
        try {
            const response = await fetch('/api/admin/leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, status }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success('Lead updated');
            fetchLeads();
        } catch (error) {
            console.error('Error updating lead:', error);
            toast.error('Failed to update lead');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Lead Management</h1>
                    <p className="text-muted-foreground">
                        {total} total leads
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="glass-card">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Leads
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loading size="lg" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No leads found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Lead</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="border-b border-border/50 hover:bg-accent/50">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium text-foreground">{lead.name}</p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {lead.email}
                                                        </span>
                                                        {lead.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {lead.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground">
                                                {lead.source || '—'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[lead.status]}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                                                    className="px-3 py-1 text-sm rounded-lg border border-border bg-background"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="qualified">Qualified</option>
                                                    <option value="converted">Converted</option>
                                                    <option value="lost">Lost</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
