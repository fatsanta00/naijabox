import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders PRD hero heading and box grid', async () => {
    const Component = await HomePage();
    render(Component);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/What's inside the box\?/i);
    expect(screen.getByText(/Games, quizzes, weird questions/i)).toBeInTheDocument();
    expect(screen.getByText('Explore NaijaBox')).toBeInTheDocument();
  });
});
