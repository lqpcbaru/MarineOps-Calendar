import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { LoggingService } from './logging.service';

/**
 * Logs which signal triggered shutdown. NestJS's own enableShutdownHooks()
 * (main.ts) already runs the full lifecycle (onModuleDestroy, etc.) and
 * exits correctly for SIGTERM/SIGINT/etc — this only adds the observability
 * that a bespoke `process.on('SIGTERM', ...)` handler used to provide,
 * without re-registering a second, racing signal handler alongside it.
 */
@Injectable()
export class ShutdownLoggerService implements OnApplicationShutdown {
  private readonly logger = new LoggingService('Shutdown');

  onApplicationShutdown(signal?: string): void {
    this.logger.log(`${signal || 'shutdown'} received. Shutting down gracefully...`);
  }
}
