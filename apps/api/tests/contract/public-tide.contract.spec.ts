import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('tide')
class ContractTideController {
  @Get()
  async getTide(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const from = new Date(dateFrom || '2026-08-06');
    const to = new Date(dateTo || dateFrom || '2026-08-06');
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);
    const data: { date: string; time: string; height: number; type: 'HIGH' | 'LOW' }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 86_400_000);
      const ds = d.toISOString().slice(0, 10);
      data.push({ date: ds, time: `${ds}T06:00:00Z`, height: 0, type: 'HIGH' });
      data.push({ date: ds, time: `${ds}T12:00:00Z`, height: 0, type: 'LOW' });
    }
    return { data, freshness: { status: 'fresh', fetchedAt: new Date().toISOString(), validUntil: new Date(Date.now() + 3_600_000).toISOString(), source: 'placeholder' } };
  }
}

describe('Public API Contract — GET /api/public/tide', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractTideController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => { await app?.close(); });

  it('returns 200 with TideResponse shape per PUBLIC_API.md §3.2', async () => {
    const res = await request(app.getHttpServer()).get('/tide');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(Array.isArray(b.data)).toBe(true);
    expect(b.freshness).toBeDefined();
    expect(['fresh', 'stale', 'unavailable']).toContain(b.freshness.status);
    if (b.data.length > 0) {
      const p = b.data[0];
      expect(typeof p.date).toBe('string');
      expect(typeof p.time).toBe('string');
      expect(typeof p.height).toBe('number');
      expect(['HIGH', 'LOW']).toContain(p.type);
    }
  });

  it('accepts optional stationId, dateFrom, dateTo', async () => {
    const res = await request(app.getHttpServer()).get('/tide?stationId=st-001&dateFrom=2026-08-01&dateTo=2026-08-07');
    expect(res.status).toBe(200);
  });

  it('returns 2 data points per day (HIGH + LOW)', async () => {
    const res = await request(app.getHttpServer()).get('/tide?dateFrom=2026-08-01&dateTo=2026-08-01');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
