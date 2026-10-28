'use client';

import React, { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

export interface SponsorInfo {
  id: string;
  name: string;
  url?: string | null;
  logoUrl?: string | null;
  label?: string | null;
}

interface SponsorBadgeProps {
  experienceKey: string;
  sponsor?: SponsorInfo | null;
  className?: string;
}

export function SponsorBadge({ experienceKey, sponsor, className = '' }: SponsorBadgeProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (sponsor && !trackedRef.current) {
      trackedRef.current = true;
      // Emit impression analytics (ANALYTICS_EVENTS.md compliance)
      analytics.track(
        'sponsor_badge_viewed',
        { sponsor_id: sponsor.id, experience: experienceKey },
        experienceKey
      );
    }
  }, [sponsor, experienceKey]);

  if (!sponsor) return null;

  const displayLabel = sponsor.label || `Sponsored by ${sponsor.name}`;

  const handleClick = () => {
    analytics.track(
      'sponsor_clicked',
      { sponsor_id: sponsor.id, experience: experienceKey },
      experienceKey
    );
  };

  const badgeContent = (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors ${className}`}
      data-testid="sponsor-badge"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
        SPONSORED
      </span>
      <span className="font-semibold text-gray-200">{displayLabel}</span>
      {sponsor.url && <span className="text-[11px] text-amber-400 font-bold">&rarr;</span>}
    </div>
  );

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-block min-h-[44px] min-w-[44px] inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-full"
        aria-label={`Visit sponsor: ${sponsor.name}`}
      >
        {badgeContent}
      </a>
    );
  }

  return <div className="inline-block">{badgeContent}</div>;
}
