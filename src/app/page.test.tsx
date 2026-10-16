import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders brand heading and tagline', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NaijaBox');
    expect(screen.getByText(/A box full of things to do/i)).toBeInTheDocument();
  });
});
