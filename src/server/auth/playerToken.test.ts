import { describe, it, expect } from 'vitest';
import { signPlayerToken, verifyPlayerToken } from './playerToken';

describe('Player JWT Token', () => {
  it('signs and verifies a player token correctly', () => {
    const payload = {
      id: '00000000-0000-0000-0000-000000000123',
      email: 'player@example.com',
      name: 'Naija Player',
      role: 'player',
    };

    const token = signPlayerToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyPlayerToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.name).toBe(payload.name);
    expect(verified?.role).toBe(payload.role);
  });

  it('rejects tampered tokens', () => {
    const token = signPlayerToken({
      id: '123',
      email: 'test@example.com',
      role: 'player',
    });

    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}tampered.${parts[2]}`;
    expect(verifyPlayerToken(tampered)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyPlayerToken('')).toBeNull();
    expect(verifyPlayerToken('invalid.token')).toBeNull();
  });
});
