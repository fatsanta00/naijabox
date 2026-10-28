import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SponsorBadge } from './SponsorBadge';
import { analytics } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

describe('SponsorBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no sponsor is provided', () => {
    const { container } = render(<SponsorBadge experienceKey="how-nigerian" sponsor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders labelled "SPONSORED" badge and tracks impression event', () => {
    const sponsor = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'PalmPay',
      label: 'Sponsored by PalmPay',
      url: 'https://palmpay.com',
    };

    render(<SponsorBadge experienceKey="how-nigerian" sponsor={sponsor} />);

    // Assert mandatory PRD sponsored label
    expect(screen.getByText('SPONSORED')).toBeDefined();
    expect(screen.getByText('Sponsored by PalmPay')).toBeDefined();

    // Verify impression tracking fired
    expect(analytics.track).toHaveBeenCalledWith(
      'sponsor_badge_viewed',
      { sponsor_id: sponsor.id, experience: 'how-nigerian' },
      'how-nigerian'
    );
  });

  it('fires sponsor_clicked analytics on outbound click', () => {
    const sponsor = {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Kuda Bank',
      label: 'Presented by Kuda',
      url: 'https://kuda.com',
    };

    render(<SponsorBadge experienceKey="slang-quiz" sponsor={sponsor} />);

    const link = screen.getByRole('link', { name: /visit sponsor: kuda bank/i });
    expect(link).toBeDefined();

    fireEvent.click(link);

    expect(analytics.track).toHaveBeenCalledWith(
      'sponsor_clicked',
      { sponsor_id: sponsor.id, experience: 'slang-quiz' },
      'slang-quiz'
    );
  });
});
