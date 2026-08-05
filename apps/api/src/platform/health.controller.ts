import { Controller, Get } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { Public } from '../modules/authentication/api/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new LoggingService('HealthController');

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  readiness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'pending',
      },
    };
  }
}
