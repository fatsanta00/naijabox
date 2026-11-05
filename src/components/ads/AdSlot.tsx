'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type AdPlacement = 'home_banner' | 'result_bottom' | 'pricecheck_sidebar' | 'between_cards';

export interface AdSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  placement: AdPlacement;
  slotId?: string;
}

/**
 * AdSlot abstraction component (ADR-011, ADR-017).
 * HARD RULES:
 * - Ads are DISABLED by default at launch (process.env.NEXT_PUBLIC_ADS_ENABLED === 'true').
 * - No ad SDK may ever be imported directly in a box.
 * - Ads NEVER appear during gameplay screens (only pre-game, post-result, or tools).
 * - No popups, no takeovers, no interstitials.
 */
export function AdSlot({ placement, slotId = 'default', className, ...props }: AdSlotProps) {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

  if (!adsEnabled) {
    // When ads are disabled, render nothing, keeping zero layout shift and clean gameplay
    return null;
  }

  return (
    <div
      role="complementary"
      aria-label="Sponsored advertisement"
      className={cn(
        'w-full my-4 rounded-xl border border-naija-border/40 bg-naija-card/40 p-4 text-center select-none overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-naija-muted mb-2 font-mono">
        <span>Advertisement</span>
        <span>Sponsored</span>
      </div>

      <div className="min-h-[90px] flex items-center justify-center text-xs text-naija-muted bg-naija-surface/60 rounded-lg border border-dashed border-naija-border/60">
        <span className="text-naija-muted">Ad Slot ({placement}:{slotId})</span>
      </div>
    </div>
  );
}
