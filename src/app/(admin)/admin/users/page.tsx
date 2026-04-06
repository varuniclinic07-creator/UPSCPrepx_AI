/**
 * Admin Users Management Page
 * 
 * Master Prompt v8.0 - F18 Admin Mode
 * - List users, Search, Suspend, Ban
 * - Secure access (Middleware checks role)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Filter, Download } from 'lucide-react';

interface User {
    id: string;
    email: string;
    role: 'user' | 'admin';
    status: 'active' | 'suspended' | 'banned';
    xp: number;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        // Mock Data for demonstration
        const mockUsers: User[] = Array.from({ length: 10 }).map((_, i) => ({
            id: `uid_${i}`,
            email: `student${i}@upsc.ai`,
            role: i === 0 ? 'admin' : 'user',
            status: i === 3 ? 'suspended' : 'active',
            xp: Math.floor(Math.random() * 5000),
            createdAt: new Date().toISOString()
        }));
        setUsers(mockUsers);
        setLoading(false);
    }, []);

    const handleAction = async (userId: string, action: 'suspend' | 'ban' | 'activate' | 'grant_xp') => {
        console.log(`Performing ${action} on ${userId}`);
        // API call: await fetch(`/api/admin/users/${userId}`, { method: 'POST', body: ... })
        alert(`User ${userId} has been ${action}d.`);
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-saffron-600" />
                        User Management
                    </h1>
                    <p className="text-gray-500">View, Search, and Manage all registered users</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by email or user ID..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            <th className="p-4">User</th>
                            <th className="p-4">XP / Level</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-600 font-bold text-xs">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{user.email}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{user.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium text-gray-900">{user.xp.toLocaleString()} XP</div>
                                    <div className="text-xs text-gray-500">Lvl {Math.floor(user.xp / 500) + 1}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase 
                                        ${user.status === 'active' ? 'bg-green-100 text-green-700' : 
                                          user.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 
                                          'bg-red-100 text-red-700'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="relative inline-block">
                                        <button onClick={() => setSelectedUser(user.id)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        {selectedUser === user.id && (
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                                                <button onClick={() => handleAction(user.id, 'grant_xp')} className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50">Grant XP</button>
                                                <button onClick={() => handleAction(user.id, 'suspend')} className={`w-full px-4 py-2 text-left text-xs hover:bg-gray-50 ${user.status === 'suspended' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button onClick={() => handleAction(user.id, 'ban')} className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <Trash2 className="w-3 h-3" /> Ban User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}