import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../modules/authentication/api/public.decorator';
import { PrismaService } from './prisma.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      // docker-compose.prod.yml passes MARINEOPS_TAG through as
      // APP_VERSION, so this reports the image tag the container was
      // actually deployed from — which is the one thing worth knowing
      // here when confirming a rollback landed. It was previously the
      // literal '2.1.0', which matched no released artefact and no
      // declared package version (all four are 0.1.0), so it reported a
      // build that did not exist.
      version: process.env['APP_VERSION'] ?? 'unknown',
    };
  }

  @Get('ready')
  async readiness() {
    let database: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }

    const body = {
      status: database === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: { database },
    };

    if (database !== 'ok') {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }
}
