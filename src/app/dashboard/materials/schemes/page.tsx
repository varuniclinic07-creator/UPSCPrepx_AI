'use client';

import { useState, useEffect } from 'react';
import { Landmark, Search, Building2, Users, Calendar, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { Input } from '@/components/ui/input';

interface Scheme {
    id: string;
    name: string;
    ministry: string;
    description: string;
    beneficiaries: string;
    status: 'active' | 'inactive';
    launchDate: string;
}

const ministries = ['Agriculture', 'Finance', 'Health', 'Education', 'Rural Development'];

const ministryColors: Record<string, string> = {
    'Agriculture': 'green',
    'Finance': 'amber',
    'Health': 'red',
    'Education': 'blue',
    'Rural Development': 'purple',
};

// Static class mappings for Tailwind compilation
const ministryClasses: Record<string, { bg: string; text: string; badge: string }> = {
    'Agriculture': { bg: 'bg-green-500/10', text: 'text-green-500', badge: 'bg-green-500/10 text-green-500 border-green-500/20' },
    'Finance': { bg: 'bg-amber-500/10', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    'Health': { bg: 'bg-red-500/10', text: 'text-red-500', badge: 'bg-red-500/10 text-red-500 border-red-500/20' },
    'Education': { bg: 'bg-blue-500/10', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    'Rural Development': { bg: 'bg-purple-500/10', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

const defaultClasses = { bg: 'bg-primary/10', text: 'text-primary', badge: 'bg-primary/10 text-primary border-primary/20' };

const mockSchemes: Scheme[] = [
    {
        id: '1',
        name: 'PM-KISAN',
        ministry: 'Agriculture',
        description: 'Pradhan Mantri Kisan Samman Nidhi - Direct income support of ₹6000/year to farmer families',
        beneficiaries: 'Small and marginal farmers with cultivable land',
        status: 'active',
        launchDate: '2019-02-01'
    },
    {
        id: '2',
        name: 'Ayushman Bharat',
        ministry: 'Health',
        description: 'World\'s largest health insurance scheme providing ₹5 lakh coverage per family per year',
        beneficiaries: 'Poor and vulnerable families identified by SECC data',
        status: 'active',
        launchDate: '2018-09-23'
    },
    {
        id: '3',
        name: 'PM MUDRA Yojana',
        ministry: 'Finance',
        description: 'Micro Units Development & Refinance Agency - Loans up to ₹10 lakh for small enterprises',
        beneficiaries: 'Non-corporate, non-farm small/micro enterprises',
        status: 'active',
        launchDate: '2015-04-08'
    },
    {
        id: '4',
        name: 'Samagra Shiksha',
        ministry: 'Education',
        description: 'Integrated scheme for school education covering pre-school to Class 12',
        beneficiaries: 'Students in government and government-aided schools',
        status: 'active',
        launchDate: '2018-04-01'
    },
];

export default function SchemesPage() {
    const [schemes, setSchemes] = useState<Scheme[]>(mockSchemes);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMinistry, setSelectedMinistry] = useState('all');

    const filteredSchemes = schemes.filter(scheme => {
        const matchesSearch = scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMinistry = selectedMinistry === 'all' || scheme.ministry === selectedMinistry;
        return matchesSearch && matchesMinistry;
    });

    const activeSchemes = schemes.filter(s => s.status === 'active').length;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 self-start w-fit">
                    <Landmark className="w-3 h-3 text-teal-500" />
                    <span className="text-teal-500 text-xs font-bold uppercase tracking-wider">Government Database</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Government <span className="font-bold text-gradient">Schemes</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Comprehensive database of welfare schemes for UPSC preparation
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Schemes" value={schemes.length} icon={Landmark} glowColor="hsl(168, 76%, 36%)" />
                <StatCard title="Active Schemes" value={activeSchemes} icon={CheckCircle2} glowColor="hsl(142, 76%, 36%)" />
                <StatCard title="Ministries" value={ministries.length} icon={Building2} glowColor="hsl(var(--primary))" />
                <StatCard title="Beneficiaries" value="50Cr+" icon={Users} glowColor="hsl(var(--accent))" />
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <BorderBeamInput className="flex-1" active={searchQuery.length > 0}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search schemes by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-muted/30 border-border/50 rounded-xl"
                        />
                    </div>
                </BorderBeamInput>

                <div className="relative">
                    <select
                        value={selectedMinistry}
                        onChange={(e) => setSelectedMinistry(e.target.value)}
                        className="appearance-none h-12 px-4 pr-10 bg-card/40 border border-border/50 rounded-xl text-foreground font-medium cursor-pointer hover:border-teal-500/30 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    >
                        <option value="all">All Ministries</option>
                        {ministries.map(ministry => (
                            <option key={ministry} value={ministry}>{ministry}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Schemes List */}
            {filteredSchemes.length === 0 ? (
                <div className="bento-card text-center p-12">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                        <Landmark className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No schemes found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filter</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSchemes.map(scheme => {
                        const colorClasses = ministryClasses[scheme.ministry] || defaultClasses;

                        return (
                            <div
                                key={scheme.id}
                                className="group p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-teal-500/30 hover:bg-card/80 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center shrink-0`}>
                                            <Landmark className={`w-6 h-6 ${colorClasses.text}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground group-hover:text-teal-500 transition-colors">
                                                {scheme.name}
                                            </h3>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses.badge}`}>{scheme.ministry}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${scheme.status === 'active'
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {scheme.status === 'active' ? '✓ Active' : 'Inactive'}
                                    </span>
                                </div>

                                <p className="text-muted-foreground mb-4 leading-relaxed">
                                    {scheme.description}
                                </p>

                                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span><strong className="text-foreground">Beneficiaries:</strong> {scheme.beneficiaries}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span><strong className="text-foreground">Launched:</strong> {new Date(scheme.launchDate).toLocaleDateString('en-IN', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/30">
                                    <button className="text-teal-500 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        View Full Details
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
