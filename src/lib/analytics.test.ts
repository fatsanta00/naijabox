import { describe, it, expect } from 'vitest';
import { parseReferrer, detectDeviceClass } from './analytics';

describe('Analytics Helpers', () => {
  it('correctly categorizes WhatsApp referrers', () => {
    expect(parseReferrer('https://wa.me/something')).toBe('whatsapp');
    expect(parseReferrer('https://api.whatsapp.com/send')).toBe('whatsapp');
  });

  it('correctly categorizes social media referrers', () => {
    expect(parseReferrer('https://t.co/xyz')).toBe('x');
    expect(parseReferrer('https://twitter.com')).toBe('x');
    expect(parseReferrer('https://www.tiktok.com/@user')).toBe('tiktok');
    expect(parseReferrer('https://l.instagram.com/')).toBe('instagram');
    expect(parseReferrer('https://m.facebook.com/')).toBe('facebook');
    expect(parseReferrer('https://www.google.com/search?q=naijabox')).toBe('google');
  });

  it('detects direct visits when referrer is empty', () => {
    expect(parseReferrer('')).toBe('direct');
  });

  it('detects desktop device class in default jsdom environment', () => {
    expect(detectDeviceClass()).toBe('desktop');
  });
});
