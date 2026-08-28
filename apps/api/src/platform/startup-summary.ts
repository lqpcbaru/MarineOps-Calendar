/**
 * Effective-configuration summary emitted once at boot.
 *
 * Motivation: several security-relevant behaviours are derived from
 * NODE_ENV rather than configured explicitly, and NODE_ENV itself defaults
 * to "development" when unset (configuration.ts). A deployment that forgets
 * to set it still starts, but silently issues the refresh cookie without
 * the Secure flag and falls back to a localhost CORS origin. Printing the
 * *derived* values at startup makes that visible in the first log line
 * instead of during an incident.
 *
 * Secret values are NEVER logged — only whether each one is configured.
 */
export interface StartupSummary {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  /** Derived from NODE_ENV — false means the refresh cookie has no Secure flag. */
  secureCookies: boolean;
  cacheBackend: 'redis' | 'in-memory';
  rateLimitMax: number;
  loginRateLimitMax: number;
  /** Booleans only — never the credential itself. */
  providerCredentials: Record<string, boolean>;
}

export function buildStartupSummary(env: NodeJS.ProcessEnv = process.env): StartupSummary {
  const nodeEnv = env['NODE_ENV'] || 'development';
  const isLocal = nodeEnv === 'development' || nodeEnv === 'test';

  return {
    nodeEnv,
    port: parseInt(env['PORT'] || '3000', 10),
    corsOrigin: env['APP_URL'] || 'http://localhost:5173',
    secureCookies: !isLocal,
    cacheBackend: env['REDIS_ENABLED'] === 'true' ? 'redis' : 'in-memory',
    rateLimitMax: parseInt(env['RATE_LIMIT_MAX'] || '100', 10),
    loginRateLimitMax: parseInt(env['LOGIN_RATE_LIMIT_MAX'] || '10', 10),
    providerCredentials: {
      METMALAYSIA_API_KEY: Boolean(env['METMALAYSIA_API_KEY']),
      JUPEM_API_KEY: Boolean(env['JUPEM_API_KEY']),
      GFW_API_TOKEN: Boolean(env['GFW_API_TOKEN']),
    },
  };
}

/**
 * Warnings for configurations that start successfully but behave in a way
 * an operator probably did not intend in a deployed environment.
 */
export function buildStartupWarnings(summary: StartupSummary): string[] {
  const warnings: string[] = [];

  if (summary.nodeEnv !== 'development' && summary.nodeEnv !== 'test') {
    if (!summary.secureCookies) {
      warnings.push(
        `NODE_ENV=${summary.nodeEnv} but the refresh cookie is being issued without the Secure flag.`,
      );
    }
    const missing = Object.entries(summary.providerCredentials)
      .filter(([, configured]) => !configured)
      .map(([name]) => name);
    if (missing.length > 0) {
      warnings.push(
        `No credential configured for: ${missing.join(', ')}. The dependent public endpoints will return provider errors until these are set.`,
      );
    }
  }

  if (summary.nodeEnv === 'development') {
    warnings.push(
      'NODE_ENV is "development" (either set explicitly or defaulted because it was unset). ' +
        'Refresh cookies are NOT marked Secure and APP_URL is not enforced. Never run a deployed environment this way.',
    );
  }

  return warnings;
}
