import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, Card, Chip, ProgressBar } from '@/components/ui';

describe('Base UI Components', () => {
  it('Button renders with 44px min tap target height and handles click', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('min-h-[44px]');
  });

  it('Card renders with proper styling and children', () => {
    render(<Card>Card Body</Card>);
    expect(screen.getByText('Card Body')).toBeInTheDocument();
  });

  it('Chip renders text and respects variant styling', () => {
    render(<Chip variant="brand">Naija Tech</Chip>);
    const chip = screen.getByText('Naija Tech');
    expect(chip).toBeInTheDocument();
    expect(chip.className).toContain('text-brand-300');
  });

  it('ProgressBar renders with proper accessibility attributes', () => {
    render(<ProgressBar value={40} max={100} label="Question 4 of 10" showText />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('Question 4 of 10')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
