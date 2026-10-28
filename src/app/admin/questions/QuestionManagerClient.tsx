'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export interface QuestionRow {
  id: string;
  text: string;
  status: 'draft' | 'pending' | 'published' | 'unpublished' | 'rejected' | 'deleted';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  source: 'admin' | 'community' | 'seed';
  experienceId: string;
  createdAt: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  slug: string;
}

interface QuestionManagerClientProps {
  initialQuestions: QuestionRow[];
  experiences: ExperienceItem[];
}

export function QuestionManagerClient({
  initialQuestions,
  experiences,
}: QuestionManagerClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const expMap = new Map(experiences.map((e) => [e.id, e.title]));

  // Filter questions
  const filteredQuestions = initialQuestions.filter((q) => {
    if (sourceFilter !== 'all' && q.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (experienceFilter !== 'all' && q.experienceId !== experienceFilter) return false;
    if (searchQuery.trim() && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.has(q.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  }

  function toggleSelectOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleBulkAction(action: 'publish' | 'unpublish' | 'delete') {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.size} questions?`)) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Successfully performed "${action}" on ${data.count} questions.`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setMessage(`Error: ${data.error || 'Failed to update'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to execute bulk action.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Questions Manager</h1>
          <p className="text-sm text-naija-muted mt-1">
            Review seed questions, filter community contributions, and execute bulk moderation actions.
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="h-11 min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium inline-flex items-center text-sm shadow-md"
        >
          + Add New Question
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-naija-surface/90 border-naija-border/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Source Filter */}
          <div>
            <label className="block text-xs font-semibold text-naija-muted mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-naija-card border border-naija-border text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Sources</option>
              <option value="seed">🌱 Seed Content Only</option>
              <option value="community">👥 Community Submissions</option>
              <option value="admin">🔒 Admin Created</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="block text-xs font-semibold text-naija-muted mb-1">Experience</label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-naija-card border border-naija-border text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Experiences</option>
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-naija-muted mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-naija-card border border-naija-border text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="pending">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-naija-muted mb-1">Search Text</label>
            <input
              type="text"
              placeholder="Filter by question text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-naija-card border border-naija-border text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="p-2.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-naija-border/50 animate-in fade-in">
            <div className="text-xs font-semibold text-white">
              <span className="text-brand-400 font-bold">{selectedIds.size}</span> question{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={() => handleBulkAction('publish')}
                disabled={isProcessing}
                className="h-9 px-3 text-xs"
              >
                Publish Selected
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBulkAction('unpublish')}
                disabled={isProcessing}
                className="h-9 px-3 text-xs"
              >
                Unpublish Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
                className="h-9 px-3 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              >
                Delete Selected
              </Button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-naija-muted hover:text-white px-2 py-1"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-x-auto p-0 border-naija-border/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-naija-surface/90 border-b border-naija-border text-xs uppercase text-naija-muted">
            <tr>
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all questions"
                  className="rounded border-naija-border text-brand-500 focus:ring-brand-500 bg-naija-card cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Question Text</th>
              <th className="py-3 px-4">Experience</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-naija-border/60">
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-naija-muted">
                  No questions match your selected filters.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <tr
                    key={q.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-brand-500/10' : 'hover:bg-naija-surface/40'
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(q.id)}
                        aria-label={`Select question: ${q.text}`}
                        className="rounded border-naija-border text-brand-500 focus:ring-brand-500 bg-naija-card cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-sm truncate">
                      {q.text}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {expMap.get(q.experienceId) || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs text-naija-muted">
                        {q.difficulty || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          q.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : q.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-naija-card text-gray-400 border border-naija-border'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded font-mono ${
                          q.source === 'seed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : q.source === 'community'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {q.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/questions/${q.id}`}
                        className="text-brand-400 hover:text-brand-300 font-medium text-xs px-2 py-1"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
