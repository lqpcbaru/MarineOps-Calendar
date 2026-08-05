import { describe, expect, it } from 'vitest';
import { AuthorizeUseCase } from './authorize.use-case';
import { ForbiddenError } from '../domain';
import type { AuthPrincipal } from '../domain';

const principal = (perms: string[]): AuthPrincipal => ({
  userId: 'u1',
  email: 'a@b.c',
  name: 'N',
  roles: ['Operations Planner'],
  permissionCodes: perms,
});

describe('AuthorizeUseCase', () => {
  const auth = new AuthorizeUseCase();

  it('allows when all required permissions are held', () => {
    expect(() => auth.requireAll(principal(['a', 'b']), ['a'])).not.toThrow();
    expect(() => auth.requireAll(principal(['a', 'b']), ['a', 'b'])).not.toThrow();
  });

  it('denies when a required permission is missing', () => {
    expect(() => auth.requireAll(principal(['a']), ['a', 'b'])).toThrow(ForbiddenError);
  });

  it('denies when principal is null', () => {
    expect(() => auth.requireAll(null, ['a'])).toThrow(ForbiddenError);
  });

  it('requireAny allows when at least one permission is held', () => {
    expect(() => auth.requireAny(principal(['a', 'b']), ['b', 'c'])).not.toThrow();
  });

  it('requireAny denies when none are held', () => {
    expect(() => auth.requireAny(principal(['a']), ['b', 'c'])).toThrow(ForbiddenError);
  });

  it('requireAny with empty list always allows', () => {
    expect(() => auth.requireAny(null, [])).not.toThrow();
  });
});
