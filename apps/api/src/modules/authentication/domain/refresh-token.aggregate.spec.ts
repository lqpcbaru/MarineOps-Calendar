import { describe, expect, it } from 'vitest';
import { RefreshToken } from './refresh-token.aggregate';

const baseParams = {
  id: 'token-1',
  userId: 'user-1',
  tokenHash: 'hash-1',
  familyId: 'family-1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('RefreshToken aggregate', () => {
  it('creates a non-revoked, non-replaced token', () => {
    const token = RefreshToken.create({
      ...baseParams,
      expiresAt: new Date('2026-01-08T00:00:00Z'),
    });
    expect(token.isRevoked()).toBe(false);
    expect(token.isExpired(new Date('2026-01-05T00:00:00Z'))).toBe(false);
    expect(token.isUsable(new Date('2026-01-05T00:00:00Z'))).toBe(true);
    expect(token.replacedBy).toBeNull();
  });

  it('is expired when now >= expiresAt', () => {
    const token = RefreshToken.create({
      ...baseParams,
      expiresAt: new Date('2026-01-08T00:00:00Z'),
    });
    expect(token.isExpired(new Date('2026-01-08T00:00:00Z'))).toBe(true);
    expect(token.isUsable(new Date('2026-01-08T00:00:00Z'))).toBe(false);
  });

  it('is not usable after revoke', () => {
    const token = RefreshToken.create({
      ...baseParams,
      expiresAt: new Date('2026-01-08T00:00:00Z'),
    });
    const revoked = token.revoke(new Date('2026-01-02T00:00:00Z'));
    expect(revoked.isRevoked()).toBe(true);
    expect(revoked.isUsable(new Date('2026-01-03T00:00:00Z'))).toBe(false);
    // revoke is idempotent
    const reRevoked = revoked.revoke(new Date('2026-01-04T00:00:00Z'));
    expect(reRevoked.revokedAt).toEqual(new Date('2026-01-02T00:00:00Z'));
  });

  it('records the replacement token id without revoking', () => {
    const token = RefreshToken.create({
      ...baseParams,
      expiresAt: new Date('2026-01-08T00:00:00Z'),
    });
    const replaced = token.markReplacedBy('token-2');
    expect(replaced.replacedBy).toBe('token-2');
    expect(replaced.isRevoked()).toBe(false);
  });

  it('round-trips through toState/fromState immutably', () => {
    const token = RefreshToken.create({
      ...baseParams,
      expiresAt: new Date('2026-01-08T00:00:00Z'),
    })
      .revoke(new Date('2026-01-02T00:00:00Z'))
      .markReplacedBy('token-2');
    const state = token.toState();
    const restored = RefreshToken.fromState(state);
    expect(restored.id).toBe(token.id);
    expect(restored.isRevoked()).toBe(true);
    expect(restored.replacedBy).toBe('token-2');
  });
});
