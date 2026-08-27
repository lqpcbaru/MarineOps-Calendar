import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import configuration from './configuration';

const ENV_KEYS = ['NODE_ENV', 'DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

describe('configuration', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('does not fall back to JWT_ACCESS_SECRET when JWT_REFRESH_SECRET is missing outside test env', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['DATABASE_URL'] = 'postgresql://x';
    process.env['JWT_ACCESS_SECRET'] = 'the-access-secret';
    delete process.env['JWT_REFRESH_SECRET'];

    expect(() => configuration()).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('uses independent access and refresh secrets when both are set', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['DATABASE_URL'] = 'postgresql://x';
    process.env['JWT_ACCESS_SECRET'] = 'the-access-secret';
    process.env['JWT_REFRESH_SECRET'] = 'the-refresh-secret';

    const config = configuration();

    expect(config.jwt.accessSecret).toBe('the-access-secret');
    expect(config.jwt.refreshSecret).toBe('the-refresh-secret');
    expect(config.jwt.refreshSecret).not.toBe(config.jwt.accessSecret);
  });

  it('falls back to a fixed test secret in the test environment when unset', () => {
    process.env['NODE_ENV'] = 'test';
    delete process.env['JWT_ACCESS_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];

    const config = configuration();

    expect(config.jwt.accessSecret).toBe('test-secret');
    expect(config.jwt.refreshSecret).toBe('test-refresh-secret');
  });
});
