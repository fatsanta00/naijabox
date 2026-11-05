'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecommendedBoxes } from '@/boxes/registry';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { ShareBar } from '@/components/sharing/ShareBar';
import { SponsorBadge, SponsorInfo } from '@/components/ads/SponsorBadge';

export interface ResultLayoutProps {
  currentSlug: string;
  title: string;
  resultScore?: string | number;
  resultLabel: string;
  resultDescription: string;
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
  resultId?: string;
  onTryAgain?: () => void;
  customResultSlot?: React.ReactNode;
  sponsor?: SponsorInfo | null;
}

export function ResultLayout({
  currentSlug,
  title,
  resultScore,
  resultLabel,
  resultDescription,
  shareTitle,
  shareText,
  shareUrl,
  resultId,
  onTryAgain,
  customResultSlot,
  sponsor: initialSponsor,
}: ResultLayoutProps) {
  const [activeSponsor, setActiveSponsor] = useState<SponsorInfo | null | undefined>(initialSponsor);

  useEffect(() => {
    if (initialSponsor !== undefined) return;
    let mounted = true;
    fetch(`/api/public/sponsorships?experience=${currentSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && data.data) {
          setActiveSponsor({
            id: data.data.sponsorId,
            name: data.data.sponsorName,
            url: data.data.sponsorUrl,
            logoUrl: data.data.sponsorLogoUrl,
            label: data.data.label,
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [currentSlug, initialSponsor]);

  const recommended = getRecommendedBoxes(currentSlug, 3);
  const currentUrl =
    shareUrl || (typeof window !== 'undefined' ? window.location.href : `https://naijabox.app/boxes/${currentSlug}`);
  const shareMsg = shareText || `I just got "${resultLabel}" on NaijaBox's ${title}! Try it yourself:`;

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Result Display */}
      <Card className="text-center p-6 sm:p-8 space-y-4 border-brand-500/40 bg-naija-surface shadow-2xl">
        <span className="inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/30">
          Your Result
        </span>
        {resultScore !== undefined && (
          <div className="text-4xl sm:text-5xl font-black text-naija-text tracking-tight">
            {resultScore}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-naija-text">{resultLabel}</h2>
        <p className="text-sm sm:text-base text-naija-muted leading-relaxed max-w-md mx-auto">
          {resultDescription}
        </p>

        {customResultSlot && <div className="pt-2">{customResultSlot}</div>}

        {activeSponsor && (
          <div className="pt-2 border-t border-naija-border/40">
            <SponsorBadge experienceKey={currentSlug} sponsor={activeSponsor} />
          </div>
        )}
      </Card>

      {/* 2. Share Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted text-center">
          Share your result with friends
        </h3>
        <ShareBar
          title={shareTitle || title}
          text={shareMsg}
          url={currentUrl}
          experienceKey={currentSlug}
          resultId={resultId}
        />
      </div>

      {/* 3. Try Again / Back controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onTryAgain && (
          <Button onClick={onTryAgain} variant="primary" size="default" fullWidth className="sm:w-auto">
            🔄 Try Again
          </Button>
        )}
        <Link href="/#boxes" className="w-full sm:w-auto">
          <Button variant="secondary" size="default" fullWidth>
            📦 Back to the Box
          </Button>
        </Link>
      </div>

      {/* 4. Recommended Boxes Section (No dead ends per PRD) */}
      <div className="space-y-4 pt-6 border-t border-naija-border/60">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-naija-text tracking-tight">Try another box</h3>
          <Link href="/#boxes" className="text-xs text-brand-600 dark:text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            See all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommended.map((box) => (
            <Link key={box.slug} href={`/boxes/${box.slug}`} className="group block focus:outline-none">
              <Card interactive className="h-full p-4 flex flex-col justify-between">
                <CardHeader className="p-0 pb-1.5">
                  <span className="text-[10px] text-brand-600 dark:text-brand-600 dark:text-brand-400 uppercase font-semibold">
                    {box.kind}
                  </span>
                  <CardTitle className="text-sm group-hover:text-brand-600 dark:group-hover:text-brand-600 dark:text-brand-300 transition-colors line-clamp-1">
                    {box.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-xs line-clamp-2">
                    {box.tagline}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
