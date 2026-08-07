export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  appName: string;
  appUrl: string;
  database: { url: string };
  redis: { url: string; enabled: boolean };
  jwt: { accessSecret: string; refreshSecret: string; accessTtlMinutes: number; refreshTtlDays: number };
  logging: { level: string; format: string };
  security: { rateLimitTtl: number; rateLimitMax: number; bodyLimit: string };
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
    database: { url: nodeEnv === 'test' ? (process.env['DATABASE_URL'] || '') : required('DATABASE_URL') },
    redis: { url: process.env['REDIS_URL'] || 'redis://localhost:6379', enabled: process.env['REDIS_ENABLED'] === 'true' },
    jwt: {
      accessSecret: nodeEnv === 'test' ? (process.env['JWT_ACCESS_SECRET'] || 'test-secret') : required('JWT_ACCESS_SECRET'),
      refreshSecret: process.env['JWT_REFRESH_SECRET'] || required('JWT_ACCESS_SECRET'),
      accessTtlMinutes: parseInt(process.env['JWT_ACCESS_TTL_MINUTES'] || '15', 10),
      refreshTtlDays: parseInt(process.env['JWT_REFRESH_TTL_DAYS'] || '7', 10),
    },
    logging: { level: process.env['LOG_LEVEL'] || 'info', format: process.env['LOG_FORMAT'] || 'json' },
    security: { rateLimitTtl: 60, rateLimitMax: 100, bodyLimit: '1mb' },
  };
};
