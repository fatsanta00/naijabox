'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar, Chip } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { analytics } from '@/lib/analytics';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  correct?: string[];
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  authorName: string | null;
  showAttribution: boolean;
}

const RESULT_TIERS = [
  { min: 0, max: 5, label: 'E Don Do — Orientation Needed', emoji: '😂', desc: "You're probably asking people what 'Omo' means. Stay indoors for now and study your Pidgin handbook." },
  { min: 6, max: 10, label: 'You Dey Try Small', emoji: '👍', desc: "You know the mainstream slang, but street-level Twitter comments will still confuse you." },
  { min: 11, max: 13, label: 'Almost Outside', emoji: '🔥', desc: "Certified street smart! You can decode any Nigerian gist without asking for translation." },
  { min: 14, max: 15, label: "You're Officially Outside", emoji: '🏆', desc: "Pure street master! You probably invented half of these terms yourself. No orientation needed." },
];

export default function SlangQuizBox({ slug, title }: BoxProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | undefined>();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  useEffect(() => {
    analytics.track('box_opened', { source: 'box_route' }, slug);
  }, [slug]);

  const loadQuestions = useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    try {
      const url = `/api/public/questions?experience=${slug}&difficulty=${diff}&count=15`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setQuestions(data.data);
        analytics.track('experience_started', { difficulty: diff, total_questions: data.data.length }, slug);
      }
    } catch (err) {
      console.error('Error fetching slang quiz questions:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  function handleSelectDifficulty(diff: 'easy' | 'medium' | 'hard') {
    setDifficulty(diff);
    loadQuestions(diff);
  }

  const currentQ = questions[currentIndex];

  function handleOptionClick(optId: string) {
    if (isAnswerRevealed) return;

    setSelectedOptionId(optId);
    setIsAnswerRevealed(true);

    const isCorrect = currentQ.correct?.includes(optId) ?? false;
    if (isCorrect) setScore((prev) => prev + 1);

    analytics.track(
      'question_answered',
      {
        question_id: currentQ.id,
        is_correct: isCorrect,
        question_index: currentIndex,
      },
      slug,
      currentQ.id
    );

    // Save answer
    fetch('/api/public/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: currentQ.id,
        answer: optId,
        is_correct: isCorrect,
      }),
    }).catch(() => {});
  }

  function handleNext() {
    setIsAnswerRevealed(false);
    setSelectedOptionId(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    const finalScore = score;
    const tier = RESULT_TIERS.find((t) => finalScore >= t.min && finalScore <= t.max) || RESULT_TIERS[1];
    setIsFinished(true);

    analytics.track(
      'experience_completed',
      {
        score: finalScore,
        max_score: questions.length,
        label: tier.label,
      },
      slug
    );

    // Save result for deep linking
    try {
      const res = await fetch('/api/public/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questions[0]?.id,
          answer: { score: finalScore, label: tier.label },
        }),
      });
      const data = await res.json();
      if (data.id) setSavedResultId(data.id);
    } catch {
      // Non-blocking
    }
  }

  function restart() {
    setDifficulty(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setIsAnswerRevealed(false);
    setIsFinished(false);
  }

  // 1. Difficulty Selector Screen
  if (!difficulty) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 text-center">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-bold">Vocabulary Test</span>
          <h1 className="text-3xl font-black text-naija-text mt-1">{title}</h1>
          <p className="text-sm text-naija-muted mt-2">
            Select your street level. Can you tell your &quot;Japa&quot; from your &quot;Packaging&quot;?
          </p>
        </div>

        <div className="space-y-3">
          <Card interactive onClick={() => handleSelectDifficulty('easy')} className="p-5 text-left border-emerald-500/30 hover:border-emerald-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-naija-text text-base">🟢 Beginner (Easy)</h3>
                <p className="text-xs text-naija-muted">Common phrases every Nigerian hears daily</p>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">Start &rarr;</span>
            </div>
          </Card>

          <Card interactive onClick={() => handleSelectDifficulty('medium')} className="p-5 text-left border-amber-500/30 hover:border-amber-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-naija-text text-base">🟡 Street Level (Medium)</h3>
                <p className="text-xs text-naija-muted">Market banter, Twitter slang, campus lingo</p>
              </div>
              <span className="text-xs text-amber-400 font-semibold">Start &rarr;</span>
            </div>
          </Card>

          <Card interactive onClick={() => handleSelectDifficulty('hard')} className="p-5 text-left border-rose-500/30 hover:border-rose-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-naija-text text-base">🔴 Certified Veteran (Hard)</h3>
                <p className="text-xs text-naija-muted">Deep cuts, motor park codes, vintage terms</p>
              </div>
              <span className="text-xs text-rose-400 font-semibold">Start &rarr;</span>
            </div>
          </Card>

          <div className="pt-2 text-center">
            <Link
              href="/slang"
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:text-brand-300 font-semibold"
            >
              📖 Looking for definitions? Explore the Nigerian Slang Dictionary &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Fetching questions...</p>
      </div>
    );
  }

  if (isFinished) {
    const tier = RESULT_TIERS.find((t) => score >= t.min && score <= t.max) || RESULT_TIERS[1];
    return (
      <ResultLayout
        currentSlug={slug}
        title={title}
        resultScore={`${score} / ${questions.length}`}
        resultLabel={`${tier.emoji} ${tier.label}`}
        resultDescription={tier.desc}
        resultId={savedResultId}
        onTryAgain={restart}
        customResultSlot={
          <div className="pt-2">
            <Link
              href="/slang"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:text-brand-300 transition-colors py-2 px-3 rounded-lg bg-brand-500/10 border border-brand-500/20"
            >
              📖 Browse the full Nigerian Slang Dictionary &rarr;
            </Link>
          </div>
        }
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-naija-text">No questions in this tier yet</h2>
        <Button onClick={restart}>Choose Another Difficulty</Button>
      </div>
    );
  }

  const options = Array.isArray(currentQ.options) ? currentQ.options : [];
  const correctOptionId = currentQ.correct?.[0];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-naija-muted">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <Chip variant="brand" size="sm" className="capitalize">{difficulty}</Chip>
        </div>
        <ProgressBar value={currentIndex + 1} max={questions.length} />
      </div>

      {/* Slang Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-naija-border/80 bg-naija-surface">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-wider text-naija-muted font-mono">
            WHAT DOES THIS MEAN?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-naija-text tracking-tight">
            &quot;{currentQ.text}&quot;
          </h2>
        </div>

        {/* Options with Instant Feedback */}
        <div className="space-y-3 pt-2">
          {options.map((opt) => {
            let btnStyle = 'border-naija-border bg-naija-card text-naija-text hover:border-gray-500';

            if (isAnswerRevealed) {
              if (opt.id === correctOptionId) {
                btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold ring-2 ring-emerald-500/40';
              } else if (opt.id === selectedOptionId) {
                btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300 font-semibold';
              } else {
                btnStyle = 'border-naija-border/40 bg-naija-card/40 text-gray-500 opacity-60';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt.id)}
                disabled={isAnswerRevealed}
                className={`w-full text-left p-4 min-h-[52px] rounded-xl border transition-all duration-150 font-medium text-sm sm:text-base cursor-pointer select-none ${btnStyle}`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswerRevealed && (
          <div className="pt-4 border-t border-naija-border/60 space-y-4 animate-in fade-in duration-200">
            {currentQ.explanation && (
              <div className="p-3.5 rounded-xl bg-naija-card/80 border border-naija-border/60 text-xs sm:text-sm text-naija-muted">
                <strong className="text-brand-600 dark:text-brand-400 block mb-1">Context:</strong>
                {currentQ.explanation}
              </div>
            )}

            <Button onClick={handleNext} variant="primary" size="default" fullWidth>
              {currentIndex + 1 < questions.length ? 'Next Slang →' : 'See My Result →'}
            </Button>
          </div>
        )}
      </Card>

      {/* Footer controls */}
      <div className="flex justify-between items-center px-2">
        <ReportButton questionId={currentQ.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="text-xs text-naija-muted hover:text-brand-600 dark:text-brand-400 min-h-[44px] inline-flex items-center"
        >
          + Submit slang
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
