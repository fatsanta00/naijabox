'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export interface SubmitQuestionModalProps {
  experienceKey: string;
  experienceTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitQuestionModal({
  experienceKey,
  experienceTitle,
  isOpen,
  onClose,
}: SubmitQuestionModalProps) {
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [explanation, setExplanation] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showAttribution, setShowAttribution] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // website field
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/public/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_key: experienceKey,
          text,
          options: [
            { id: 'a', text: optionA },
            { id: 'b', text: optionB },
          ],
          explanation: explanation || null,
          author_name: authorName || null,
          show_attribution: showAttribution,
          website: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: data.error || 'Submission failed' });
      } else {
        setStatusMsg({
          type: 'success',
          text: data.message || "Thanks! It'll show up once it's reviewed.",
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-naija-surface border-naija-border max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-2 flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Add a Question</CardTitle>
            <CardDescription>Contribute to {experienceTitle}</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-naija-muted hover:text-naija-text p-2 text-lg font-bold min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </CardHeader>
        <CardContent>
          {statusMsg && (
            <div
              className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field - visually hidden */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-naija-text mb-1.5">
                Question / Prompt *
              </label>
              <textarea
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Would you rather have free fuel for life or free flights?"
                className="w-full p-3 rounded-xl bg-naija-cardSubtle border border-naija-border text-naija-text placeholder:text-naija-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-naija-text mb-1.5">Option A *</label>
                <input
                  required
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Option 1"
                  className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-cardSubtle border border-naija-border text-naija-text placeholder:text-naija-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-naija-text mb-1.5">Option B *</label>
                <input
                  required
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Option 2"
                  className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-cardSubtle border border-naija-border text-naija-text placeholder:text-naija-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-naija-text mb-1.5">
                Explanation / Context (Optional)
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Why is this interesting or funny?"
                className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-cardSubtle border border-naija-border text-naija-text placeholder:text-naija-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2 border-t border-naija-border/60">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="attribution" className="text-xs font-medium text-naija-muted cursor-pointer">
                  Show my name publicly on the card
                </label>
                <input
                  id="attribution"
                  type="checkbox"
                  checked={showAttribution}
                  onChange={(e) => setShowAttribution(e.target.checked)}
                  className="h-5 w-5 rounded bg-naija-card border-naija-border text-brand-500 focus:ring-brand-500"
                />
              </div>
              {showAttribution && (
                <div>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Tunde or @tunde_vibe"
                    className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-cardSubtle border border-naija-border text-naija-text placeholder:text-naija-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
