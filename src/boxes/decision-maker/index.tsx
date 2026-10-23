'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BoxProps } from '../types';
import { Card, Button, Chip } from '@/components/ui';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { analytics } from '@/lib/analytics';

// ─── Presets ─────────────────────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  emoji: string;
  options: string[];
}

const PRESETS: Preset[] = [
  {
    id: 'food',
    label: 'What to eat?',
    emoji: '🍽️',
    options: ['Jollof rice', 'Fried rice', 'Egusi soup', 'Pounded yam', 'Noodles', 'Suya', 'Shawarma', 'Amala', 'Eba and banga', 'Beans and dodo'],
  },
  {
    id: 'text',
    label: 'Should I text them?',
    emoji: '📱',
    options: ['Yes — life is short', 'No — let them suffer', 'Wait 3 days first', 'Text but act busy', 'Post a story instead'],
  },
  {
    id: 'weekend',
    label: 'Weekend plans?',
    emoji: '🎉',
    options: ['Stay home and Netflix', 'Visit family (God help you)', 'Owambe all weekend', 'Gym and grow', 'Church, then Owambe', 'Mall and grind'],
  },
  {
    id: 'money',
    label: 'How to spend this money?',
    emoji: '💸',
    options: ['Save it', 'Invest it', 'Treat yourself', 'Give it to mum', 'Small chops and cold drink', 'Bet it (don\'t do this)'],
  },
  {
    id: 'hustle',
    label: 'Side hustle?',
    emoji: '💼',
    options: ['Start a blog', 'Sell on Instagram', 'Learn a skill', 'Drop shipping', 'Real estate (when money come)', 'Freelancing'],
  },
];

// ─── Spin animation frame helpers ────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'spinning' | 'result';

interface CustomOption {
  id: string;
  value: string;
}

const MAX_CUSTOM = 10;

export default function DecisionMakerBox({ slug, title }: BoxProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([
    { id: crypto.randomUUID(), value: '' },
    { id: crypto.randomUUID(), value: '' },
  ]);
  const [customInput, setCustomInput] = useState('');
  const [spinText, setSpinText] = useState('');
  const [winner, setWinner] = useState('');
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Analytics: box_opened
  useEffect(() => {
    analytics.track('box_opened', { experience: slug }, slug);
  }, [slug]);

  // Cleanup spinner on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const activeOptions: string[] = selectedPreset
    ? selectedPreset.options
    : customOptions.map((o) => o.value.trim()).filter(Boolean);

  const canDecide = activeOptions.length >= 2;

  const startSpin = useCallback(() => {
    if (!canDecide) return;

    analytics.track(
      'experience_started',
      { experience: slug, entry: 'direct' },
      slug,
    );
    analytics.track(
      'decision_made',
      {
        preset: selectedPreset ? selectedPreset.id : 'custom',
        option_count: activeOptions.length,
      },
      slug,
    );

    setPhase('spinning');

    // Fast shuffle for ~1.8s then slow down to a winner
    const picked = randomFrom(activeOptions);
    let ticks = 0;
    const totalTicks = 24;

    spinIntervalRef.current = setInterval(() => {
      ticks++;
      setSpinText(randomFrom(activeOptions));

      if (ticks >= totalTicks) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        setWinner(picked);
        setPhase('result');
        analytics.track(
          'experience_completed',
          { experience: slug, duration_ms: null, result_id: null },
          slug,
        );
        analytics.track(
          'result_shown',
          { experience: slug, score: null, label: picked },
          slug,
        );
      }
    }, 80);
  }, [canDecide, activeOptions, selectedPreset, slug]);

  const handleTryAgain = useCallback(() => {
    setPhase('setup');
    setWinner('');
    setSpinText('');
    analytics.track('try_again_clicked', { experience: slug }, slug);
  }, [slug]);

  const handleCustomInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value);
  }, []);

  const handleAddCustom = useCallback(() => {
    const val = customInput.trim();
    if (!val || customOptions.length >= MAX_CUSTOM) return;
    setCustomOptions((prev) => [...prev, { id: crypto.randomUUID(), value: val }]);
    setCustomInput('');
  }, [customInput, customOptions.length]);

  const handleRemoveCustom = useCallback((id: string) => {
    setCustomOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
      }
    },
    [handleAddCustom],
  );

  // ── Spinning phase ─────────────────────────────────────────────────────────

  if (phase === 'spinning') {
    return (
      <div className="w-full max-w-xl mx-auto space-y-6">
        <Card className="p-8 text-center space-y-6">
          <p className="text-xs uppercase tracking-wider text-naija-muted font-bold">Deciding…</p>
          <div
            className="text-3xl sm:text-4xl font-black text-brand-400 min-h-[72px] flex items-center justify-center transition-all"
            aria-live="polite"
            aria-atomic="true"
          >
            {spinText || '…'}
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────────

  if (phase === 'result') {
    return (
      <ResultLayout
        currentSlug={slug}
        title={title}
        resultLabel={`The box says: ${winner}`}
        resultDescription="The decision has been made. No backing out — NaijaBox has spoken. Carry go!"
        shareTitle="Random Decision Maker — NaijaBox"
        shareText={`I asked NaijaBox to decide for me and it said: "${winner}" 😂 Try it yourself!`}
        shareUrl={`https://naijabox.app/boxes/decision-maker`}
        onTryAgain={handleTryAgain}
      />
    );
  }

  // ── Setup phase ────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <Card className="p-6 text-center space-y-2">
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="text-sm text-naija-muted">
          Can&apos;t decide? Add your options and let NaijaBox sort it out for you.
        </p>
      </Card>

      {/* Preset chooser */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
          Quick presets
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPreset(selectedPreset?.id === p.id ? null : p);
                setCustomOptions([
                  { id: crypto.randomUUID(), value: '' },
                  { id: crypto.randomUUID(), value: '' },
                ]);
              }}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium',
                'border transition-colors min-h-[44px] cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                selectedPreset?.id === p.id
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-naija-surface border-naija-border/60 text-naija-muted hover:border-brand-500/50',
              ].join(' ')}
              aria-pressed={selectedPreset?.id === p.id}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset options preview */}
      {selectedPreset && (
        <Card className="p-4 space-y-2">
          <p className="text-xs text-naija-muted font-semibold">Options in this preset:</p>
          <div className="flex flex-wrap gap-2">
            {selectedPreset.options.map((o, i) => (
              <Chip key={i}>{o}</Chip>
            ))}
          </div>
        </Card>
      )}

      {/* Custom options (shown when no preset selected) */}
      {!selectedPreset && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Or build your own list (min 2 options)
          </h3>

          <div className="space-y-2">
            {customOptions.map((opt) => (
              <div key={opt.id} className="flex gap-2">
                <span className="flex-1 px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/50 text-sm text-white min-h-[44px] flex items-center">
                  {opt.value || <span className="text-naija-muted italic">Empty option</span>}
                </span>
                <button
                  onClick={() => handleRemoveCustom(opt.id)}
                  className="px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg border border-naija-border/50 text-naija-muted hover:text-red-400 hover:border-red-400/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={`Remove option: ${opt.value}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {customOptions.length < MAX_CUSTOM && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={handleCustomInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type an option and press Enter or Add"
                maxLength={80}
                className="flex-1 px-3 py-2 rounded-lg bg-naija-surface border border-naija-border/50 text-sm text-white placeholder:text-naija-muted/60 focus:outline-none focus:border-brand-500 min-h-[44px]"
                aria-label="New option text"
              />
              <Button onClick={handleAddCustom} variant="secondary" size="default">
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Decide button */}
      <Button
        onClick={startSpin}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canDecide}
      >
        🎲 Let NaijaBox Decide!
      </Button>

      {!canDecide && !selectedPreset && (
        <p className="text-center text-xs text-naija-muted">
          Add at least 2 options above to continue.
        </p>
      )}
    </div>
  );
}
