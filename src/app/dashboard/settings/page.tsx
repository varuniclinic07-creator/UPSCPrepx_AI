'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Bell, SlidersHorizontal, Shield, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [optionalSubject, setOptionalSubject] = useState('');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState({
    dailyDigest: true,
    weeklyAlerts: true,
    lectureNotifs: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/user/settings')
      .then(res => res.json())
      .then(data => {
        setName(data.name || '');
        setEmail(data.email || '');
        setOptionalSubject(data.preferences?.optionalSubject || '');
        setLanguage(data.preferences?.language || 'English');
        if (data.preferences?.notifications) {
          setNotifications(data.preferences.notifications);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          preferences: {
            optionalSubject,
            language,
            notifications,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
          {message.text}
        </div>
      )}

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
              <input type="email" value={email} disabled placeholder="you@example.com" className="w-full rounded-md border bg-background px-3 py-2 text-sm opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
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
            {[
              { key: 'dailyDigest' as const, label: 'Daily digest email' },
              { key: 'weeklyAlerts' as const, label: 'Weekly compilation alerts' },
              { key: 'lectureNotifs' as const, label: 'New lecture notifications' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
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
              <select value={optionalSubject} onChange={(e) => setOptionalSubject(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select optional</option>
                <option>Public Administration</option>
                <option>Sociology</option>
                <option>Geography</option>
                <option>History</option>
                <option>Political Science</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
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
            <p className="text-sm text-muted-foreground">Account management options will be available soon.</p>
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
