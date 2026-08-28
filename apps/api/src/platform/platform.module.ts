import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ShutdownLoggerService } from './shutdown-logger.service';

@Global()
@Module({
  providers: [LoggingService, ShutdownLoggerService],
  exports: [LoggingService],
})
export class PlatformModule {}
