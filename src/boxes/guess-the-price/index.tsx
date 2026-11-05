'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { analytics } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceItem {
  item: { name: string; category: string };
  reference_price_ngn: number;
  price_as_of?: string;
  price_source?: string;
}

interface Question {
  id: string;
  text: string;
  options: PriceItem;
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUESTION_COUNT = 8;

function formatNGN(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

function diffPct(guess: number, real: number): number {
  return Math.abs((guess - real) / real) * 100;
}

function scoreDiff(pct: number): number {
  if (pct <= 5) return 100;
  if (pct <= 10) return 80;
  if (pct <= 20) return 60;
  if (pct <= 35) return 40;
  if (pct <= 60) return 20;
  return 0;
}

function diffLabel(pct: number, guess: number, real: number): { emoji: string; text: string } {
  const dir = guess < real ? 'too low' : 'too high';
  if (pct <= 3) return { emoji: '🎯', text: 'Exact! You shop like a pro.' };
  if (pct <= 10) return { emoji: '🔥', text: `Very close! Just ${dir}.` };
  if (pct <= 25) return { emoji: '👍', text: `Not bad! A bit ${dir}.` };
  if (pct <= 50) return { emoji: '😅', text: `Off by a bit. Way ${dir}.` };
  return { emoji: '😂', text: `Omo! That was way ${dir}. Are you okay?` };
}

function resultBand(score: number, max: number): { label: string; desc: string } {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80)
    return { label: '🛒 Naija Market Expert', desc: "You know the prices before you even reach the market gate. Respect." };
  if (pct >= 55)
    return { label: '📊 Sharp Shopper', desc: "You've been watching prices. Almost there — just a few zeros off." };
  if (pct >= 30)
    return { label: '🧾 Learning the Market', desc: "You have a rough idea but the dollar rate got you confused. Understandable." };
  return { label: '🤷 Price Shock Incoming', desc: "You've definitely not been to Ikeja Computer Village lately. It shows." };
}

// Slider min/max adapt to price magnitude
function sliderBounds(ref: number): { min: number; max: number; step: number } {
  if (ref < 10_000) return { min: 100, max: 20_000, step: 100 };
  if (ref < 100_000) return { min: 1_000, max: 200_000, step: 1_000 };
  if (ref < 500_000) return { min: 10_000, max: 1_000_000, step: 5_000 };
  return { min: 50_000, max: 3_000_000, step: 10_000 };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RoundResult {
  questionId: string;
  itemName: string;
  guess: number;
  real: number;
  diffPct: number;
  score: number;
}

type Phase = 'loading' | 'guessing' | 'revealed' | 'result' | 'error';

export default function GuessThePriceBox({ slug, title }: BoxProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guess, setGuess] = useState(0);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [error, setError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const startedRef = useRef(false);

  const currentQ = questions[currentIdx];

  // Analytics: box_opened
  useEffect(() => {
    analytics.track('box_opened', { experience: slug }, slug);
  }, [slug]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch(
        `/api/public/questions?experienceKey=${slug}&count=${QUESTION_COUNT}&random=true`,
      );
      if (!res.ok) throw new Error('Failed to load');
      const data = (await res.json()) as { questions: Question[] };
      if (!data.questions?.length) {
        setError('No price items available right now. Come back later!');
        setPhase('error');
        return;
      }
      setQuestions(data.questions);
      // Initialise slider to midpoint of first item's bounds
      const firstRef = data.questions[0]?.options?.reference_price_ngn ?? 100_000;
      const { min, max } = sliderBounds(firstRef);
      setGuess(Math.round((min + max) / 2));
      setCurrentIdx(0);
      setRounds([]);
      setStreak(0);
      setBestStreak(0);
      setPhase('guessing');
    } catch {
      setError('Could not load questions. Check your connection and try again.');
      setPhase('error');
    }
  }, [slug]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // When current question changes, reset slider
  useEffect(() => {
    if (currentQ) {
      const ref = currentQ.options?.reference_price_ngn ?? 100_000;
      const { min, max } = sliderBounds(ref);
      setGuess(Math.round((min + max) / 2));
    }
  }, [currentIdx, currentQ]);

  const handleReveal = useCallback(async () => {
    if (!currentQ) return;
    if (!startedRef.current) {
      startedRef.current = true;
      analytics.track('experience_started', { experience: slug, entry: 'direct' }, slug);
    }

    const real = currentQ.options.reference_price_ngn;
    const pct = diffPct(guess, real);
    const pts = scoreDiff(pct);
    const isClose = pct <= 10;

    const newStreak = isClose ? streak + 1 : 0;
    const newBest = Math.max(bestStreak, newStreak);
    setStreak(newStreak);
    setBestStreak(newBest);

    const round: RoundResult = {
      questionId: currentQ.id,
      itemName: currentQ.options.item?.name ?? currentQ.text,
      guess,
      real,
      diffPct: pct,
      score: pts,
    };
    setRounds((prev) => [...prev, round]);

    // Record answer
    await fetch('/api/public/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: currentQ.id,
        answer: { guess_ngn: guess },
        experience_key: slug,
      }),
    }).catch(() => {});

    analytics.track(
      'price_guess_submitted',
      { question_id: currentQ.id, guess_ngn: guess, diff_pct: Math.round(pct), streak: newStreak },
      slug,
      currentQ.id,
    );
    analytics.track('question_answered', { experience: slug, question_id: currentQ.id, index: currentIdx, is_correct: pct <= 10, time_ms: null }, slug, currentQ.id);

    setPhase('revealed');
  }, [currentQ, guess, streak, bestStreak, currentIdx, slug]);

  const handleNext = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      // Done
      const totalScore = rounds.reduce((s, r) => s + r.score, 0);
      const maxScore = rounds.length * 100;
      analytics.track('experience_completed', { experience: slug, duration_ms: null, result_id: null }, slug);
      analytics.track('result_shown', { experience: slug, score: totalScore, label: resultBand(totalScore, maxScore + 100).label }, slug);
      setPhase('result');
    } else {
      setCurrentIdx(nextIdx);
      setPhase('guessing');
    }
  }, [currentIdx, questions.length, rounds, slug]);

  const handleTryAgain = useCallback(() => {
    startedRef.current = false;
    analytics.track('try_again_clicked', { experience: slug }, slug);
    loadQuestions();
  }, [slug, loadQuestions]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center">
        <p className="text-naija-muted animate-pulse">Loading price items…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <Card className="p-6 text-center space-y-4">
          <p className="text-naija-text">{error}</p>
          <Button onClick={loadQuestions} variant="primary" size="default">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────

  if (phase === 'result') {
    const totalScore = rounds.reduce((s, r) => s + r.score, 0);
    const maxScore = rounds.length * 100;
    const band = resultBand(totalScore, maxScore);

    return (
      <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Breakdown table */}
        <Card className="p-4 space-y-3 overflow-x-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Score breakdown
          </h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-naija-muted border-b border-naija-border/40">
                <th className="pb-1 pr-2 font-semibold">Item</th>
                <th className="pb-1 pr-2 font-semibold text-right">Your guess</th>
                <th className="pb-1 pr-2 font-semibold text-right">Real price</th>
                <th className="pb-1 font-semibold text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r, i) => (
                <tr key={i} className="border-b border-naija-border/20 last:border-0">
                  <td className="py-1 pr-2 text-naija-text max-w-[120px] truncate">{r.itemName}</td>
                  <td className="py-1 pr-2 text-right text-naija-muted">{formatNGN(r.guess)}</td>
                  <td className="py-1 pr-2 text-right text-brand-600 dark:text-brand-400">{formatNGN(r.real)}</td>
                  <td className="py-1 text-right font-bold text-naija-text">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bestStreak >= 2 && (
            <p className="text-xs text-amber-400 text-center">🔥 Best streak: {bestStreak} in a row!</p>
          )}
        </Card>

        <ResultLayout
          currentSlug={slug}
          title={title}
          resultScore={`${totalScore} / ${maxScore}`}
          resultLabel={band.label}
          resultDescription={band.desc}
          shareTitle="Guess the Price — NaijaBox"
          shareText={`I scored ${totalScore}/${maxScore} on Naija Guess the Price! "${band.label}" 💸 Can you do better?`}
          shareUrl={`https://naijabox.app/boxes/guess-the-price`}
          onTryAgain={handleTryAgain}
        />

        <footer className="flex items-center justify-center gap-4 pt-2">
          <Link href="/boxes/pricecheck" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
            🛒 Check real Naija prices →
          </Link>
        </footer>
      </div>
    );
  }

  // ── Guessing / Revealed ────────────────────────────────────────────────────

  if (!currentQ) return null;

  const ref = currentQ.options?.reference_price_ngn ?? 100_000;
  const bounds = sliderBounds(ref);
  const dl = phase === 'revealed' ? diffLabel(rounds[rounds.length - 1]?.diffPct ?? 0, guess, ref) : null;
  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <ProgressBar
        value={currentIdx}
        max={questions.length}
        label={`${currentIdx} of ${questions.length} items`}
        className="mb-2"
      />

      {/* Item card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-brand-600 dark:text-brand-400 font-bold">
              {currentQ.options?.item?.category ?? 'Item'}
            </span>
            <h2 className="text-xl font-black text-naija-text mt-0.5">{currentQ.text}</h2>
            {currentQ.options?.price_source && (
              <p className="text-[10px] text-naija-muted mt-1">
                Source: {currentQ.options.price_source}
              </p>
            )}
          </div>
          {streak >= 2 && <span className="text-xl" title={`${streak} in a row!`}>🔥</span>}
        </div>

        {/* Slider */}
        {phase === 'guessing' && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-3xl font-black text-brand-600 dark:text-brand-400">{formatNGN(guess)}</span>
            </div>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none bg-naija-cardSubtle accent-brand-500 cursor-pointer"
              aria-label={`Your price guess. Currently set to ${formatNGN(guess)}`}
            />
            <div className="flex justify-between text-[10px] text-naija-muted">
              <span>{formatNGN(bounds.min)}</span>
              <span>{formatNGN(bounds.max)}</span>
            </div>
          </div>
        )}

        {/* Revealed state */}
        {phase === 'revealed' && lastRound && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-naija-surface/60 border border-naija-border/40 p-3">
                <div className="text-[10px] text-naija-muted uppercase font-semibold mb-1">Your guess</div>
                <div className="text-lg font-black text-naija-text">{formatNGN(lastRound.guess)}</div>
              </div>
              <div className="rounded-lg bg-brand-500/10 border border-brand-500/30 p-3">
                <div className="text-[10px] text-brand-600 dark:text-brand-400 uppercase font-semibold mb-1">Real price</div>
                <div className="text-lg font-black text-brand-600 dark:text-brand-300">{formatNGN(lastRound.real)}</div>
              </div>
            </div>

            {dl && (
              <div className="text-center space-y-1">
                <span className="text-2xl">{dl.emoji}</span>
                <p className="text-sm text-naija-text font-semibold">{dl.text}</p>
                <p className="text-xs text-naija-muted">
                  Off by {lastRound.diffPct.toFixed(1)}% · +{lastRound.score} points
                </p>
              </div>
            )}

            {currentQ.explanation && (
              <p className="text-xs text-naija-muted bg-naija-surface/50 border border-naija-border/30 rounded-lg p-3">
                💡 {currentQ.explanation}
              </p>
            )}

            {/* PriceCheck CTA */}
            <Link
              href="/boxes/pricecheck"
              onClick={() =>
                analytics.track('price_guess_cta_clicked', { question_id: currentQ.id }, slug, currentQ.id)
              }
              className="block text-center text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              🛒 See real market listings on PriceCheck →
            </Link>
          </div>
        )}
      </Card>

      {/* Action button */}
      {phase === 'guessing' && (
        <Button onClick={handleReveal} variant="primary" size="lg" fullWidth>
          💰 Reveal Price
        </Button>
      )}
      {phase === 'revealed' && (
        <Button onClick={handleNext} variant="primary" size="lg" fullWidth>
          {currentIdx + 1 < questions.length ? '➡️ Next Item' : '🏁 See My Score'}
        </Button>
      )}

      {/* Footer: report + submit */}
      <footer className="flex items-center justify-between pt-2 border-t border-naija-border/30">
        <ReportButton questionId={currentQ.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="text-xs text-naija-muted hover:text-brand-600 dark:text-brand-400 transition-colors min-h-[44px] px-3"
        >
          + Submit a question
        </button>
        <SubmitQuestionModal
          experienceKey={slug}
          experienceTitle={title}
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
        />
      </footer>
    </div>
  );
}
