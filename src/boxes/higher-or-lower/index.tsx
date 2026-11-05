'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { BoxProps } from '../types';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { analytics } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceOptionMeta {
  item?: {
    name: string;
    category?: string;
  };
  reference_price_ngn?: number;
  price_as_of?: string;
  price_source?: string;
}

interface PriceItem {
  id: string;
  text: string;
  options: PriceOptionMeta | null;
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

interface RoundPair {
  itemA: PriceItem;
  itemB: PriceItem;
  priceA: number;
  priceB: number;
}

interface UserRoundResult {
  round: number;
  nameA: string;
  priceA: number;
  nameB: string;
  priceB: number;
  guess: 'higher' | 'lower';
  isCorrect: boolean;
}

type Phase = 'loading' | 'playing' | 'revealed' | 'result' | 'empty';

const TOTAL_ROUNDS = 5;

function formatNGN(val: number): string {
  return '₦' + val.toLocaleString('en-NG');
}

function getResultBand(score: number): { title: string; description: string; emoji: string } {
  if (score === 5) {
    return {
      title: 'Oga at the Top (Market Don)',
      description: 'You know prices better than CBN and Balogun market traders combined. Untouchable!',
      emoji: '👑',
    };
  }
  if (score >= 4) {
    return {
      title: 'Sharp Negotiator',
      description: 'Nobody can bill you unfairly in this Lagos. Your shopping radar is 100% active.',
      emoji: '🔥',
    };
  }
  if (score >= 3) {
    return {
      title: 'Average Shopper',
      description: 'You dey try small, but recent inflation and dollar rate don dey confuse you slightly.',
      emoji: '👍',
    };
  }
  if (score >= 1) {
    return {
      title: 'Price Shock Victim',
      description: 'Omo! When last did you enter market? You are still thinking with 2021 exchange rate.',
      emoji: '😅',
    };
  }
  return {
    title: 'Pure Price Delusion',
    description: 'You don’t buy anything in this country, abi you have sugar daddy or personal chef?',
    emoji: '😭',
  };
}

export default function HigherOrLowerBox({ slug, title }: BoxProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [pairs, setPairs] = useState<RoundPair[]>([]);
  const [lastGuess, setLastGuess] = useState<'higher' | 'lower' | null>(null);
  const [roundResults, setRoundResults] = useState<UserRoundResult[]>([]);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const startedRef = useRef(false);

  // Load questions from database via API
  const loadQuestions = useCallback(async () => {
    setPhase('loading');
    try {
      // First try higher-or-lower, fallback to guess-the-price
      let res = await fetch(`/api/public/questions?experience=${slug}&count=30`);
      let data = await res.json();
      if (!data.success || !data.data || data.data.length < 2) {
        res = await fetch(`/api/public/questions?experience=guess-the-price&count=30`);
        data = await res.json();
      }

      if (data.success && Array.isArray(data.data) && data.data.length >= 2) {
        const validItems: PriceItem[] = data.data.filter((item: PriceItem) => {
          const price = item.options?.reference_price_ngn;
          return typeof price === 'number' && price > 0;
        });

        if (validItems.length < 2) {
          setPhase('empty');
          return;
        }

        // Build 5 pairs ensuring itemA and itemB have different prices when possible
        const shuffled = [...validItems].sort(() => Math.random() - 0.5);
        const builtPairs: RoundPair[] = [];
        for (let i = 0; i < Math.min(TOTAL_ROUNDS, Math.floor(shuffled.length / 2)); i++) {
          const itemA = shuffled[i * 2];
          const itemB = shuffled[i * 2 + 1];
          builtPairs.push({
            itemA,
            itemB,
            priceA: itemA.options?.reference_price_ngn || 1000,
            priceB: itemB.options?.reference_price_ngn || 1000,
          });
        }

        setPairs(builtPairs);
        setCurrentRoundIdx(0);
        setRoundResults([]);
        setPhase('playing');

        if (!startedRef.current) {
          startedRef.current = true;
          analytics.track('experience_started', { total_rounds: builtPairs.length }, slug);
        }
      } else {
        setPhase('empty');
      }
    } catch (err) {
      console.error('Failed to load price items:', err);
      setPhase('empty');
    }
  }, [slug]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentPair = pairs[currentRoundIdx];
  const score = useMemo(() => roundResults.filter((r) => r.isCorrect).length, [roundResults]);

  const handleGuess = (guess: 'higher' | 'lower') => {
    if (!currentPair || phase !== 'playing') return;

    setLastGuess(guess);
    const { priceA, priceB, itemA, itemB } = currentPair;
    const isHigher = priceB >= priceA;
    const isCorrect = (guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher);

    const resultRecord: UserRoundResult = {
      round: currentRoundIdx + 1,
      nameA: itemA.text || itemA.options?.item?.name || 'Item A',
      priceA,
      nameB: itemB.text || itemB.options?.item?.name || 'Item B',
      priceB,
      guess,
      isCorrect,
    };

    setRoundResults((prev) => [...prev, resultRecord]);
    setPhase('revealed');

    analytics.track(
      'answer_submitted',
      {
        round: currentRoundIdx + 1,
        guess,
        is_correct: isCorrect,
        price_a: priceA,
        price_b: priceB,
      },
      slug,
      itemB.id
    );
  };

  const handleNextRound = () => {
    if (currentRoundIdx + 1 < pairs.length) {
      setCurrentRoundIdx((prev) => prev + 1);
      setLastGuess(null);
      setPhase('playing');
    } else {
      setPhase('result');
      const finalScore = roundResults.filter((r) => r.isCorrect).length;
      analytics.track(
        'experience_completed',
        {
          score: finalScore,
          total: pairs.length,
          pct: Math.round((finalScore / pairs.length) * 100),
        },
        slug
      );
    }
  };

  const handleReset = () => {
    startedRef.current = false;
    loadQuestions();
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Fetching real Nigerian market prices...</p>
      </div>
    );
  }

  // ─── Empty State ───────────────────────────────────────────────────────────
  if (phase === 'empty' || !currentPair) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-naija-text">No price items available</h2>
        <p className="text-sm text-naija-muted">
          We need at least two items to start the comparison game. Check back shortly!
        </p>
        <Button onClick={() => setSubmitModalOpen(true)}>+ Submit a Price Item</Button>
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
    const resultMeta = getResultBand(score);
    const scoreText = `${score} / ${pairs.length}`;
    const shareText = `I scored ${score}/${pairs.length} on NaijaBox Higher or Lower: Price Edition! ${resultMeta.emoji}\nCan you beat my price radar?`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://naijabox.app/boxes/higher-or-lower';

    return (
      <div className="w-full max-w-xl mx-auto space-y-6">
        <ResultLayout
          currentSlug={slug}
          title={title}
          resultScore={scoreText}
          resultLabel={`${resultMeta.emoji} ${resultMeta.title}`}
          resultDescription={resultMeta.description}
          shareText={shareText}
          shareUrl={shareUrl}
          onTryAgain={handleReset}
          customResultSlot={
            <div className="space-y-4 text-left mt-4">
              <h3 className="text-sm font-semibold text-naija-muted uppercase tracking-wider">
                Round-by-Round Breakdown
              </h3>
              <div className="space-y-2">
                {roundResults.map((r) => (
                  <div
                    key={r.round}
                    className="p-3 rounded-xl bg-naija-card border border-white/5 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <p className="font-medium text-naija-text truncate">
                        {r.nameB} <span className="text-naija-muted">vs</span> {r.nameA}
                      </p>
                      <p className="text-xs text-naija-muted">
                        {formatNGN(r.priceB)} vs {formatNGN(r.priceA)}
                      </p>
                    </div>
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                        r.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {r.isCorrect ? '✓ Correct' : '✕ Wrong'}
                    </span>
                  </div>
                ))}
              </div>

              {/* PriceCheck Cross-Promotion */}
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <p className="font-bold text-naija-text text-sm">Want to look up actual market prices?</p>
                  <p className="text-xs text-naija-muted">Check laptops, smartphones, and electronics in Naija PriceCheck.</p>
                </div>
                <Link
                  href="/boxes/pricecheck"
                  className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-xl bg-brand-500 hover:bg-brand-600 text-naija-text font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
                >
                  Open PriceCheck 🔍
                </Link>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // ─── Playing / Revealed State ──────────────────────────────────────────────
  const { itemA, itemB, priceA, priceB } = currentPair;
  const nameA = itemA.text || itemA.options?.item?.name || 'Item A';
  const categoryA = itemA.options?.item?.category || 'General';
  const nameB = itemB.text || itemB.options?.item?.name || 'Item B';
  const categoryB = itemB.options?.item?.category || 'General';

  const isHigher = priceB >= priceA;
  const isCorrect = (lastGuess === 'higher' && isHigher) || (lastGuess === 'lower' && !isHigher);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header and Progress */}
      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-naija-muted">
          <span className="font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Round {currentRoundIdx + 1} of {pairs.length}
          </span>
          <span className="font-mono bg-white/5 px-2 py-1 rounded">Score: {score}</span>
        </div>
        <ProgressBar value={currentRoundIdx + 1} max={pairs.length} />
        <div className="text-center pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-naija-text">{title}</h1>
          <p className="text-xs sm:text-sm text-naija-muted">
            Is the second item more expensive or cheaper than the first?
          </p>
        </div>
      </Card>

      {/* Comparison Arena */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {/* Item A (Anchor item with known price) */}
        <Card className="p-5 flex flex-col justify-between border-brand-500/30 bg-gradient-to-b from-brand-950/20 to-naija-card">
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-600 dark:text-brand-300">
              {categoryA}
            </span>
            <h2 className="text-lg font-bold text-naija-text line-clamp-2">{nameA}</h2>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-[11px] text-naija-muted block">Market Reference Price:</span>
            <span className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight">
              {formatNGN(priceA)}
            </span>
          </div>
        </Card>

        {/* Item B (Target item with mystery or revealed price) */}
        <Card className="p-5 flex flex-col justify-between border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-naija-card">
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              {categoryB}
            </span>
            <h2 className="text-lg font-bold text-naija-text line-clamp-2">{nameB}</h2>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-[11px] text-naija-muted block">Market Reference Price:</span>
            {phase === 'revealed' ? (
              <span className="text-2xl font-black text-purple-300 font-mono tracking-tight animate-fade-in">
                {formatNGN(priceB)}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-naija-muted font-mono tracking-widest">
                  ₦ ???,???
                </span>
                <span className="animate-pulse text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Mystery
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Action / Reveal Banner */}
      {phase === 'playing' ? (
        <Card className="p-5 space-y-4 text-center">
          <p className="text-sm font-medium text-naija-text">
            Is <span className="text-brand-600 dark:text-brand-300 font-bold">{nameB}</span> higher or lower than{' '}
            <span className="text-brand-600 dark:text-brand-300 font-bold">{formatNGN(priceA)}</span>?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleGuess('higher')}
              className="min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-naija-text font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Guess Higher"
            >
              <span className="text-xl">⬆️</span> HIGHER
            </button>
            <button
              onClick={() => handleGuess('lower')}
              className="min-h-[52px] rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-naija-text font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
              aria-label="Guess Lower"
            >
              <span className="text-xl">⬇️</span> LOWER
            </button>
          </div>
        </Card>
      ) : (
        <Card
          className={`p-5 text-center space-y-4 border ${
            isCorrect
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-rose-950/30 border-rose-500/40'
          }`}
        >
          <div className="space-y-1">
            <span className="text-3xl block">{isCorrect ? '🎉' : '❌'}</span>
            <h3 className="text-xl font-black text-naija-text">
              {isCorrect ? 'Sharp! You got it right.' : 'Omo, you missed this one!'}
            </h3>
            <p className="text-xs text-naija-muted">
              {nameB} is {formatNGN(priceB)} ({priceB >= priceA ? 'Higher' : 'Lower'} than{' '}
              {formatNGN(priceA)} by {formatNGN(Math.abs(priceB - priceA))}).
            </p>
          </div>

          <button
            onClick={handleNextRound}
            className="w-full min-h-[48px] rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-naija-text font-bold text-sm uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {currentRoundIdx + 1 < pairs.length ? 'Next Round ➡️' : 'See Final Score 🏆'}
          </button>
        </Card>
      )}

      {/* Footer controls: Report and Submit */}
      <div className="flex items-center justify-between text-xs text-naija-muted pt-2 px-2">
        <ReportButton questionId={itemB.id} />
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="hover:text-naija-text transition-colors underline underline-offset-4 min-h-[44px] flex items-center"
        >
          + Suggest a price comparison
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
