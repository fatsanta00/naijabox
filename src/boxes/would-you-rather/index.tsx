'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BoxProps } from '../types';
import { Card, Button, Chip } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { ShareBar } from '@/components/sharing/ShareBar';
import { analytics } from '@/lib/analytics';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

interface QuestionStatsResponse {
  available: boolean;
  total_responses?: number;
  distribution?: Record<string, number>;
  message?: string;
}

export default function WouldYouRatherBox({ slug, title }: BoxProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [stats, setStats] = useState<QuestionStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/questions?experience=${slug}&count=20`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setQuestions(data.data);
        analytics.track('experience_started', { total_questions: data.data.length }, slug);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    analytics.track('box_opened', { source: 'box_route' }, slug);
    loadQuestions();
  }, [slug, loadQuestions]);

  const currentQ = questions[currentIndex];

  async function handleVote(optionId: string) {
    if (!currentQ || selectedOptionId) return;

    setSelectedOptionId(optionId);
    setLoadingStats(true);

    analytics.track(
      'question_answered',
      {
        question_id: currentQ.id,
        selected_option: optionId,
        question_index: currentIndex,
      },
      slug,
      currentQ.id
    );

    // 1. Submit answer (session-locked, prevents vote stuffing)
    try {
      await fetch('/api/public/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQ.id,
          answer: optionId,
        }),
      });
    } catch (err) {
      console.warn('Failed to record vote:', err);
    }

    // 2. Fetch stats with anti-fabrication gate
    try {
      const res = await fetch(`/api/public/questions/${currentQ.id}/stats`);
      const statsData = await res.json();
      setStats(statsData);
    } catch {
      setStats({ available: false, message: 'Stats temporarily unavailable' });
    } finally {
      setLoadingStats(false);
      setCompletedCount((prev) => prev + 1);
    }
  }

  function handleNext() {
    setSelectedOptionId(null);
    setStats(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      analytics.track('experience_completed', { questions_voted: completedCount + 1 }, slug);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Finding choices...</p>
      </div>
    );
  }

  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <ResultLayout
        currentSlug={slug}
        title={title}
        resultLabel="You've finished the choices!"
        resultDescription={`You voted on ${completedCount} dilemmas. Think your friends would make the same picks?`}
        onTryAgain={() => {
          setCurrentIndex(0);
          setSelectedOptionId(null);
          setStats(null);
          loadQuestions();
        }}
      />
    );
  }

  const options = Array.isArray(currentQ.options) ? currentQ.options : [];
  const totalVotes = stats?.total_responses || 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center text-xs text-naija-muted">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <Chip variant="yellow" size="sm">Hard Choices Only</Chip>
      </div>

      {/* Main Dilemma Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-naija-border/80 bg-naija-surface text-center">
        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
          WOULD YOU RATHER
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
          {currentQ.text}
        </h2>

        {/* Voting Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let percentDisplay: number | null = null;

            if (selectedOptionId && stats?.available && stats.distribution) {
              const votesForOpt = stats.distribution[opt.id] || 0;
              percentDisplay = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={Boolean(selectedOptionId)}
                className={`relative overflow-hidden p-5 rounded-2xl min-h-[96px] flex flex-col items-center justify-center text-center font-bold text-sm sm:text-base border transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-2 ring-brand-500/40'
                    : selectedOptionId
                    ? 'border-naija-border bg-naija-card/60 text-gray-300 opacity-90'
                    : 'border-naija-border bg-naija-card hover:bg-naija-border/80 text-white hover:border-gray-500 active:scale-[0.98]'
                }`}
              >
                {/* Stats Fill Bar */}
                {percentDisplay !== null && (
                  <div
                    className="absolute inset-y-0 left-0 bg-brand-500/20 -z-0 transition-all duration-500"
                    style={{ width: `${percentDisplay}%` }}
                  />
                )}

                <span className="relative z-10 leading-snug">{opt.text}</span>

                {percentDisplay !== null && (
                  <span className="relative z-10 mt-2 text-xs font-mono font-bold text-brand-300">
                    {percentDisplay}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Anti-fabrication gated stats notice */}
        {selectedOptionId && (
          <div className="pt-2 animate-in fade-in duration-200">
            {loadingStats ? (
              <p className="text-xs text-naija-muted">Checking community votes...</p>
            ) : !stats?.available ? (
              <p className="text-xs text-naija-muted italic">
                {stats?.message || "You're one of the first to answer! Stats unlock after 30 plays."}
              </p>
            ) : (
              <p className="text-xs text-naija-muted">
                Based on {totalVotes} real responses
              </p>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={handleNext} variant="primary" size="default" fullWidth className="sm:w-auto">
                Next Dilemma &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Share Question Bar */}
        {selectedOptionId && (
          <div className="pt-4 border-t border-naija-border/60">
            <span className="block text-[11px] text-naija-muted mb-2 font-medium">
              Share this dilemma with friends:
            </span>
            <ShareBar
              title={currentQ.text}
              text={`Would you rather: "${currentQ.text}"? Vote here:`}
              url={`https://naijabox.app/q/${currentQ.id}`}
              experienceKey={slug}
            />
          </div>
        )}
      </Card>

      {/* Footer controls: report & submit */}
      <div className="flex justify-between items-center px-2">
        <ReportButton questionId={currentQ.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="text-xs text-naija-muted hover:text-brand-400 min-h-[44px] inline-flex items-center"
        >
          + Submit a dilemma
        </button>
      </div>

      <SubmitQuestionModal
        experienceKey={slug}
        experienceTitle={title}
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
      />
    </div>
  );
}
