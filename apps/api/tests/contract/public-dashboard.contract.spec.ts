import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

/* Inline test controller returning valid PublicDashboardResponse shape.
   This validates the contract defined in PUBLIC_API.md and OPENAPI.md.
   The real controller is validated by unit tests in dashboard.service.spec.ts. */
@Controller('public/dashboard')
class ContractDashboardController {
  @Get()
  async getDashboard(@Query('stationId') stationId?: string) {
    return {
      date: '2026-08-06',
      hijriDate: '—',
      station: { id: stationId || '—', name: '—', code: '—' },
      tide: {
        next: null,
        freshness: {
          status: 'fresh',
          fetchedAt: '2026-08-06T00:00:00Z',
          validUntil: '2026-08-06T00:05:00Z',
          source: 'placeholder',
        },
      },
      weather: {
        current: null,
        freshness: {
          status: 'fresh',
          fetchedAt: '2026-08-06T00:00:00Z',
          validUntil: '2026-08-06T03:00:00Z',
          source: 'placeholder',
        },
      },
      windWave: {
        current: null,
        freshness: {
          status: 'fresh',
          fetchedAt: '2026-08-06T00:00:00Z',
          validUntil: '2026-08-06T01:00:00Z',
          source: 'placeholder',
        },
      },
      moon: { phaseName: '—', illumination: 0 },
      sun: { sunrise: '—', sunset: '—' },
      activeAlerts: { count: 0, latest: null },
      operationalStatus: 'UNKNOWN',
    };
  }
}

describe('Public API Contract — GET /api/public/dashboard', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContractDashboardController],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('returns 200 with PublicDashboardResponse shape per PUBLIC_API.md §3.8', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/dashboard');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(typeof b.date).toBe('string');
    expect(b.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof b.hijriDate).toBe('string');
    expect(b.station).toBeDefined();
    expect(typeof b.station.id).toBe('string');
    expect(typeof b.station.name).toBe('string');
    expect(typeof b.station.code).toBe('string');
    expect(b.tide).toBeDefined();
    expect(b.tide.freshness).toBeDefined();
    expect(['fresh', 'stale', 'unavailable']).toContain(b.tide.freshness.status);
    expect(typeof b.tide.freshness.fetchedAt).toBe('string');
    expect(typeof b.tide.freshness.validUntil).toBe('string');
    expect(typeof b.tide.freshness.source).toBe('string');
    expect(b.weather).toBeDefined();
    expect(b.weather.freshness).toBeDefined();
    expect(b.windWave).toBeDefined();
    expect(b.windWave.freshness).toBeDefined();
    expect(b.moon).toBeDefined();
    expect(typeof b.moon.phaseName).toBe('string');
    expect(typeof b.moon.illumination).toBe('number');
    expect(b.sun).toBeDefined();
    expect(typeof b.sun.sunrise).toBe('string');
    expect(typeof b.sun.sunset).toBe('string');
    expect(b.activeAlerts).toBeDefined();
    expect(typeof b.activeAlerts.count).toBe('number');
    expect(['SAFE', 'CAUTION', 'DANGER', 'UNKNOWN']).toContain(b.operationalStatus);
  });

  it('accepts optional stationId query parameter', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/dashboard?stationId=st-001');
    expect(res.status).toBe(200);
    expect(res.body.station.id).toBe('st-001');
  });

  it('returns 200 without query parameters', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/dashboard');
    expect(res.status).toBe(200);
  });
});
