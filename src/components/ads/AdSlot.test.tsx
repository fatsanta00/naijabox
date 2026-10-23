import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdSlot } from './AdSlot';

describe('AdSlot Abstraction', () => {
  it('renders nothing when NEXT_PUBLIC_ADS_ENABLED is not set or false', () => {
    const { container } = render(<AdSlot placement="home_banner" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with accessibility attributes when enabled', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    render(<AdSlot placement="result_bottom" slotId="test_1" />);
    const ad = screen.getByRole('complementary', { name: /sponsored advertisement/i });
    expect(ad).toBeInTheDocument();
    expect(screen.getByText(/Sponsored/i)).toBeInTheDocument();
    delete process.env.NEXT_PUBLIC_ADS_ENABLED;
  });
});
