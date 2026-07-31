export interface AppConfig {
  nodeEnv: string;
  port: number;
  appName: string;
  appUrl: string;
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlMinutes: number;
    refreshTtlDays: number;
  };
  logging: {
    level: string;
    format: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3000', 10),
  appName: process.env['APP_NAME'] || 'MarineOps',
  appUrl: process.env['APP_URL'] || 'http://localhost:3000',
  database: {
    url:
      process.env['DATABASE_URL'] ||
      'postgresql://marineops:changeme@localhost:5432/marineops_dev',
  },
  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] || 'change-me',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'change-me',
    accessTtlMinutes: parseInt(process.env['JWT_ACCESS_TTL_MINUTES'] || '15', 10),
    refreshTtlDays: parseInt(process.env['JWT_REFRESH_TTL_DAYS'] || '7', 10),
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'debug',
    format: process.env['LOG_FORMAT'] || 'json',
  },
});
