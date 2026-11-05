'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NaijaBox Runtime Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col items-center justify-center p-4 text-center transition-colors duration-200">
      <Card className="max-w-lg w-full p-8 sm:p-12 space-y-6 border-rose-500/30 bg-naija-surface">
        <div className="text-6xl">⚠️🚨</div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            500 • Something Went Sideways
          </span>
          <h1 className="text-3xl font-black text-naija-text pt-2">
            Wahala Dey!
          </h1>
          <p className="text-sm text-naija-muted leading-relaxed max-w-md mx-auto">
            The server encountered an unexpected glitch. Don&apos;t panic, your session and score progress are safe.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto min-h-[44px]"
          >
            🔄 Try Again (Reset)
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full min-h-[44px]">
              Back to Safety 🏠
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
