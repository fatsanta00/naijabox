/**
 * First-party analytics client (ADR-012, ANALYTICS_EVENTS.md).
 * Uses batched sendBeacon to POST /api/public/events.
 * Captures no personal data.
 */

export type DeviceClass = 'mobile' | 'desktop';
export type ReferrerSource =
  | 'whatsapp'
  | 'tiktok'
  | 'instagram'
  | 'x'
  | 'facebook'
  | 'google'
  | 'direct'
  | 'other';

export interface AnalyticsEvent {
  name: string;
  experience?: string;
  question_id?: string;
  props?: Record<string, unknown>;
  path?: string;
  timestamp?: number;
}

const SESSION_COOKIE = 'nb_sid';

function getSessionId(): string {
  if (typeof document === 'undefined') return 'server_session';
  const match = document.cookie.match(new RegExp('(^| )' + SESSION_COOKIE + '=([^;]+)'));
  if (match) return match[2];

  // Fallback to localStorage if cookie not yet set
  let localSid = localStorage.getItem('nb_sid');
  if (!localSid) {
    localSid = 'sid_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('nb_sid', localSid);
  }
  return localSid;
}

export function detectDeviceClass(): DeviceClass {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

export function parseReferrer(referrer: string): ReferrerSource {
  if (!referrer) return 'direct';
  const ref = referrer.toLowerCase();
  if (ref.includes('wa.me') || ref.includes('whatsapp')) return 'whatsapp';
  if (ref.includes('tiktok')) return 'tiktok';
  if (ref.includes('instagram')) return 'instagram';
  if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) return 'x';
  if (ref.includes('facebook') || ref.includes('fb.com')) return 'facebook';
  if (ref.includes('google')) return 'google';
  return 'other';
}

class AnalyticsManager {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly endpoint = '/api/public/events';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flush(true));
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush(true);
      });
    }
  }

  public track(name: string, props: Record<string, unknown> = {}, experience?: string, questionId?: string) {
    if (typeof window === 'undefined') return;

    this.queue.push({
      name,
      experience,
      question_id: questionId,
      props,
      path: window.location.pathname,
      timestamp: Date.now(),
    });

    if (this.queue.length >= 5) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 2000);
    }
  }

  public flush(useBeacon = false) {
    if (this.queue.length === 0) return;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    const payload = JSON.stringify({
      session_id: getSessionId(),
      device_class: detectDeviceClass(),
      referrer_source: parseReferrer(typeof document !== 'undefined' ? document.referrer : ''),
      events: eventsToSend,
    });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(this.endpoint, blob);
    } else if (typeof fetch !== 'undefined') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch((err) => {
        console.warn('Analytics delivery failed:', err);
      });
    }
  }
}

export const analytics = new AnalyticsManager();
