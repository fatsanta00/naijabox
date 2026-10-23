'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface AnalyticsData {
  summary: {
    totalEvents: number;
    totalSessions: number;
    totalResponses: number;
  };
  mostOpenedBox: {
    experience: string;
    count: number;
  } | null;
  boxPopularity: Array<{
    experience: string;
    count: number;
  }>;
  funnel: Array<{
    experience: string;
    starts: number;
    completions: number;
    completionRate: number;
  }>;
  trafficSources: Array<{
    source: string | null;
    count: number;
  }>;
  devices: Array<{
    device: string | null;
    count: number;
  }>;
  shares: Array<{
    target: string;
    count: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAggregating, setIsAggregating] = useState(false);
  const [aggregateMsg, setAggregateMsg] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const triggerAggregation = async () => {
    setIsAggregating(true);
    setAggregateMsg('');
    try {
      const res = await fetch('/api/admin/aggregate', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setAggregateMsg(`Success! Updated ${json.questionStatsUpdated} stats, created ${json.priceSnapshotsCreated} snapshots.`);
        fetchAnalytics();
      } else {
        setAggregateMsg('Aggregation run failed.');
      }
    } catch {
      setAggregateMsg('Network error triggering aggregation.');
    } finally {
      setIsAggregating(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-naija-muted animate-pulse">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-naija-muted mt-1">
            Real-time insight on experience traffic, popularity, funnels and viral shares.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={triggerAggregation} variant="secondary" size="default" disabled={isAggregating}>
            {isAggregating ? 'Refreshing Stats...' : '⚡ Run Aggregation Job'}
          </Button>
          <Button onClick={fetchAnalytics} variant="primary" size="default">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {aggregateMsg && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300">
          {aggregateMsg}
        </div>
      )}

      {/* Hero Metric: Which box gets opened the most? */}
      <Card className="p-6 bg-brand-500/15 border-brand-500/30">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          🏆 Top Experience (Most Opened Box)
        </span>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-2 gap-2">
          <h2 className="text-3xl font-black text-white">
            {data.mostOpenedBox?.experience ? `📦 ${data.mostOpenedBox.experience}` : 'No activity yet'}
          </h2>
          <span className="text-sm font-bold text-brand-300">
            {data.mostOpenedBox?.count?.toLocaleString() ?? 0} opens / starts
          </span>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-naija-muted font-semibold uppercase">Total Sessions</span>
          <div className="text-2xl font-black text-white mt-1">
            {data.summary.totalSessions.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-naija-muted font-semibold uppercase">Total Answers Recorded</span>
          <div className="text-2xl font-black text-white mt-1">
            {data.summary.totalResponses.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-naija-muted font-semibold uppercase">Total Analytics Events</span>
          <div className="text-2xl font-black text-white mt-1">
            {data.summary.totalEvents.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Funnel & Completion Rate Table */}
      <Card className="p-6 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg">Experience Completion Funnels</CardTitle>
          <CardDescription>
            Starts vs. completions per box (identifies drop-off and engagement)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {data.funnel.length === 0 ? (
            <p className="text-xs text-naija-muted py-4 text-center">No experience funnel data recorded yet.</p>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-naija-muted border-b border-naija-border/40">
                  <th className="pb-2 font-semibold">Experience</th>
                  <th className="pb-2 text-right font-semibold">Starts</th>
                  <th className="pb-2 text-right font-semibold">Completions</th>
                  <th className="pb-2 text-right font-semibold">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-naija-border/20">
                {data.funnel.map((f, i) => (
                  <tr key={i} className="hover:bg-naija-surface/30">
                    <td className="py-2.5 font-bold text-white capitalize">{f.experience}</td>
                    <td className="py-2.5 text-right text-naija-muted">{f.starts.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-naija-muted">{f.completions.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-black text-brand-400">
                      {f.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Grid: Traffic Sources & Device Class & Shares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Traffic Sources
          </h3>
          <div className="space-y-2">
            {data.trafficSources.length === 0 ? (
              <p className="text-xs text-naija-muted">No referrer data yet.</p>
            ) : (
              data.trafficSources.map((t, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-white capitalize">{t.source || 'Direct'}</span>
                  <span className="font-bold text-brand-400">{t.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Devices */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Device Breakdown
          </h3>
          <div className="space-y-2">
            {data.devices.length === 0 ? (
              <p className="text-xs text-naija-muted">No device data yet.</p>
            ) : (
              data.devices.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-white capitalize">{d.device || 'Unknown'}</span>
                  <span className="font-bold text-teal-400">{d.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Social Shares */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Social Share Clicks
          </h3>
          <div className="space-y-2">
            {data.shares.length === 0 ? (
              <p className="text-xs text-naija-muted">No share clicks yet.</p>
            ) : (
              data.shares.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-white capitalize">{s.target || 'General'}</span>
                  <span className="font-bold text-purple-400">{s.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
