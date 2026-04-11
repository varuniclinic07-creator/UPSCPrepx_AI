'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Bell, SlidersHorizontal, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Profile */}
        <section className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-3">
            {['Daily digest email', 'Weekly compilation alerts', 'New lecture notifications'].map((label) => (
              <label key={label} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              </label>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Optional subjects</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option>Select optional</option>
                <option>Public Administration</option>
                <option>Sociology</option>
                <option>Geography</option>
                <option>History</option>
                <option>Political Science</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Language</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Account</h2>
          </div>
          <div className="space-y-3">
            <button className="text-sm text-primary hover:underline">Change password</button>
            <br />
            <button className="text-sm text-destructive hover:underline">Delete account</button>
          </div>
        </section>

        <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Save Changes
        </button>
      </div>
    </div>
  );
}
