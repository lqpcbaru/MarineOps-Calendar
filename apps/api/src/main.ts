import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { LoggingService } from './platform/logging.service';
import { correlationIdMiddleware } from './platform/correlation-id.middleware';

async function bootstrap() {
  const logger = new LoggingService('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

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
  logger.log(`MarineOps Hub API started on port ${port}`);

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received. Shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received. Shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
