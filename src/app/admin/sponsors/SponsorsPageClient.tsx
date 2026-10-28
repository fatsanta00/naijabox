'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  url: string | null;
}

interface Sponsorship {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorUrl: string | null;
  experienceId: string | null;
  experienceTitle: string | null;
  experienceKey: string | null;
  label: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

interface ExperienceOption {
  id: string;
  key: string;
  title: string;
}

export default function SponsorsPageClient() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [experiences, setExperiences] = useState<ExperienceOption[]>([]);
  const [loading, setLoading] = useState(true);

  // New Sponsor Form
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorUrl, setNewSponsorUrl] = useState('');
  const [newSponsorLogo, setNewSponsorLogo] = useState('');
  const [submittingSponsor, setSubmittingSponsor] = useState(false);

  // New Sponsorship Form
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const [selectedExpId, setSelectedExpId] = useState('');
  const [sponsorshipLabel, setSponsorshipLabel] = useState('');
  const [submittingSponsorship, setSubmittingSponsorship] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sponsorsRes, sponsorshipsRes, expRes] = await Promise.all([
        fetch('/api/admin/sponsors').then((r) => r.json()),
        fetch('/api/admin/sponsorships').then((r) => r.json()),
        fetch('/api/admin/experiences').then((r) => r.json()),
      ]);

      if (sponsorsRes.success) setSponsors(sponsorsRes.data);
      if (sponsorshipsRes.success) setSponsorships(sponsorshipsRes.data);
      if (expRes.success) setExperiences(expRes.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load sponsorship data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingSponsor(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSponsorName,
          url: newSponsorUrl || null,
          logoUrl: newSponsorLogo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to create sponsor' });
      } else {
        setMessage({ type: 'success', text: `Sponsor "${data.data.name}" created.` });
        setNewSponsorName('');
        setNewSponsorUrl('');
        setNewSponsorLogo('');
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmittingSponsor(false);
    }
  }

  async function handleCreateSponsorship(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingSponsorship(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorId: selectedSponsorId,
          experienceId: selectedExpId || null,
          label: sponsorshipLabel,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to create sponsorship' });
      } else {
        setMessage({ type: 'success', text: 'Sponsorship edition activated.' });
        setSelectedSponsorId('');
        setSelectedExpId('');
        setSponsorshipLabel('');
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmittingSponsorship(false);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch {
      alert('Failed to toggle status.');
    }
  }

  async function handleDeleteSponsor(id: string, name: string) {
    if (!confirm(`Delete sponsor "${name}" and all its campaigns?`)) return;
    try {
      const res = await fetch(`/api/admin/sponsors?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadData();
    } catch {
      alert('Failed to delete sponsor.');
    }
  }

  async function handleDeleteSponsorship(id: string) {
    if (!confirm('Delete this sponsorship campaign?')) return;
    try {
      const res = await fetch(`/api/admin/sponsorships?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadData();
    } catch {
      alert('Failed to delete sponsorship.');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Sponsorship Editions</h1>
        <p className="text-sm text-naija-muted mt-1">
          Manage brand sponsors and attach labelled sponsorships to boxes or result screens. Non-negotiable: sponsorships are strictly labelled and never rendered during active gameplay.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Sponsor Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Add Sponsor Brand</CardTitle>
            <CardDescription>Register a company or advertiser</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSponsor} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="sp-name">
                  Brand Name
                </label>
                <input
                  id="sp-name"
                  type="text"
                  required
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  placeholder="e.g. PalmPay, Kuda, PiggyVest"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="sp-url">
                  Website / Landing Page URL
                </label>
                <input
                  id="sp-url"
                  type="url"
                  value={newSponsorUrl}
                  onChange={(e) => setNewSponsorUrl(e.target.value)}
                  placeholder="https://example.com/promo"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="sp-logo">
                  Logo Image URL (Optional)
                </label>
                <input
                  id="sp-logo"
                  type="url"
                  value={newSponsorLogo}
                  onChange={(e) => setNewSponsorLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>
              <Button type="submit" variant="primary" disabled={submittingSponsor}>
                {submittingSponsor ? 'Adding…' : '+ Register Sponsor'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Sponsorship Edition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Launch Sponsorship Campaign</CardTitle>
            <CardDescription>Attach a registered sponsor to an experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSponsorship} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="select-sp">
                  Select Sponsor
                </label>
                <select
                  id="select-sp"
                  required
                  value={selectedSponsorId}
                  onChange={(e) => {
                    setSelectedSponsorId(e.target.value);
                    const sp = sponsors.find((s) => s.id === e.target.value);
                    if (sp && !sponsorshipLabel) {
                      setSponsorshipLabel(`Sponsored by ${sp.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
                >
                  <option value="">-- Choose Brand --</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="select-exp">
                  Target Box (or Platform-wide)
                </label>
                <select
                  id="select-exp"
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
                >
                  <option value="">Platform-wide (All boxes)</option>
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} ({exp.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-naija-muted uppercase" htmlFor="sp-label">
                  Display Label (Must indicate sponsored status)
                </label>
                <input
                  id="sp-label"
                  type="text"
                  required
                  value={sponsorshipLabel}
                  onChange={(e) => setSponsorshipLabel(e.target.value)}
                  placeholder="e.g. Sponsored by PalmPay"
                  className="w-full px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/60 text-sm text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={submittingSponsorship || !selectedSponsorId}
              >
                {submittingSponsorship ? 'Activating…' : '⚡ Activate Sponsorship'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Table */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Active & Past Campaigns</h2>
        {loading ? (
          <div className="text-sm text-naija-muted animate-pulse">Loading sponsorships…</div>
        ) : sponsorships.length === 0 ? (
          <Card className="p-8 text-center text-sm text-naija-muted">
            No active sponsorship campaigns. Register a sponsor brand above to get started.
          </Card>
        ) : (
          <div className="space-y-2">
            {sponsorships.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-naija-card border border-naija-border/60 gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{s.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        s.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                      }`}
                    >
                      {s.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="text-xs text-naija-muted flex items-center gap-2">
                    <span>Brand: {s.sponsorName}</span>
                    <span>•</span>
                    <span>Target: {s.experienceTitle ? s.experienceTitle : 'Platform-wide'}</span>
                    {s.sponsorUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={s.sponsorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-400 hover:underline"
                        >
                          Visit Link &rarr;
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(s.id, s.isActive)}
                    className="min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-naija-surface border border-naija-border text-gray-200 hover:text-white"
                  >
                    {s.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteSponsorship(s.id)}
                    className="min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Brands List */}
      <div className="space-y-3 pt-4 border-t border-naija-border/60">
        <h2 className="text-xl font-bold text-white">Registered Sponsor Brands</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sponsors.map((sp) => (
            <Card key={sp.id} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{sp.name}</h3>
                {sp.url && (
                  <a
                    href={sp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-400 hover:underline"
                  >
                    {sp.url.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDeleteSponsor(sp.id, sp.name)}
                className="text-xs text-rose-400 hover:text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Delete ${sp.name}`}
              >
                ✕
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
