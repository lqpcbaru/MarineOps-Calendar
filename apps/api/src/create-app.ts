import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { correlationIdMiddleware } from './platform/correlation-id.middleware';
import { createLoginRateLimiter } from './platform/login-rate-limit';
import { resolveTrustedProxyHops } from './platform/trusted-proxy-hops';

/**
 * Builds and configures a NestJS application WITHOUT binding a network
 * socket. Shared by:
 *   - main.ts        (local/dev: calls app.listen() afterwards)
 *   - vercel.ts      (serverless: calls app.init() and serves via Express)
 *
 * Keeping every piece of middleware/config here guarantees the serverless
 * handler behaves identically to the long-running server — CORS, cookies,
 * rate limits, global prefix, and trusted-proxy resolution are all applied
 * in one place.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // How many proxies append to X-Forwarded-For before a request reaches
  // us. Must match the deployment. See platform/trusted-proxy-hops.ts.
  app.set('trust proxy', resolveTrustedProxyHops());

  app.use(correlationIdMiddleware);
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api/v1/auth/login', createLoginRateLimiter());

  // CORS origin is authoritative from APP_URL. In development we allow a
  // localhost fallback; in production APP_URL is required and we fail fast
  // rather than silently trusting a development origin.
  const isProduction = process.env.NODE_ENV === 'production';
  const appUrl = process.env.APP_URL;
  if (isProduction && !appUrl) {
    throw new Error('APP_URL is required in production (CORS origin)');
  }

  app.enableCors({
    origin: appUrl || 'http://localhost:5173',
    credentials: true,
  });

  // Routing:
  //   /api/public/*  → public controllers (anonymous, read-only)
  //   /api/v1/*      → admin controllers (JWT + RBAC)
  //   /health/*      → health endpoints (excluded from the "api" prefix)
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health/{*path}', method: RequestMethod.ALL }],
  });

  return app;
}
