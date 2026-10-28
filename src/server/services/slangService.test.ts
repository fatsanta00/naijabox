import { describe, it, expect } from 'vitest';
import { toSlangSlug } from './slangService';

describe('SlangService Helpers', () => {
  it('correctly generates URL-friendly slugs from Nigerian slang terms', () => {
    expect(toSlangSlug('Omo')).toBe('omo');
    expect(toSlangSlug('Sapa')).toBe('sapa');
    expect(toSlangSlug('No Wahala')).toBe('no-wahala');
    expect(toSlangSlug('God When?!')).toBe('god-when');
    expect(toSlangSlug('  Senior Man  ')).toBe('senior-man');
    expect(toSlangSlug('Vawulence / Dragging')).toBe('vawulence-dragging');
  });
});
