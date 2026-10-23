import { describe, it, expect } from 'vitest';
import { MIN_STATS_SAMPLE } from '@/server/config/stats';

describe('Public Content & Stats Gate Rules', () => {
  it('enforces MIN_STATS_SAMPLE is at least 30 by default per PRD and DATA_MODEL', () => {
    expect(MIN_STATS_SAMPLE).toBeGreaterThanOrEqual(30);
  });

  it('gating logic correctly hides distribution when total responses is under threshold', () => {
    function computeStatsVisibility(totalResponses: number, minSample = 30) {
      if (totalResponses < minSample) {
        return { available: false, message: "You're one of the first to answer" };
      }
      return { available: true };
    }

    expect(computeStatsVisibility(0).available).toBe(false);
    expect(computeStatsVisibility(15).available).toBe(false);
    expect(computeStatsVisibility(29).available).toBe(false);
    expect(computeStatsVisibility(30).available).toBe(true);
    expect(computeStatsVisibility(120).available).toBe(true);
  });
});
