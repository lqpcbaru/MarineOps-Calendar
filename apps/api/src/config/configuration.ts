/**
 * NOTE ON THIS MODULE'S REAL ROLE — do not delete it as "unused".
 *
 * Nothing injects the `'CONFIG'` provider that ConfigModule exposes
 * (verified by grep). Its actual production value is the side effect of
 * being constructed: NestJS instantiates the provider eagerly at
 * bootstrap, so `required()` below runs and the process fails to start
 * when DATABASE_URL / JWT_ACCESS_SECRET / JWT_REFRESH_SECRET are absent.
 * That fail-fast is the only thing standing between a missing secret and
 * a container that boots and then 500s on first use.
 *
 * Consequently this interface must only declare values that are genuinely
 * read from the environment. A previous `security: { rateLimitTtl,
 * rateLimitMax, bodyLimit }` block was removed because it was hardcoded,
 * never read by anything, and actively misleading: `bodyLimit: '1mb'`
 * implied a request-size cap that nothing applied (the effective limit is
 * whatever Nest's body parser defaults to). Rate limits are read directly
 * from the environment in main.ts and login-rate-limit.ts.
 */
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  appName: string;
  appUrl: string;
  database: { url: string };
  redis: { url: string; enabled: boolean };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlMinutes: number;
    refreshTtlDays: number;
  };
  logging: { level: string; format: string };
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable ${key} is required`);
  return value;
}

export default (): AppConfig => {
  const nodeEnv = (process.env['NODE_ENV'] || 'development') as AppConfig['nodeEnv'];

  return {
    nodeEnv,
    port: parseInt(process.env['PORT'] || '3000', 10),
    appName: process.env['APP_NAME'] || 'MarineOps',
    appUrl: process.env['APP_URL'] || 'http://localhost:3000',
    database: {
      url: nodeEnv === 'test' ? process.env['DATABASE_URL'] || '' : required('DATABASE_URL'),
    },
    redis: {
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      enabled: process.env['REDIS_ENABLED'] === 'true',
    },
    jwt: {
      accessSecret:
        nodeEnv === 'test'
          ? process.env['JWT_ACCESS_SECRET'] || 'test-secret'
          : required('JWT_ACCESS_SECRET'),
      refreshSecret:
        nodeEnv === 'test'
          ? process.env['JWT_REFRESH_SECRET'] || 'test-refresh-secret'
          : required('JWT_REFRESH_SECRET'),
      accessTtlMinutes: parseInt(process.env['JWT_ACCESS_TTL_MINUTES'] || '15', 10),
      refreshTtlDays: parseInt(process.env['JWT_REFRESH_TTL_DAYS'] || '7', 10),
    },
    logging: {
      level: process.env['LOG_LEVEL'] || 'info',
      format: process.env['LOG_FORMAT'] || 'json',
    },
  };
};
