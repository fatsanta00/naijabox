'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { getAllBoxes } from '@/boxes/registry';
import { BoxDefinition } from '@/boxes/types';

interface PlayerUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface SavedResult {
  id: string;
  experienceKey: string;
  experienceTitle: string;
  score: string;
  maxScore: string | null;
  label: string;
  displayText: string;
  createdAt: string;
}

interface AccountStats {
  totalPlayed: number;
  streakDays: number;
  bestReactionMs: number | null;
}

export function AccountPageClient() {
  const [user, setUser] = useState<PlayerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [activeTab, setActiveTab] = useState<'history' | 'favourites'>('history');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<AccountStats>({
    totalPlayed: 0,
    streakDays: 0,
    bestReactionMs: null,
  });
  const [recentResults, setRecentResults] = useState<SavedResult[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [allBoxes, setAllBoxes] = useState<BoxDefinition[]>([]);

  const fetchUserData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/public/auth/me');
      const meJson = await meRes.json();
      if (meJson.success && meJson.user) {
        setUser(meJson.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const fetchHistoryAndFavs = useCallback(async () => {
    try {
      const [histRes, favRes] = await Promise.all([
        fetch('/api/public/account/history'),
        fetch('/api/public/auth/favourites'),
      ]);

      const histJson = await histRes.json();
      if (histJson.success) {
        setStats(histJson.stats);
        setRecentResults(histJson.recentResults || []);
      }

      const favJson = await favRes.json();
      if (favJson.success) {
        setFavourites(favJson.favourites || []);
      }
    } catch (err) {
      console.error('Failed to load history or favourites:', err);
    }
  }, []);

  useEffect(() => {
    setAllBoxes(getAllBoxes());
    (async () => {
      setLoading(true);
      await fetchUserData();
      await fetchHistoryAndFavs();
      setLoading(false);
    })();
  }, [fetchUserData, fetchHistoryAndFavs]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    const endpoint = authMode === 'register' ? '/api/public/auth/register' : '/api/public/auth/login';
    const body = authMode === 'register' ? { email, password, name: name.trim() || undefined } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Authentication failed');
      } else {
        setUser(data.user);
        await fetchHistoryAndFavs();
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/public/auth/logout', { method: 'POST' });
      setUser(null);
      await fetchHistoryAndFavs();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleFavourite = async (boxSlug: string) => {
    if (!user) {
      setAuthMode('signin');
      return;
    }

    try {
      const res = await fetch('/api/public/auth/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxSlug }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isFavourited) {
          setFavourites((prev) => [...prev, boxSlug]);
        } else {
          setFavourites((prev) => prev.filter((s) => s !== boxSlug));
        }
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Loading your NaijaBox account...</p>
      </div>
    );
  }

  // ─── AUTHENTICATED STATE ───────────────────────────────────────────────────
  if (user) {
    const displayName = user.name || user.email.split('@')[0];

    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <h1 className="text-xl sm:text-2xl font-black text-white">{displayName}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Player
                </span>
              </div>
              <p className="text-xs text-naija-muted">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors self-start sm:self-auto"
            >
              Sign Out
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5 text-center">
            <div className="p-3 rounded-xl bg-naija-card border border-white/5">
              <span className="text-xs text-naija-muted block mb-1">🔥 Active Streak</span>
              <span className="text-lg sm:text-xl font-black text-amber-400">
                {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-naija-card border border-white/5">
              <span className="text-xs text-naija-muted block mb-1">🎮 Total Played</span>
              <span className="text-lg sm:text-xl font-black text-brand-400">{stats.totalPlayed}</span>
            </div>
            <div className="p-3 rounded-xl bg-naija-card border border-white/5">
              <span className="text-xs text-naija-muted block mb-1">⚡ Best Reflex</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">
                {stats.bestReactionMs ? `${stats.bestReactionMs}ms` : '--'}
              </span>
            </div>
          </div>
        </Card>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-naija-muted hover:text-white'
            }`}
          >
            Saved Results ({recentResults.length})
          </button>
          <button
            onClick={() => setActiveTab('favourites')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'favourites'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-naija-muted hover:text-white'
            }`}
          >
            Favourite Boxes ({favourites.length})
          </button>
        </div>

        {/* Tab: Saved Results */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {recentResults.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <span className="text-3xl">📦</span>
                <h3 className="font-bold text-white">No saved game results yet</h3>
                <p className="text-xs text-naija-muted max-w-sm mx-auto">
                  Play any quiz, dilemma or speed box. Your completed scores will automatically appear here!
                </p>
                <div className="pt-2">
                  <Link
                    href="/#boxes"
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Play a Box Now
                  </Link>
                </div>
              </Card>
            ) : (
              recentResults.map((r) => (
                <Card key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1 max-w-[70%]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                      {r.experienceTitle}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">{r.label}</h4>
                    <p className="text-xs text-naija-muted">
                      Score: <span className="text-white font-mono">{r.score}</span>
                      {r.maxScore ? ` / ${r.maxScore}` : ''} •{' '}
                      {new Date(r.createdAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/r/${r.id}`}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-brand-300 border border-white/10 flex items-center shrink-0 transition-colors"
                  >
                    View / Share 🔗
                  </Link>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab: Favourites */}
        {activeTab === 'favourites' && (
          <div className="space-y-3">
            <p className="text-xs text-naija-muted px-1">
              Tap the heart on any box to pin your go-to games and tools here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBoxes.map((b) => {
                const isFav = favourites.includes(b.slug);
                return (
                  <Card key={b.slug} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-brand-400">{b.kind}</span>
                        <button
                          onClick={() => toggleFavourite(b.slug)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg hover:scale-110 transition-transform"
                          aria-label={isFav ? `Unfavourite ${b.title}` : `Favourite ${b.title}`}
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{b.title}</h4>
                      <p className="text-xs text-naija-muted line-clamp-2 mt-1">{b.tagline}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <Link
                        href={`/boxes/${b.slug}`}
                        className="inline-flex w-full items-center justify-center min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                      >
                        Play Box ➡️
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── UN-AUTHENTICATED STATE (OPTIONAL SIGN IN / REGISTER) ──────────────────
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="p-6 text-center space-y-3">
        <span className="text-3xl block">🇳🇬</span>
        <h1 className="text-2xl font-black text-white">Save Your NaijaBox Legacy</h1>
        <p className="text-xs sm:text-sm text-naija-muted leading-relaxed">
          Anonymous play is always 100% free with no login required. Creating an account is completely optional — use it
          to preserve your streaks, save quiz scores, and bookmark your favourite boxes.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex rounded-xl bg-black/40 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setFormError(null);
            }}
            className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold transition-all ${
              authMode === 'signin' ? 'bg-brand-500 text-white shadow' : 'text-naija-muted hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setFormError(null);
            }}
            className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold transition-all ${
              authMode === 'register' ? 'bg-brand-500 text-white shadow' : 'text-naija-muted hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1.5 text-left">
              <label htmlFor="name-input" className="block text-xs font-semibold text-gray-300">
                Your Name or Nickname (optional)
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="e.g. Chidi or Oga Boss"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-naija-card border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label htmlFor="email-input" className="block text-xs font-semibold text-gray-300">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-naija-card border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="password-input" className="block text-xs font-semibold text-gray-300">
              Password (min 6 characters)
            </label>
            <input
              id="password-input"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-naija-card border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Button
            type="submit"
            disabled={formSubmitting}
            className="w-full min-h-[48px] font-bold text-sm uppercase tracking-wider"
          >
            {formSubmitting
              ? 'Please wait...'
              : authMode === 'register'
              ? 'Create Account & Save Scores'
              : 'Sign In'}
          </Button>
        </form>
      </Card>

      <div className="text-center pt-2">
        <Link
          href="/#boxes"
          className="text-xs text-naija-muted hover:text-white underline underline-offset-4 min-h-[44px] inline-flex items-center"
        >
          ← Continue playing anonymously without an account
        </Link>
      </div>
    </div>
  );
}
