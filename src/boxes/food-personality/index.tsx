'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { analytics } from '@/lib/analytics';

interface QuestionOption {
  id: string;
  text: string;
  points?: number;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

interface FoodResultBand {
  min: number;
  max: number;
  label: string;
  emoji: string;
  desc: string;
}

const FOOD_BANDS: FoodResultBand[] = [
  {
    min: 0,
    max: 20,
    label: 'Cold Garri & Groundnut',
    emoji: '🥣',
    desc: 'The Lifesaver & Ultimate Realist: Zero pretensions, low maintenance, and saves everybody when things get tough. Pure survivalist energy.',
  },
  {
    min: 21,
    max: 40,
    label: 'Midnight Indomie & Fried Egg',
    emoji: '🍜',
    desc: 'The Comfort Friend: Dependable, fast to adapt, always shows up at 2 a.m. when people need reassurance and good vibes.',
  },
  {
    min: 41,
    max: 60,
    label: 'Hot Suya with Extra Yaji',
    emoji: '🥩',
    desc: 'The Nighttime Rebel: Bold, spicy, dramatic flavor that refuses to be ignored. You keep late hours and people handle you with caution.',
  },
  {
    min: 61,
    max: 80,
    label: 'Pounded Yam & Egusi Soup',
    emoji: '🍲',
    desc: 'The Dignified Heavyweight: Solid, traditional, royalty at any table. You do not rush for anybody and you command total respect.',
  },
  {
    min: 81,
    max: 100,
    label: 'Smoky Party Jollof Rice',
    emoji: '🍛',
    desc: 'The Undisputed Superstar: Life of every owambe, unforgettable aroma, center of attention everywhere you step. Irreplaceable!',
  },
];

export default function FoodPersonalityBox({ slug, title }: BoxProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [maxPossiblePoints, setMaxPossiblePoints] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | undefined>();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/questions?experience=${slug}&count=10`);
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

  const handleSelectOption = (opt: QuestionOption) => {
    const currentQ = questions[currentIndex];
    const points = typeof opt.points === 'number' ? opt.points : 1;
    const newTotal = pointsTotal + points;
    const newMax = maxPossiblePoints + 3; // 3 max points per question

    setPointsTotal(newTotal);
    setMaxPossiblePoints(newMax);

    analytics.track(
      'question_answered',
      {
        question_index: currentIndex,
        selected_option: opt.id,
        points,
      },
      slug,
      currentQ.id
    );

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishTest(newTotal, newMax);
    }
  };

  const finishTest = async (finalTotal: number, finalMax: number) => {
    setIsFinished(true);
    const scorePct = finalMax > 0 ? Math.round((finalTotal / finalMax) * 100) : 50;
    const band =
      FOOD_BANDS.find((b) => scorePct >= b.min && scorePct <= b.max) || FOOD_BANDS[2];

    try {
      const res = await fetch('/api/public/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_key: slug,
          score_numeric: scorePct,
          score_label: band.label,
          data: {
            points_total: finalTotal,
            max_points: finalMax,
            emoji: band.emoji,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.result_id) {
        setSavedResultId(data.result_id);
      }
    } catch (err) {
      console.error('Failed to save result:', err);
    }

    analytics.track(
      'experience_completed',
      { score: scorePct, label: band.label },
      slug
    );
    analytics.track('result_shown', { score: scorePct, label: band.label }, slug);
  };

  const handleRestart = () => {
    analytics.track('try_again_clicked', {}, slug);
    setCurrentIndex(0);
    setPointsTotal(0);
    setMaxPossiblePoints(0);
    setIsFinished(false);
    setSavedResultId(undefined);
    loadQuestions();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Preparing your food personality test...</p>
      </div>
    );
  }

  if (isFinished) {
    const scorePct = maxPossiblePoints > 0 ? Math.round((pointsTotal / maxPossiblePoints) * 100) : 50;
    const band =
      FOOD_BANDS.find((b) => scorePct >= b.min && scorePct <= b.max) || FOOD_BANDS[2];

    return (
      <ResultLayout
        currentSlug={slug}
        title={title}
        resultScore={`${band.emoji} ${scorePct}% Flavor`}
        resultLabel={band.label}
        resultDescription={band.desc}
        resultId={savedResultId}
        onTryAgain={handleRestart}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white">No food questions found</h2>
        <p className="text-sm text-naija-muted">
          Our food kitchen is warming up. Help contribute the first personality dilemma!
        </p>
        <Button onClick={() => setSubmitModalOpen(true)}>+ Submit a Food Question</Button>
        <SubmitQuestionModal
          experienceKey={slug}
          experienceTitle={title}
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress & Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-naija-muted font-medium">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Question Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center leading-snug">
          {currentQ.text}
        </h2>

        {/* Options (Minimum 44px touch targets) */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              className="w-full p-4 text-left rounded-xl bg-naija-surface border border-naija-border/60 hover:border-brand-500 hover:bg-naija-card text-sm sm:text-base text-gray-200 hover:text-white transition-all font-medium min-h-[48px] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {opt.text}
            </button>
          ))}
        </div>

        {currentQ.authorName && currentQ.showAttribution && (
          <div className="text-[11px] text-center text-naija-muted pt-2 border-t border-naija-border/40">
            Suggested by {currentQ.authorName}
          </div>
        )}
      </Card>

      {/* Community Action Footer */}
      <div className="flex justify-between items-center text-xs text-naija-muted px-1">
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="hover:text-white transition-colors min-h-[44px] flex items-center"
        >
          + Submit a food dilemma
        </button>
        <ReportButton questionId={currentQ.id} />
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
