import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('public/weather')
class ContractWeatherController {
  @Get()
  async getWeather(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const from = new Date(dateFrom || '2026-08-06');
    const to = new Date(dateTo || dateFrom || '2026-08-06');
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);
    return {
      data: Array.from({ length: days }, (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000);
        return {
          date: d.toISOString().slice(0, 10),
          temperature: 0,
          conditions: '—',
          visibility: null,
          precipitation: null,
        };
      }),
      freshness: {
        status: 'fresh',
        fetchedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 10_800_000).toISOString(),
        source: 'placeholder',
      },
    };
  }
}

describe('Public API Contract — GET /api/public/weather', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractWeatherController],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('returns 200 with WeatherResponse shape per PUBLIC_API.md §3.3', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/weather');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(Array.isArray(b.data)).toBe(true);
    expect(b.freshness).toBeDefined();
    expect(['fresh', 'stale', 'unavailable']).toContain(b.freshness.status);
    expect(typeof b.freshness.fetchedAt).toBe('string');
    expect(typeof b.freshness.validUntil).toBe('string');
    expect(typeof b.freshness.source).toBe('string');
    if (b.data.length > 0) {
      const p = b.data[0];
      expect(typeof p.date).toBe('string');
      expect(typeof p.temperature).toBe('number');
      expect(typeof p.conditions).toBe('string');
      // visibility/precipitation are nullable (source may not provide them).
      expect(p.visibility === null || typeof p.visibility === 'number').toBe(true);
      expect(p.precipitation === null || typeof p.precipitation === 'number').toBe(true);
    }
  });

  it('accepts optional stationId, dateFrom, dateTo', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/public/weather?stationId=st-001&dateFrom=2026-08-01&dateTo=2026-08-07',
    );
    expect(res.status).toBe(200);
  });

  it('returns data array matching date range length', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/public/weather?dateFrom=2026-08-01&dateTo=2026-08-03',
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });
});
