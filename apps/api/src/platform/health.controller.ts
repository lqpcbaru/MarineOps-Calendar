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
      version: '2.1.0',
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
