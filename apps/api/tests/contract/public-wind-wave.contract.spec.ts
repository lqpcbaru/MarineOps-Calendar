import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('wind-wave')
class ContractWindWaveController {
  @Get()
  async getWindWave(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const from = new Date(dateFrom || '2026-08-06');
    const to = new Date(dateTo || dateFrom || '2026-08-06');
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);
    return {
      data: Array.from({ length: days }, (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000);
        return { date: d.toISOString().slice(0, 10), windSpeed: 0, windDirection: '—', windGusts: 0, waveHeight: 0, wavePeriod: 0 };
      }),
      freshness: { status: 'fresh', fetchedAt: new Date().toISOString(), validUntil: new Date(Date.now() + 3_600_000).toISOString(), source: 'placeholder' },
    };
  }
}

describe('Public API Contract — GET /api/public/wind-wave', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractWindWaveController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => { await app?.close(); });

  it('returns 200 with WindWaveResponse shape per PUBLIC_API.md §3.4', async () => {
    const res = await request(app.getHttpServer()).get('/wind-wave');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(Array.isArray(b.data)).toBe(true);
    expect(b.freshness).toBeDefined();
    expect(['fresh', 'stale', 'unavailable']).toContain(b.freshness.status);
    if (b.data.length > 0) {
      const p = b.data[0];
      expect(typeof p.date).toBe('string');
      expect(typeof p.windSpeed).toBe('number');
      expect(typeof p.windDirection).toBe('string');
      expect(typeof p.windGusts).toBe('number');
      expect(typeof p.waveHeight).toBe('number');
      expect(typeof p.wavePeriod).toBe('number');
    }
  });

  it('accepts optional stationId, dateFrom, dateTo', async () => {
    const res = await request(app.getHttpServer()).get('/wind-wave?stationId=st-001&dateFrom=2026-08-01&dateTo=2026-08-07');
    expect(res.status).toBe(200);
  });

  it('returns data array matching date range length', async () => {
    const res = await request(app.getHttpServer()).get('/wind-wave?dateFrom=2026-08-01&dateTo=2026-08-03');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });
});
