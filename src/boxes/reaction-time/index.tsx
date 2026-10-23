'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoxProps } from '../types';
import { Card, Button } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { analytics } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'result';

interface RunResult {
  ms: number;
  tooSoon: boolean;
}

interface PercentileData {
  available: boolean;
  percentile?: number;
  total?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PB_KEY = 'naijabox_reaction_pb';
const NUM_ROUNDS = 3;

/** Random delay between 1.5 s and 5 s before the colour changes */
function randomDelay() {
  return 1500 + Math.random() * 3500;
}

function ratingLabel(ms: number): { label: string; emoji: string; desc: string } {
  if (ms < 200)
    return {
      label: 'Superhuman Reflexes',
      emoji: '🚀',
      desc: "Are you even human? That speed is illegal in most states. Nigerian Avengers want to recruit you.",
    };
  if (ms < 250)
    return {
      label: 'Danfo-Driver Fast',
      emoji: '⚡',
      desc: "You react like a Lagos bus driver in traffic. Lightning quick and slightly dangerous.",
    };
  if (ms < 300)
    return {
      label: 'Sharp Sharp',
      emoji: '🔥',
      desc: "Naija-fast! You'd clock out early and still finish first. Top-tier reflexes.",
    };
  if (ms < 350)
    return {
      label: 'Everyday Naija',
      emoji: '👏',
      desc: "Solid reflexes. You survive Lagos traffic and NEPA blackouts. You dey try.",
    };
  if (ms < 450)
    return {
      label: 'Taking Your Time',
      emoji: '😌',
      desc: "You're not rushing for nobody. Typical \"I'll be there in 5 minutes\" energy.",
    };
  return {
    label: 'NEPA Style',
    emoji: '💡',
    desc: "You dey go, you just dey go slow. Like light that takes forever to come back. Try again — maybe NEPA will cooperate this time.",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReactionTimeBox({ slug, title }: BoxProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [results, setResults] = useState<RunResult[]>([]);
  const [tooSoonCount, setTooSoonCount] = useState(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [percentileData, setPercentileData] = useState<PercentileData | null>(null);
  const [isDaily, setIsDaily] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const startedRef = useRef(false);

  // Resolve session id from cookie or localStorage
  useEffect(() => {
    const match = document.cookie.match(/(^| )nb_sid=([^;]+)/);
    if (match) setSessionId(match[2]);
    else setSessionId(localStorage.getItem('nb_sid') ?? '');
  }, []);

  // Load personal best from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PB_KEY);
    if (stored) setPersonalBest(Number(stored));
  }, []);

  // Analytics: box_opened once
  useEffect(() => {
    analytics.track('box_opened', { experience: slug }, slug);
  }, [slug]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Derived: average ms across completed rounds
  const finalMs =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)
      : 0;

  // ── Persist + fetch percentile once the game finishes ──────────────────────

  const persistResult = useCallback(async () => {
    if (!sessionId || finalMs === 0) return;

    const isNewPB = personalBest === null || finalMs < personalBest;
    if (isNewPB) {
      localStorage.setItem(PB_KEY, String(finalMs));
      setPersonalBest(finalMs);
    }

    // POST to DB (non-blocking)
    try {
      await fetch('/api/public/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ms: finalMs, is_daily: isDaily, session_id: sessionId }),
      });
    } catch {
      // non-blocking; result still shown
    }

    // Fetch gated percentile
    try {
      const res = await fetch(`/api/public/reaction?ms=${finalMs}`);
      const data = (await res.json()) as PercentileData;
      setPercentileData(data);
    } catch {
      setPercentileData({ available: false });
    }

    // Analytics events
    analytics.track(
      'reaction_completed',
      {
        ms: finalMs,
        is_daily: isDaily,
        is_personal_best: isNewPB,
        too_soon_count: tooSoonCount,
      },
      slug,
    );
    analytics.track(
      'experience_completed',
      { experience: slug, duration_ms: finalMs, result_id: null },
      slug,
    );
    analytics.track(
      'result_shown',
      { experience: slug, score: finalMs, label: ratingLabel(finalMs).label },
      slug,
    );
  }, [sessionId, finalMs, personalBest, isDaily, tooSoonCount, slug]);

  useEffect(() => {
    if (gameState === 'result') {
      persistResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // ── Game controls ───────────────────────────────────────────────────────────

  const startRound = useCallback(() => {
    setGameState('waiting');

    if (!startedRef.current) {
      startedRef.current = true;
      analytics.track(
        'experience_started',
        { experience: slug, entry: 'direct' },
        slug,
      );
    }

    timerRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = performance.now();
    }, randomDelay());
  }, [slug]);

  const handleTap = useCallback(() => {
    if (gameState === 'waiting') {
      // Clicked too early — penalise and reset to idle
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooSoonCount((c) => c + 1);
      setGameState('idle');
      return;
    }

    if (gameState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setResults((prev) => {
        const next = [...prev, { ms: elapsed, tooSoon: false }];
        if (next.length >= NUM_ROUNDS) {
          // Use setTimeout so state setter completes before next state transition
          setTimeout(() => setGameState('result'), 0);
        } else {
          setTimeout(() => setGameState('clicked'), 0);
        }
        return next;
      });
    }
  }, [gameState]);

  const handleTryAgain = useCallback(() => {
    setResults([]);
    setTooSoonCount(0);
    setPercentileData(null);
    setGameState('idle');
    startedRef.current = false;
    analytics.track('try_again_clicked', { experience: slug }, slug);
  }, [slug]);

  // ── Result screen ───────────────────────────────────────────────────────────

  if (gameState === 'result') {
    const rating = ratingLabel(finalMs);
    const isNewPB = personalBest !== null && finalMs <= personalBest;

    const descParts = [rating.desc];
    if (percentileData?.available && percentileData.percentile !== undefined) {
      descParts.push(
        `You're faster than ${percentileData.percentile}% of players (from ${percentileData.total?.toLocaleString()} results).`,
      );
    }
    if (isNewPB) descParts.push('🏆 New personal best!');

    return (
      <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Round breakdown mini-card */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted text-center">
            Round breakdown
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="text-center p-2 rounded-lg bg-naija-surface/60 border border-naija-border/50"
              >
                <div className="text-lg font-black text-brand-400">{r.ms}</div>
                <div className="text-[10px] text-naija-muted">ms</div>
                <div className="text-[10px] text-naija-muted">Round {i + 1}</div>
              </div>
            ))}
          </div>
          {tooSoonCount > 0 && (
            <p className="text-center text-xs text-amber-400">
              ⚠️ Clicked too soon {tooSoonCount} time{tooSoonCount !== 1 ? 's' : ''}
            </p>
          )}
        </Card>

        <ResultLayout
          currentSlug={slug}
          title={title}
          resultScore={`${finalMs}ms avg`}
          resultLabel={`${rating.emoji} ${rating.label}`}
          resultDescription={descParts.join(' ')}
          shareTitle="Reaction Time — NaijaBox"
          shareText={`I reacted in ${finalMs}ms on NaijaBox! ${rating.emoji} Can you beat me?`}
          shareUrl={`https://naijabox.app/boxes/reaction-time`}
          onTryAgain={handleTryAgain}
        />
      </div>
    );
  }

  // ── Game screen ─────────────────────────────────────────────────────────────

  const tapBgClass =
    gameState === 'ready'
      ? 'bg-green-500 active:bg-green-600'
      : gameState === 'waiting'
      ? 'bg-red-700'
      : 'bg-naija-surface border border-naija-border/40';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 text-center space-y-2">
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="text-sm text-naija-muted">
          Wait for green, tap fast. {NUM_ROUNDS} rounds — average is your score.
        </p>

        {/* Daily challenge toggle (only before starting) */}
        {gameState === 'idle' && results.length === 0 && (
          <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none min-h-[44px] justify-center">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-500"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
              id="daily-toggle"
            />
            <span className="text-xs text-naija-muted">
              Count this as today&apos;s daily challenge
            </span>
          </label>
        )}

        {personalBest !== null && (
          <p className="text-xs text-brand-400 font-semibold">🏆 Your PB: {personalBest}ms</p>
        )}

        {tooSoonCount > 0 && gameState === 'idle' && (
          <p className="text-xs text-amber-400">
            ⚠️ Too soon! You clicked early {tooSoonCount} time{tooSoonCount !== 1 ? 's' : ''}.
          </p>
        )}
      </Card>

      {/* Big tap zone */}
      <button
        onClick={handleTap}
        disabled={gameState === 'idle' || gameState === 'clicked'}
        aria-label={
          gameState === 'waiting'
            ? 'Waiting — do not tap yet'
            : gameState === 'ready'
            ? 'Tap now!'
            : 'Tap zone'
        }
        className={[
          'w-full rounded-2xl select-none transition-colors duration-75',
          'flex flex-col items-center justify-center gap-3 min-h-[220px]',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500',
          tapBgClass,
          gameState === 'idle' || gameState === 'clicked' ? 'opacity-50 cursor-default' : 'cursor-pointer',
        ].join(' ')}
      >
        {gameState === 'waiting' && (
          <span className="text-white/80 text-xl font-bold animate-pulse">Wait for green…</span>
        )}
        {gameState === 'ready' && (
          <span className="text-white text-4xl font-black animate-bounce">TAP!</span>
        )}
        {(gameState === 'idle' || gameState === 'clicked') && (
          <span className="text-naija-muted text-sm">Use the button below to start</span>
        )}
      </button>

      {/* CTA button */}
      {(gameState === 'idle' || gameState === 'clicked') && (
        <Button onClick={startRound} variant="primary" size="lg" fullWidth>
          {results.length === 0
            ? '🟢 Start'
            : `🟢 Round ${results.length + 1} of ${NUM_ROUNDS}`}
        </Button>
      )}

      {/* Round progress pips */}
      {results.length > 0 && (
        <div className="flex justify-center gap-3">
          {Array.from({ length: NUM_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={[
                'w-3 h-3 rounded-full transition-colors',
                i < results.length ? 'bg-brand-500' : 'bg-naija-border',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  );
}
