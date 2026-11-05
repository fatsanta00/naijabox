'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics';

/**
 * Lightweight, privacy-respecting client page view tracker (ADR-012).
 * Tracks public page views using the anonymous, persistent `nb_sid` cookie.
 * Does not track `/admin` or `/api` routes to prevent polluting production analytics.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Do not track admin portal or internal API calls
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // Prevent duplicate tracks for the exact same path in React 19 strict mode
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;
    analytics.track('page_view', {
      path: pathname,
      title: typeof document !== 'undefined' ? document.title : '',
    });
  }, [pathname]);

  return null;
}
