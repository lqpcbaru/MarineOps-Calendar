import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { LoggingService } from './platform/logging.service';
import { correlationIdMiddleware } from './platform/correlation-id.middleware';
import { createLoginRateLimiter } from './platform/login-rate-limit';
import { buildStartupSummary, buildStartupWarnings } from './platform/startup-summary';
import { resolveTrustedProxyHops } from './platform/trusted-proxy-hops';

async function bootstrap() {
  const logger = new LoggingService('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // How many proxies append to X-Forwarded-For before a request reaches
  // us. Must match the deployment: too low and req.ip becomes a proxy's
  // own address, so every client shares one rate-limit bucket; too high
  // and a client can forge req.ip and step around the limiter. Defaults
  // to 1 (the web container alone); the TLS overlay sets 2.
  // See platform/trusted-proxy-hops.ts.
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
    exclude: [{ path: 'health/(.*)', method: RequestMethod.ALL }],
  });
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  // Emit the *derived* configuration, not just the port. Several
  // security-relevant behaviours (Secure cookie flag, CORS origin,
  // whether providers can authenticate at all) are inferred from env
  // rather than set explicitly, and a misconfigured deployment still
  // boots successfully — this makes the effective state greppable in the
  // first lines of the log. Contains no secret values, only booleans.
  const summary = buildStartupSummary();
  logger.log(`MarineOps Hub API started on port ${port}`, { ...summary });
  for (const warning of buildStartupWarnings(summary)) {
    logger.warn(warning);
  }
}

bootstrap();
