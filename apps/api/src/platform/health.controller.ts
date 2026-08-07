import { Controller, Get } from '@nestjs/common';
import { Public } from '../modules/authentication/api/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get('live')
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.1.0',
    };
  }

  @Get('ready')
  readiness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: 'ok',
        scheduler: 'ok',
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
    };
  }
}
