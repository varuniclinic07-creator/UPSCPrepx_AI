/**
 * Admin Dashboard - Main Overview
 * 
 * Master Prompt v8.0 - F18 Admin Mode
 * - Global Stats, Recent Users, Content Status
 * - Secure access (Middleware checks role)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Users, Video, BookOpen, TrendingUp, AlertCircle, ShieldCheck, Search, BarChart3 } from 'lucide-react';

interface AdminStats {
    total_users: number;
    active_today: number;
    total_videos: number;
    pending_reports: number;
    revenue_mtd: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        // Mock Data for Demo
        setStats({
            total_users: 12450,
            active_today: 890,
            total_videos: 4530,
            pending_reports: 12,
            revenue_mtd: 158000
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-saffron-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500">System Overview & Key Metrics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Search className="w-4 h-4" /> Find User
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Users" value={stats?.total_users.toLocaleString()} icon={Users} color="text-blue-600" trend="+12% month" />
                <StatCard title="Daily Active" value={stats?.active_today.toLocaleString()} icon={TrendingUp} color="text-green-600" trend="142 live" />
                <StatCard title="AI Videos" value={stats?.total_videos.toLocaleString()} icon={Video} color="text-purple-600" trend="5 rendering" />
                <StatCard title="Revenue" value={`₹${stats?.revenue_mtd}`} icon={BarChart3} color="text-saffron-600" trend="MTD" />
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Action Required */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Action Required
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                            <div>
                                <p className="font-medium text-sm text-gray-900">Inappropriate Comment on "Fundamental Rights"</p>
                                <p className="text-xs text-gray-500 mt-1">User: @rahul_123 • Reported 2h ago</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded">Ban</button>
                                <button className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded">Dismiss</button>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                            <div>
                                <p className="font-medium text-sm text-gray-900">Video Generation Failed #8921</p>
                                <p className="text-xs text-gray-500 mt-1">Topic: Indian Geography</p>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded">Retry</button>
                        </div>
                    </div>
                </div>

                {/* Quick Tools */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Tools</h2>
                    <div className="space-y-3">
                        <button className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200">
                            <span className="p-1.5 bg-white rounded shadow-sm">
                                <Video className="w-4 h-4 text-gray-600" />
                            </span>
                            Force Re-render Video
                        </button>
                        <button className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200">
                            <span className="p-1.5 bg-white rounded shadow-sm">
                                <BookOpen className="w-4 h-4 text-gray-600" />
                            </span>
                            Manage Syllabus
                        </button>
                        <button className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200">
                            <span className="p-1.5 bg-white rounded shadow-sm">
                                <TrendingUp className="w-4 h-4 text-gray-600" />
                            </span>
                            Broadcast Push Notification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                <p text-xs text-green-600 font-medium">{trend}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    );
}
