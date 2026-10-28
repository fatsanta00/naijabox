'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar } from '@/components/ui';
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
  difficulty: 'easy' | 'medium' | 'hard' | null;
  options: Option[];
  correct: string[] | null;
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

type Phase = 'difficulty_select' | 'loading' | 'answering' | 'revealed' | 'result' | 'empty';

function getFootballResultBand(score: number, total: number) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) {
    return {
      label: '🦅 Super Eagles Legend',
      description: 'Untouchable! Your football knowledge is on par with Clemens Westerhof and Stephen Keshi. Pure class!',
      emoji: '🦅',
    };
  }
  if (pct >= 70) {
    return {
      label: '⚽ Certified First Eleven',
      description: 'Solid baller! You know your Nigerian football history inside out. Nobody can debate you at the viewing centre.',
      emoji: '⚽',
    };
  }
  if (pct >= 40) {
    return {
      label: '📺 Viewing Centre Analyst',
      description: 'You dey argue plenty for viewing centre with pure passion, but a few historical details slipped past you.',
      emoji: '📺',
    };
  }
  return {
    label: '🪑 Bench Warmer',
    description: 'You only watch football during AFCON finals and World Cup penalty shootouts. Go and warm the bench!',
    emoji: '🪑',
  };
}

export default function FootballTriviaBox({ slug, title }: BoxProps) {
  const [phase, setPhase] = useState<Phase>('difficulty_select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    analytics.track('box_opened', { experience: slug }, slug);
  }, [slug]);

  const loadQuestions = useCallback(
    async (diff: 'all' | 'easy' | 'medium' | 'hard') => {
      setPhase('loading');
      try {
        const queryDiff = diff === 'all' ? '' : `&difficulty=${diff}`;
        const res = await fetch(`/api/public/questions?experience=${slug}&count=10${queryDiff}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setQuestions(data.data);
          setCurrentIdx(0);
          setScore(0);
          setSelectedOptionId(null);
          setPhase('answering');

          if (!startedRef.current) {
            startedRef.current = true;
            analytics.track(
              'experience_started',
              { difficulty: diff, total_questions: data.data.length },
              slug
            );
          }
        } else {
          setPhase('empty');
        }
      } catch (err) {
        console.error('Failed to load football questions:', err);
        setPhase('empty');
      }
    },
    [slug]
  );

  const handleStartGame = (diff: 'all' | 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(diff);
    loadQuestions(diff);
  };

  const handleSelectOption = (optionId: string) => {
    if (phase !== 'answering') return;
    setSelectedOptionId(optionId);
    setPhase('revealed');

    const currentQ = questions[currentIdx];
    const isCorrect = Array.isArray(currentQ.correct)
      ? currentQ.correct.includes(optionId)
      : false;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    analytics.track(
      'answer_submitted',
      {
        question_id: currentQ.id,
        option_id: optionId,
        is_correct: isCorrect,
        question_index: currentIdx + 1,
      },
      slug,
      currentQ.id
    );
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOptionId(null);
      setPhase('answering');
    } else {
      setPhase('result');
      const finalScore = score + (questions[currentIdx]?.correct?.includes(selectedOptionId || '') ? 0 : 0);
      analytics.track(
        'experience_completed',
        {
          score: finalScore,
          total: questions.length,
          difficulty: selectedDifficulty,
        },
        slug
      );
    }
  };

  const handleReset = () => {
    startedRef.current = false;
    setPhase('difficulty_select');
  };

  // ─── Difficulty Selection View ─────────────────────────────────────────────
  if (phase === 'difficulty_select') {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        <Card className="p-6 text-center space-y-4">
          <span className="inline-block text-3xl">⚽</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
          <p className="text-sm text-naija-muted">
            From the 1994 Golden Generation to the 1996 Olympic Gold and Osimhen’s Scudetto. Test your Super Eagles knowledge!
          </p>

          <div className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
              Select Your Pitch Level
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleStartGame('all')}
                className="p-3.5 min-h-[48px] rounded-xl bg-naija-card border border-white/10 hover:border-brand-500/50 hover:bg-white/5 active:scale-95 text-left transition-all"
              >
                <p className="font-bold text-white text-sm">🎲 All Rounder</p>
                <p className="text-xs text-naija-muted">Mix of easy, medium & hard</p>
              </button>

              <button
                onClick={() => handleStartGame('easy')}
                className="p-3.5 min-h-[48px] rounded-xl bg-naija-card border border-white/10 hover:border-emerald-500/50 hover:bg-white/5 active:scale-95 text-left transition-all"
              >
                <p className="font-bold text-emerald-400 text-sm">🟢 Street Football (Easy)</p>
                <p className="text-xs text-naija-muted">Everyday famous moments</p>
              </button>

              <button
                onClick={() => handleStartGame('medium')}
                className="p-3.5 min-h-[48px] rounded-xl bg-naija-card border border-white/10 hover:border-amber-500/50 hover:bg-white/5 active:scale-95 text-left transition-all"
              >
                <p className="font-bold text-amber-400 text-sm">🟡 Viewing Centre (Medium)</p>
                <p className="text-xs text-naija-muted">For true football fans</p>
              </button>

              <button
                onClick={() => handleStartGame('hard')}
                className="p-3.5 min-h-[48px] rounded-xl bg-naija-card border border-white/10 hover:border-rose-500/50 hover:bg-white/5 active:scale-95 text-left transition-all"
              >
                <p className="font-bold text-rose-400 text-sm">🔴 National Archives (Hard)</p>
                <p className="text-xs text-naija-muted">Deep cuts for football historians</p>
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Setting the pitch and loading trivia...</p>
      </div>
    );
  }

  // ─── Empty State ───────────────────────────────────────────────────────────
  if (phase === 'empty' || questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white">No questions in this tier</h2>
        <p className="text-sm text-naija-muted">
          Be the first to submit a Nigerian football question or try another difficulty.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setPhase('difficulty_select')}>
            Change Level
          </Button>
          <Button onClick={() => setSubmitModalOpen(true)}>+ Submit Question</Button>
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

  // ─── Result State ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const resultMeta = getFootballResultBand(score, questions.length);
    const scoreText = `${score} / ${questions.length}`;
    const shareText = `I scored ${score}/${questions.length} on ${title}! ${resultMeta.emoji} ${resultMeta.label}.\nAre you a Bench Warmer or Super Eagles Legend? Test yourself!`;
    const shareUrl =
      typeof window !== 'undefined' ? window.location.href : 'https://naijabox.app/boxes/football-trivia';

    return (
      <div className="w-full max-w-xl mx-auto space-y-6">
        <ResultLayout
          currentSlug={slug}
          title={title}
          resultScore={scoreText}
          resultLabel={resultMeta.label}
          resultDescription={resultMeta.description}
          shareText={shareText}
          shareUrl={shareUrl}
          onTryAgain={handleReset}
        />
      </div>
    );
  }

  // ─── Question Answering / Revealed State ────────────────────────────────────
  const currentQ = questions[currentIdx];
  const isAnswered = phase === 'revealed';
  const isCorrect = Array.isArray(currentQ.correct)
    ? currentQ.correct.includes(selectedOptionId || '')
    : false;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header and Progress */}
      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-naija-muted">
          <span className="font-semibold uppercase tracking-wider text-brand-400">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="font-mono bg-white/5 px-2 py-1 rounded">Score: {score}</span>
        </div>
        <ProgressBar value={currentIdx + 1} max={questions.length} />
        <div className="pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
            Tier: {currentQ.difficulty || selectedDifficulty}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-2 leading-relaxed">
            {currentQ.text}
          </h2>
        </div>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {currentQ.options.map((opt) => {
          let btnStyle =
            'bg-naija-card border-white/10 hover:border-brand-500/50 hover:bg-white/5 text-white';

          if (isAnswered) {
            const isThisCorrect = currentQ.correct?.includes(opt.id);
            const isThisSelected = selectedOptionId === opt.id;

            if (isThisCorrect) {
              btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
            } else if (isThisSelected && !isThisCorrect) {
              btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold';
            } else {
              btnStyle = 'bg-naija-card/50 border-white/5 text-naija-muted opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              disabled={isAnswered}
              onClick={() => handleSelectOption(opt.id)}
              className={`w-full min-h-[52px] p-4 rounded-xl border text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 ${btnStyle}`}
            >
              <span className="text-sm font-medium">{opt.text}</span>
              {isAnswered && currentQ.correct?.includes(opt.id) && (
                <span className="text-emerald-400 text-lg ml-2">✓</span>
              )}
              {isAnswered && selectedOptionId === opt.id && !currentQ.correct?.includes(opt.id) && (
                <span className="text-rose-400 text-lg ml-2">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isAnswered && (
        <Card
          className={`p-4 space-y-3 border ${
            isCorrect ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'
          }`}
        >
          <div className="space-y-1">
            <p className="font-bold text-sm text-white flex items-center gap-2">
              {isCorrect ? '🎉 Correct!' : '❌ Missed it!'}
            </p>
            {currentQ.explanation && (
              <p className="text-xs sm:text-sm text-naija-muted leading-relaxed">
                {currentQ.explanation}
              </p>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full min-h-[48px] rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-sm uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {currentIdx + 1 < questions.length ? 'Next Question ➡️' : 'See Your Score 🏆'}
          </button>
        </Card>
      )}

      {/* Footer info: attribution, report, submit */}
      <div className="flex items-center justify-between text-xs text-naija-muted pt-2 px-2">
        <ReportButton questionId={currentQ.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="hover:text-white transition-colors underline underline-offset-4 min-h-[44px] flex items-center"
        >
          + Submit a football question
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
