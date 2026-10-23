'use client';

import React, { useState } from 'react';
import { analytics } from '@/lib/analytics';

export interface ShareBarProps {
  title: string;
  text: string;
  url: string;
  experienceKey?: string;
  resultId?: string;
}

export function ShareBar({ title, text, url, experienceKey, resultId }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${url}`);

  const handleShareClick = (channel: string) => {
    analytics.track(
      'share_clicked',
      {
        channel,
        share_type: 'result',
        result_id: resultId,
      },
      experienceKey
    );
  };

  const copyToClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      handleShareClick('copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        handleShareClick('native');
      } catch {
        // User cancelled share
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick('whatsapp')}
          className="h-11 min-h-[44px] px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick('x')}
          className="h-11 min-h-[44px] px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <span>𝕏</span>
          <span>Share</span>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick('facebook')}
          className="h-11 min-h-[44px] px-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <span>f</span>
          <span>Facebook</span>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={copyToClipboard}
          className="h-11 min-h-[44px] px-3 rounded-xl bg-naija-card hover:bg-naija-border text-gray-200 border border-naija-border font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <span>🔗</span>
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>

      {/* Native Web Share fallback */}
      <button
        type="button"
        onClick={nativeShare}
        className="w-full h-11 min-h-[44px] text-xs text-naija-muted hover:text-white transition-colors text-center inline-flex items-center justify-center gap-1"
      >
        <span>📱</span> More sharing options...
      </button>
    </div>
  );
}
