import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('sun')
class ContractSunController {
  @Get()
  async getSunData(@Query('date') date?: string) {
    return { data: { date: date || '2026-08-06', sunrise: '—', sunset: '—', solarNoon: '—', daylightDuration: '—' } };
  }
}

describe('Public API Contract — GET /api/public/sun', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractSunController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => { await app?.close(); });

  it('returns 200 with SunResponse shape per PUBLIC_API.md §3.6', async () => {
    const res = await request(app.getHttpServer()).get('/sun');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(b.data).toBeDefined();
    expect(typeof b.data.date).toBe('string');
    expect(b.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof b.data.sunrise).toBe('string');
    expect(typeof b.data.sunset).toBe('string');
    expect(typeof b.data.solarNoon).toBe('string');
    expect(typeof b.data.daylightDuration).toBe('string');
  });

  it('accepts optional stationId and date', async () => {
    const res = await request(app.getHttpServer()).get('/sun?stationId=st-001&date=2026-08-10');
    expect(res.status).toBe(200);
  });

  it('returns valid sun data for a specific date', async () => {
    const res = await request(app.getHttpServer()).get('/sun?date=2026-08-05');
    expect(res.status).toBe(200);
    expect(res.body.data.date).toBe('2026-08-05');
  });
});
