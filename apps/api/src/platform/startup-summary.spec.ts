import { describe, expect, it } from 'vitest';
import { buildStartupSummary, buildStartupWarnings } from './startup-summary';

const PROD_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  APP_URL: 'https://app.example.com',
  REDIS_ENABLED: 'true',
  RATE_LIMIT_MAX: '250',
  LOGIN_RATE_LIMIT_MAX: '5',
  METMALAYSIA_API_KEY: 'super-secret-met-key',
  JUPEM_API_KEY: 'super-secret-jupem-key',
  GFW_API_TOKEN: 'super-secret-gfw-token',
};

describe('buildStartupSummary', () => {
  it('reports the effective configuration', () => {
    const s = buildStartupSummary(PROD_ENV);
    expect(s).toMatchObject({
      nodeEnv: 'production',
      port: 8080,
      corsOrigin: 'https://app.example.com',
      secureCookies: true,
      cacheBackend: 'redis',
      rateLimitMax: 250,
      loginRateLimitMax: 5,
    });
  });

  it('never includes a secret VALUE — only whether each is configured', () => {
    const s = buildStartupSummary(PROD_ENV);

    expect(s.providerCredentials).toEqual({
      METMALAYSIA_API_KEY: true,
      JUPEM_API_KEY: true,
      GFW_API_TOKEN: true,
    });

    // The summary is logged verbatim, so assert against its full
    // serialization: no credential value may appear anywhere in it.
    const serialized = JSON.stringify(s);
    expect(serialized).not.toContain('super-secret-met-key');
    expect(serialized).not.toContain('super-secret-jupem-key');
    expect(serialized).not.toContain('super-secret-gfw-token');
  });

  it('does not leak DATABASE_URL or JWT secrets even though they are set', () => {
    const s = buildStartupSummary({
      ...PROD_ENV,
      DATABASE_URL: 'postgresql://user:hunter2@db.internal:5432/marineops',
      JWT_ACCESS_SECRET: 'jwt-access-secret-value',
      JWT_REFRESH_SECRET: 'jwt-refresh-secret-value',
    });
    const serialized = JSON.stringify(s);
    expect(serialized).not.toContain('hunter2');
    expect(serialized).not.toContain('jwt-access-secret-value');
    expect(serialized).not.toContain('jwt-refresh-secret-value');
  });

  it('defaults NODE_ENV to development when unset, and reports insecure cookies', () => {
    const s = buildStartupSummary({});
    expect(s.nodeEnv).toBe('development');
    expect(s.secureCookies).toBe(false);
    expect(s.corsOrigin).toBe('http://localhost:5173');
    expect(s.cacheBackend).toBe('in-memory');
  });
});

describe('buildStartupWarnings', () => {
  it('is silent for a fully configured production environment', () => {
    expect(buildStartupWarnings(buildStartupSummary(PROD_ENV))).toEqual([]);
  });

  it('warns loudly when NODE_ENV is unset (the silent-insecure-deploy case)', () => {
    const warnings = buildStartupWarnings(buildStartupSummary({}));
    expect(warnings.join(' ')).toMatch(/development/);
    expect(warnings.join(' ')).toMatch(/Secure/);
  });

  it('names exactly the provider credentials that are missing in production', () => {
    const warnings = buildStartupWarnings(
      buildStartupSummary({ ...PROD_ENV, JUPEM_API_KEY: '', GFW_API_TOKEN: '' }),
    );
    const joined = warnings.join(' ');
    expect(joined).toContain('JUPEM_API_KEY');
    expect(joined).toContain('GFW_API_TOKEN');
    expect(joined).not.toContain('METMALAYSIA_API_KEY');
  });
});
