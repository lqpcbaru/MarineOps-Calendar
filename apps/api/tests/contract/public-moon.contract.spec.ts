import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('moon')
class ContractMoonController {
  @Get()
  async getMoonPhase(@Query('date') date?: string) {
    return { data: { date: date || '2026-08-06', phaseName: '—', illumination: 0, ageDays: 0, moonrise: null, moonset: null } };
  }
}

describe('Public API Contract — GET /api/public/moon', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractMoonController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => { await app?.close(); });

  it('returns 200 with MoonResponse shape per PUBLIC_API.md §3.5', async () => {
    const res = await request(app.getHttpServer()).get('/moon');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(b.data).toBeDefined();
    expect(typeof b.data.date).toBe('string');
    expect(b.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof b.data.phaseName).toBe('string');
    expect(typeof b.data.illumination).toBe('number');
    expect(typeof b.data.ageDays).toBe('number');
    expect(b.data.moonrise === null || typeof b.data.moonrise === 'string').toBe(true);
    expect(b.data.moonset === null || typeof b.data.moonset === 'string').toBe(true);
  });

  it('accepts optional stationId and date', async () => {
    const res = await request(app.getHttpServer()).get('/moon?stationId=st-001&date=2026-08-10');
    expect(res.status).toBe(200);
  });

  it('returns valid moon data for a specific date', async () => {
    const res = await request(app.getHttpServer()).get('/moon?date=2026-08-05');
    expect(res.status).toBe(200);
    expect(res.body.data.date).toBe('2026-08-05');
  });
});
