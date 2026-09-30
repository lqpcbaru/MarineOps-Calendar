import { createApp } from './create-app';
import { LoggingService } from './platform/logging.service';
import { buildStartupSummary, buildStartupWarnings } from './platform/startup-summary';

async function bootstrap() {
  const logger = new LoggingService('Bootstrap');
  const app = await createApp();

  // Graceful shutdown hooks are only meaningful for a long-running process.
  // The serverless entry (vercel.ts) initialises the app via app.init()
  // instead and must NOT register process signal handlers.
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
