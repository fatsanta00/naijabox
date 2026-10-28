'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'moderator';
  createdAt: string;
}

export default function UsersPageClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setError('Only the owner can manage moderator accounts.');
        return;
      }
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMsg({ type: 'error', text: data.error || 'Failed to create moderator' });
      } else {
        setCreateMsg({ type: 'success', text: `Moderator ${data.data.email} created.` });
        setNewEmail('');
        setNewPassword('');
        loadUsers();
      }
    } catch {
      setCreateMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`Remove moderator ${userEmail}? They will lose admin access.`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert(data.error || 'Failed to remove moderator.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Moderator Management</h1>
        <p className="text-sm text-naija-muted mt-1">
          Moderators can approve, reject and edit questions. They cannot manage users, settings, or PriceCheck data.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Create Moderator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Moderator</CardTitle>
          <CardDescription>Create a new moderator account. Share the credentials securely — they cannot reset passwords themselves.</CardDescription>
        </CardHeader>
        <CardContent>
          {createMsg && (
            <div className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
              createMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {createMsg.text}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-naija-muted uppercase tracking-wider" htmlFor="new-email">
                  Email Address
                </label>
                <input
                  id="new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="moderator@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-naija-muted uppercase tracking-wider" htmlFor="new-password">
                  Password (min. 8 characters)
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Strong password"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Creating…' : '+ Add Moderator'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">All Admin Accounts</h2>
        {loading ? (
          <div className="text-sm text-naija-muted animate-pulse">Loading users…</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 rounded-xl bg-naija-card border border-naija-border/60"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{u.email}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                      u.role === 'owner'
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-naija-muted">
                    Added {new Date(u.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {u.role === 'moderator' && (
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    className="min-h-[44px] px-4 text-xs font-semibold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    aria-label={`Remove moderator ${u.email}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
