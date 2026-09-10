import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { OperationalCalendarModule } from '../../src/modules/operational-calendar/api/operational-calendar.module';
import { PublicCalendarController } from '../../src/api/public/public-calendar.controller';
import { RecommendationModule } from '../../src/modules/recommendation/api/recommendation.module';
import { PublicRecommendationController } from '../../src/api/public/public-recommendation.controller';

import { WeatherService } from '../../src/modules/weather/application/weather.service';
import { TideService } from '../../src/modules/tide/application/tide.service';
import { WindWaveService } from '../../src/modules/wind-wave/application/wind-wave.service';
import { MoonService } from '../../src/modules/moon/application/moon.service';
import { SunService } from '../../src/modules/sun/application/sun.service';

import {
  StationsModule,
  STATIONS_QUERY_PORT,
  PROVIDER_MAPPING_PORT,
} from '../../src/modules/stations/api/stations.module';
import {
  STATION_REPOSITORY,
  REGION_REPOSITORY,
} from '../../src/modules/stations/application/di-tokens';

import { AUDIT_REPOSITORY } from '../../src/modules/audit/application/di-tokens';
import { InMemoryAuditRepository } from '../../src/modules/audit/application/test-doubles';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

const freshness = {
  status: 'fresh' as const,
  fetchedAt: '2026-08-27T00:00:00Z',
  validUntil: '2026-08-27T06:00:00Z',
  source: 'test',
};

/**
 * Real e2e coverage of PublicCalendarController and PublicRecommendationController
 * — both had zero test coverage. RecommendationService wraps
 * OperationalCalendarService directly (not through DI override), so
 * testing both together against one fake-data setup exercises the real
 * aggregation (Promise.allSettled over 5 sourced/computed modules), the
 * real scoring engine, and the real rule set — only the outermost
 * WeatherService/TideService/WindWaveService/MoonService/SunService are
 * faked, everything downstream of them (including OperationalCalendarService
 * and RecommendationService themselves) runs for real.
 */
describe('PublicCalendarController + PublicRecommendationController (e2e, faked data services)', () => {
  let app: INestApplication;

  const fakeWeather = {
    getWeather: async () => ({
      data: [
        {
          date: '2026-08-27',
          temperature: 30,
          conditions: 'CLOUDY',
          visibility: 8,
          precipitation: 0,
        },
      ],
      freshness,
    }),
  };
  const fakeTide = {
    getTide: async () => ({
      data: [
        { date: '2026-08-27', time: '2026-08-27T06:00:00Z', height: 1.8, type: 'HIGH' },
        { date: '2026-08-27', time: '2026-08-27T12:00:00Z', height: 0.4, type: 'LOW' },
      ],
      freshness,
    }),
  };
  const fakeWindWave = {
    getWindWave: async () => ({
      data: [
        {
          date: '2026-08-27',
          windSpeed: 12,
          windDirection: 'NE',
          windGusts: 18,
          waveHeight: 0.8,
          wavePeriod: 5,
        },
      ],
      freshness,
    }),
  };
  const fakeMoon = {
    getMoonPhase: async () => ({
      data: {
        date: '2026-08-27',
        phaseName: 'Full Moon',
        illumination: 0.98,
        ageDays: 15,
        moonrise: '18:00',
        moonset: '06:00',
      },
    }),
  };
  const fakeSun = {
    getSunData: async () => ({
      data: {
        date: '2026-08-27',
        sunrise: '07:00',
        sunset: '19:15',
        solarNoon: '13:07',
        daylightDuration: '12h15m',
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OperationalCalendarModule, RecommendationModule, StationsModule],
      controllers: [PublicCalendarController, PublicRecommendationController],
    })
      .overrideProvider(WeatherService)
      .useValue(fakeWeather)
      .overrideProvider(TideService)
      .useValue(fakeTide)
      .overrideProvider(WindWaveService)
      .useValue(fakeWindWave)
      .overrideProvider(MoonService)
      .useValue(fakeMoon)
      .overrideProvider(SunService)
      .useValue(fakeSun)
      .overrideProvider(STATION_REPOSITORY)
      .useValue({
        findById: async () => null,
        findByIdAdmin: async () => null,
        findByCode: async () => null,
        findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        create: async () => {
          throw new Error('not implemented');
        },
        update: async () => {
          throw new Error('not implemented');
        },
        archive: async () => {
          throw new Error('not implemented');
        },
      })
      .overrideProvider(REGION_REPOSITORY)
      .useValue({
        findById: async () => null,
        findByCode: async () => null,
        findAllActive: async () => [],
        create: async () => {
          throw new Error('not implemented');
        },
      })
      .overrideProvider(STATIONS_QUERY_PORT)
      .useValue({
        findById: async () => null,
        findPublicById: async (id: string) => ({
          id,
          code: 'PKG-01',
          name: 'Pelabuhan Klang',
          latitude: 3.0033,
          longitude: 101.3925,
          timezone: 'Asia/Kuala_Lumpur',
          regionId: null,
          regionName: 'Selangor',
          status: 'ACTIVE',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        listRegions: async () => [],
      })
      .overrideProvider(PROVIDER_MAPPING_PORT)
      .useValue({ getByStation: async () => [], getByStationAndType: async () => null })
      .overrideProvider(AUDIT_REPOSITORY)
      .useValue(new InMemoryAuditRepository())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /public/calendar', () => {
    it('aggregates weather/tide/wind-wave/moon/sun into one daily record', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/calendar')
        .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-27' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const day = res.body.data[0];
      expect(day.stationName).toBe('Pelabuhan Klang');
      expect(day.weather.temperature).toBe(30);
      expect(day.tide.nextHigh.height).toBe(1.8);
      expect(day.windWave.windSpeed).toBe(12);
      expect(day.moon.phaseName).toBe('Full Moon');
      expect(day.sun.sunrise).toBe('07:00');
    });

    it('spans a multi-day date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/calendar')
        .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-29' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });
  });

  describe('GET /public/recommendation', () => {
    it('produces a scored recommendation built from the real rule set', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/recommendation')
        .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-27' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const rec = res.body.data[0];
      expect(rec.stationName).toBe('Pelabuhan Klang');
      expect(typeof rec.overallScore).toBe('number');
      expect(['SAFE', 'CAUTION', 'WARNING', 'UNSAFE', 'UNKNOWN']).toContain(rec.overallStatus);
      expect(Array.isArray(rec.ruleResults)).toBe(true);
      expect(rec.ruleResults.length).toBeGreaterThan(0);
    });
  });
});
