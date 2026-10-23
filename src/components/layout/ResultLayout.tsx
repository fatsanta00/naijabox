'use client';

import React from 'react';
import Link from 'next/link';
import { getRecommendedBoxes } from '@/boxes/registry';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { ShareBar } from '@/components/sharing/ShareBar';

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
}: ResultLayoutProps) {
  const recommended = getRecommendedBoxes(currentSlug, 3);
  const currentUrl =
    shareUrl || (typeof window !== 'undefined' ? window.location.href : `https://naijabox.app/boxes/${currentSlug}`);
  const shareMsg = shareText || `I just got "${resultLabel}" on NaijaBox's ${title}! Try it yourself:`;

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Result Display */}
      <Card className="text-center p-6 sm:p-8 space-y-4 border-brand-500/40 bg-naija-surface/90 shadow-2xl">
        <span className="inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30">
          Your Result
        </span>
        {resultScore !== undefined && (
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {resultScore}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-white">{resultLabel}</h2>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-md mx-auto">
          {resultDescription}
        </p>

        {customResultSlot && <div className="pt-2">{customResultSlot}</div>}
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
          <h3 className="text-sm font-bold text-white tracking-tight">Try another box</h3>
          <Link href="/#boxes" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
            See all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommended.map((box) => (
            <Link key={box.slug} href={`/boxes/${box.slug}`} className="group block focus:outline-none">
              <Card interactive className="h-full p-4 flex flex-col justify-between">
                <CardHeader className="p-0 pb-1.5">
                  <span className="text-[10px] text-brand-400 uppercase font-semibold">
                    {box.kind}
                  </span>
                  <CardTitle className="text-sm group-hover:text-brand-300 transition-colors line-clamp-1">
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
