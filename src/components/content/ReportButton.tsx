'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export interface ReportButtonProps {
  questionId: string;
}

const REPORT_REASONS = [
  { id: 'offensive', label: 'Offensive or inappropriate content' },
  { id: 'spam', label: 'Spam or advertisement' },
  { id: 'incorrect', label: 'Factually incorrect or bad answer' },
  { id: 'duplicate', label: 'Duplicate question' },
  { id: 'unclear', label: "Doesn't make sense / unclear" },
  { id: 'other', label: 'Other issue' },
] as const;

export function ReportButton({ questionId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]['id']>('offensive');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          reason,
          note: note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit report');
      } else {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setNote('');
        }, 1800);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-naija-muted hover:text-gray-300 transition-colors p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer select-none"
        aria-label="Report this question"
      >
        Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-sm bg-naija-surface border-naija-border">
            <CardHeader className="pb-2 flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Report Question</CardTitle>
                <CardDescription>Help us keep NaijaBox high quality</CardDescription>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-naija-muted hover:text-white p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="p-4 text-center text-emerald-300 text-sm font-medium">
                  ✓ Report submitted. Thank you for flagging!
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-3">
                  {error && (
                    <div className="p-2 text-xs rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r.id}
                        className="flex items-center space-x-2 text-xs text-gray-300 p-2 rounded-lg bg-naija-card/60 hover:bg-naija-card cursor-pointer border border-naija-border/40 min-h-[44px]"
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.id}
                          checked={reason === r.id}
                          onChange={() => setReason(r.id)}
                          className="text-brand-500 focus:ring-brand-500 h-4 w-4"
                        />
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Optional details
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain what is wrong..."
                      className="w-full p-2.5 rounded-xl bg-naija-card border border-naija-border text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-naija-border/60">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="danger" size="sm" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
