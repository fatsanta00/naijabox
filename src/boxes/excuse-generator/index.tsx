'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { BoxProps } from '../types';
import { Card, Button } from '@/components/ui';
import { ReportButton } from '@/components/content/ReportButton';
import { SubmitQuestionModal } from '@/components/content/SubmitQuestionModal';
import { getRecommendedBoxes } from '@/boxes/registry';
import { analytics } from '@/lib/analytics';

interface ExcuseOptionMeta {
  scenario?: string;
  believability?: string;
  deliveryTip?: string;
}

interface ExcuseItem {
  id: string;
  text: string;
  options: ExcuseOptionMeta | null;
  explanation: string | null;
  authorName: string | null;
  showAttribution: boolean;
}

const SCENARIOS = [
  { id: 'all', label: 'Any Wahala', emoji: '🎲' },
  { id: 'work', label: 'Late to Work', emoji: '💼' },
  { id: 'event', label: 'Dodging Event', emoji: '🎉' },
  { id: 'money', label: 'No Money / Urgent 2k', emoji: '💸' },
  { id: 'late_night', label: 'Late Night / Curfew', emoji: '🌙' },
];

export default function ExcuseGeneratorBox({ slug, title }: BoxProps) {
  const [excuses, setExcuses] = useState<ExcuseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('all');
  const [currentExcuse, setCurrentExcuse] = useState<ExcuseItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const loadExcuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/questions?experience=${slug}&count=50`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setExcuses(data.data);
        analytics.track('experience_started', { total_excuses: data.data.length }, slug);
      }
    } catch (err) {
      console.error('Failed to load excuses:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    analytics.track('box_opened', { source: 'box_route' }, slug);
    loadExcuses();
  }, [slug, loadExcuses]);

  const filteredExcuses = useMemo(() => {
    if (selectedScenario === 'all') return excuses;
    return excuses.filter((e) => {
      const opts = e.options as ExcuseOptionMeta | null;
      return opts?.scenario === selectedScenario;
    });
  }, [excuses, selectedScenario]);

  const handleGenerate = useCallback(() => {
    const pool = filteredExcuses.length > 0 ? filteredExcuses : excuses;
    if (pool.length === 0) return;

    setIsGenerating(true);
    setCopied(false);

    // Pick random item distinct from current
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && currentExcuse && pick.id === currentExcuse.id) {
      const remaining = pool.filter((p) => p.id !== currentExcuse.id);
      pick = remaining[Math.floor(Math.random() * remaining.length)];
    }

    setTimeout(() => {
      setCurrentExcuse(pick);
      setIsGenerating(false);
      setGeneratedCount((prev) => prev + 1);

      analytics.track(
        'excuse_generated',
        {
          scenario: selectedScenario,
          excuse_id: pick.id,
        },
        slug,
        pick.id
      );
    }, 250);
  }, [filteredExcuses, excuses, currentExcuse, selectedScenario, slug]);

  // Generate initial excuse on first load
  useEffect(() => {
    if (!currentExcuse && excuses.length > 0) {
      const initial = excuses[Math.floor(Math.random() * excuses.length)];
      setCurrentExcuse(initial);
    }
  }, [excuses, currentExcuse]);

  const handleCopy = async () => {
    if (!currentExcuse) return;
    try {
      await navigator.clipboard.writeText(
        `"${currentExcuse.text}" — Generated via NaijaBox (https://naijabox.app/boxes/excuse-generator)`
      );
      setCopied(true);
      analytics.track('share_button_clicked', { method: 'copy_link' }, slug, currentExcuse.id);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!currentExcuse) return;
    const text = encodeURIComponent(
      `"${currentExcuse.text}" 😂\n\nGenerated with NaijaBox Excuse Generator: https://naijabox.app/boxes/excuse-generator`
    );
    analytics.track('share_button_clicked', { method: 'whatsapp' }, slug, currentExcuse.id);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-naija-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
        <p className="text-sm">Preparing excuse generator...</p>
      </div>
    );
  }

  if (excuses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white">No excuses loaded</h2>
        <p className="text-sm text-naija-muted">
          Be the first to submit a foolproof Nigerian excuse to the bank.
        </p>
        <Button onClick={() => setSubmitModalOpen(true)}>+ Submit an Excuse</Button>
        <SubmitQuestionModal
          experienceKey={slug}
          experienceTitle={title}
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
        />
      </div>
    );
  }

  const meta = currentExcuse?.options as ExcuseOptionMeta | null;
  const believability = meta?.believability || '96% Believable';
  const deliveryTip = currentExcuse?.explanation || meta?.deliveryTip || 'Deliver this with a completely straight face.';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="p-6 text-center space-y-2">
        <span className="inline-block text-[11px] uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 font-bold border border-brand-500/30">
          🇳🇬 Emergency Exit System
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
        <p className="text-sm text-naija-muted">
          Need a quick, airtight excuse to escape wahala? Pick a scenario and generate immediate cover.
        </p>
      </Card>

      {/* Scenario Selector Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-naija-muted block text-center">
          Choose Your Wahala Scenario
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              className={`px-3 py-2 rounded-full text-xs font-semibold min-h-[44px] transition-all flex items-center gap-1.5 ${
                selectedScenario === s.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-naija-surface border border-naija-border/60 text-gray-300 hover:text-white'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Excuse Display Card */}
      {currentExcuse && (
        <Card className="p-6 sm:p-8 space-y-6 border-brand-500/40 bg-naija-surface/90 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center text-xs">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              ✓ {believability}
            </span>
            <span className="text-naija-muted text-[11px]">
              Excuse #{generatedCount + 1}
            </span>
          </div>

          {/* Main Excuse Text */}
          <div className="min-h-[100px] flex items-center justify-center py-2">
            <blockquote className={`text-lg sm:text-xl font-bold text-white text-center leading-relaxed transition-opacity duration-150 ${isGenerating ? 'opacity-20' : 'opacity-100'}`}>
              &ldquo;{currentExcuse.text}&rdquo;
            </blockquote>
          </div>

          {/* Delivery Advice */}
          <div className="p-3.5 rounded-xl bg-naija-card border border-naija-border/50 text-xs space-y-1">
            <span className="text-brand-400 font-bold uppercase text-[10px] tracking-wider block">
              💡 Delivery Tip
            </span>
            <p className="text-gray-300 italic">
              {deliveryTip}
            </p>
          </div>

          {currentExcuse.authorName && currentExcuse.showAttribution && (
            <div className="text-[11px] text-center text-naija-muted">
              Contributed by {currentExcuse.authorName}
            </div>
          )}

          {/* Action Buttons (44px min touch target) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-naija-border/60">
            <Button
              onClick={handleGenerate}
              variant="primary"
              size="default"
              fullWidth
              disabled={isGenerating}
              className="sm:col-span-1"
            >
              🎲 {isGenerating ? 'Cooking…' : 'Shuffle'}
            </Button>

            <Button
              onClick={handleCopy}
              variant="secondary"
              size="default"
              fullWidth
              className="sm:col-span-1"
            >
              {copied ? '✓ Copied!' : '📋 Copy Text'}
            </Button>

            <button
              onClick={handleWhatsAppShare}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors flex items-center justify-center gap-1.5 min-h-[44px] sm:col-span-1"
            >
              <span>💬</span>
              <span>Send WhatsApp</span>
            </button>
          </div>
        </Card>
      )}

      {/* Community Action Footer */}
      <div className="flex justify-between items-center text-xs text-naija-muted px-1">
        <button
          onClick={() => setSubmitModalOpen(true)}
          className="hover:text-white transition-colors min-h-[44px] flex items-center"
        >
          + Submit an excuse
        </button>
        {currentExcuse && (
          <ReportButton questionId={currentExcuse.id} />
        )}
      </div>

      {/* Recommended boxes & Back to the Box (PRD contract) */}
      <div className="pt-6 border-t border-naija-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/#boxes" className="w-full sm:w-auto">
            <Button variant="secondary" size="default" fullWidth>
              📦 Back to the Box
            </Button>
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider">Try Another Box</h3>
            <Link href="/#boxes" className="text-brand-400 hover:text-brand-300 font-semibold">
              See all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {getRecommendedBoxes(slug, 3).map((box) => (
              <Link key={box.slug} href={`/boxes/${box.slug}`} className="group block focus:outline-none">
                <Card interactive className="h-full p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-brand-400 uppercase font-semibold">
                      {box.kind}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mt-0.5">
                      {box.title}
                    </h4>
                  </div>
                  <p className="text-xs text-naija-muted line-clamp-2 mt-2">
                    {box.tagline}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
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
