'use client';

import React, { useState, useEffect } from 'react';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { analytics } from '@/lib/analytics';

interface QuestionOption {
  id: string;
  text: string;
  points: number;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

interface ScoreBand {
  min: number;
  max: number;
  label: string;
  emoji: string;
  desc: string;
}

const DEFAULT_BANDS: ScoreBand[] = [
  { min: 0, max: 20, label: 'International Japa Expatriate', emoji: '🌍', desc: "You probably say 'water' with an accent. You need emergency pounded yam and an elder's rebuke." },
  { min: 21, max: 40, label: 'Still Loading', emoji: '📡', desc: "You know what NEPA means, but you still panic when generator noise starts. Orientation in progress." },
  { min: 41, max: 60, label: 'Half-Naija Resident', emoji: '🤝', desc: "Comfortable in traffic, can negotiate with taxi drivers, but you won't lick the plate in public." },
  { min: 61, max: 80, label: 'Certified Naija Child', emoji: '🔥', desc: "You can bargain at any market, drink hot pepper soup without blinking, and African time is your default." },
  { min: 81, max: 100, label: '100% Naija. No Refunds', emoji: '🇳🇬', desc: "Unshakable Nigerian soul. You hear 'UP NEPA!' in your dreams and you have an opinion on every jollof." },
];

export default function HowNigerianBox({ slug, title }: BoxProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [maxPossiblePoints, setMaxPossiblePoints] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | undefined>();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const loadQuestions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/questions?experience=${slug}&count=15`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setQuestions(data.data);
        analytics.track('experience_started', { total_questions: data.data.length }, slug);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    analytics.track('box_opened', { source: 'box_route' }, slug);
    loadQuestions();
  }, [slug, loadQuestions]);

  function handleSelectOption(opt: QuestionOption) {
    const currentQ = questions[currentIndex];
    const newTotal = pointsTotal + (opt.points || 0);
    const newMax = maxPossiblePoints + 3; // Maximum points per question is 3

    setPointsTotal(newTotal);
    setMaxPossiblePoints(newMax);

    analytics.track(
      'question_answered',
      {
        question_index: currentIndex,
        selected_option: opt.id,
        points: opt.points,
      },
      slug,
      currentQ.id
    );

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(newTotal, newMax);
    }
  }

  async function finishQuiz(total: number, max: number) {
    const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
    const band = DEFAULT_BANDS.find((b) => percentage >= b.min && percentage <= b.max) || DEFAULT_BANDS[2];

    setIsFinished(true);

    analytics.track(
      'experience_completed',
      {
        score: percentage,
        label: band.label,
        total_questions: questions.length,
      },
      slug
    );

    // Save result to DB for deep linking
    try {
      const res = await fetch('/api/public/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questions[0]?.id,
          answer: { score: percentage, label: band.label },
        }),
      });
      const data = await res.json();
      if (data.id) setSavedResultId(data.id);
    } catch {
      // Non-blocking
    }
  }

  function restart() {
    setCurrentIndex(0);
    setPointsTotal(0);
    setMaxPossiblePoints(0);
    setIsFinished(false);
    loadQuestions();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Preparing your test...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-naija-text">No questions available right now</h2>
        <p className="text-sm text-naija-muted">Be the first to submit a question to this box!</p>
        <Button onClick={() => setSubmitModalOpen(true)}>+ Submit a Question</Button>
      </div>
    );
  }

  if (isFinished) {
    const finalScore = maxPossiblePoints > 0 ? Math.round((pointsTotal / maxPossiblePoints) * 100) : 0;
    const band = DEFAULT_BANDS.find((b) => finalScore >= b.min && finalScore <= b.max) || DEFAULT_BANDS[2];

    return (
      <ResultLayout
        currentSlug={slug}
        title={title}
        resultScore={`${finalScore}%`}
        resultLabel={`${band.emoji} ${band.label}`}
        resultDescription={band.desc}
        resultId={savedResultId}
        onTryAgain={restart}
      />
    );
  }

  const currentQ = questions[currentIndex];
  const options = Array.isArray(currentQ.options) ? currentQ.options : [];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-naija-muted">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{title}</span>
        </div>
        <ProgressBar value={currentIndex + 1} max={questions.length} />
      </div>

      {/* Question Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-naija-border/80 bg-naija-surface">
        <h2 className="text-xl sm:text-2xl font-black text-naija-text leading-snug">
          {currentQ.text}
        </h2>

        {currentQ.authorName && currentQ.showAttribution && (
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
            Submitted by {currentQ.authorName}
          </p>
        )}

        {/* Options (min 44px tap targets) */}
        <div className="space-y-3 pt-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              className="w-full text-left p-4 min-h-[52px] rounded-xl bg-naija-card hover:bg-naija-cardSubtle border border-naija-border/70 text-naija-text hover:text-naija-text font-medium text-sm sm:text-base transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </Card>

      {/* Footer controls: report & submit */}
      <div className="flex justify-between items-center px-2">
        <ReportButton questionId={currentQ.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="text-xs text-naija-muted hover:text-brand-600 dark:text-brand-400 min-h-[44px] inline-flex items-center"
        >
          + Submit a question
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
