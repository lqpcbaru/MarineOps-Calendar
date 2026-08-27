import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { WeatherModule } from '../../src/modules/weather/api/weather.module';
import { PublicWeatherController } from '../../src/api/public/public-weather.controller';
import { WEATHER_PROVIDER } from '../../src/modules/weather/application/weather.service';
import type { WeatherProviderPort } from '../../src/modules/weather/domain';

import { TideModule } from '../../src/modules/tide/api/tide.module';
import { PublicTideController } from '../../src/api/public/public-tide.controller';
import { TIDE_PROVIDER } from '../../src/modules/tide/application/tide.service';
import type { TideProviderPort } from '../../src/modules/tide/domain';

import { WindWaveModule } from '../../src/modules/wind-wave/api/wind-wave.module';
import { PublicWindWaveController } from '../../src/api/public/public-wind-wave.controller';
import { WIND_WAVE_PROVIDER } from '../../src/modules/wind-wave/application/wind-wave.service';
import type { WindWaveProviderPort } from '../../src/modules/wind-wave/domain';

import { MoonModule } from '../../src/modules/moon/api/moon.module';
import { PublicMoonController } from '../../src/api/public/public-moon.controller';
import { MOON_PROVIDER } from '../../src/modules/moon/application/moon.service';
import type { MoonProviderPort } from '../../src/modules/moon/domain';

import { SunModule } from '../../src/modules/sun/api/sun.module';
import { PublicSunController } from '../../src/api/public/public-sun.controller';
import { SUN_PROVIDER } from '../../src/modules/sun/application/sun.service';
import type { SunProviderPort } from '../../src/modules/sun/domain';

import { DashboardModule } from '../../src/modules/dashboard/api/dashboard.module';
import { PublicDashboardController } from '../../src/api/public/public-dashboard.controller';

import {
  StationsModule,
  STATIONS_QUERY_PORT,
  PROVIDER_MAPPING_PORT,
} from '../../src/modules/stations/api/stations.module';
import {
  STATION_REPOSITORY,
  REGION_REPOSITORY,
} from '../../src/modules/stations/application/di-tokens';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

const fakeWeatherProvider: WeatherProviderPort = {
  getCurrentWeather: async (_stationId) => ({
    date: '2026-08-27',
    temperature: 30,
    conditions: 'CLOUDY',
    visibility: 8,
    precipitation: 0,
  }),
  getForecast: async (stationId, dateFrom) => [
    { date: dateFrom, temperature: 30, conditions: 'CLOUDY', visibility: 8, precipitation: 0 },
  ],
};

const fakeTideProvider: TideProviderPort = {
  getTide: async (stationId, dateFrom) => [
    { date: dateFrom, time: `${dateFrom}T06:00:00Z`, height: 1.8, type: 'HIGH' },
    { date: dateFrom, time: `${dateFrom}T12:00:00Z`, height: 0.4, type: 'LOW' },
  ],
};

const fakeWindWaveProvider: WindWaveProviderPort = {
  getWindWave: async (stationId, dateFrom) => [
    {
      date: dateFrom,
      windSpeed: 12,
      windDirection: 'NE',
      windGusts: 18,
      waveHeight: 0.8,
      wavePeriod: 5,
    },
  ],
};

const fakeMoonProvider: MoonProviderPort = {
  getMoonPhase: async (stationId, date) => ({
    date,
    phaseName: 'Full Moon',
    illumination: 0.98,
    ageDays: 15,
    moonrise: '18:00',
    moonset: '06:00',
  }),
};

const fakeSunProvider: SunProviderPort = {
  getSunData: async (stationId, date) => ({
    date,
    sunrise: '07:00',
    sunset: '19:15',
    solarNoon: '13:07',
    daylightDuration: '12h15m',
  }),
};

const stationStubs = {
  stationRepository: {
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
  },
  regionRepository: {
    findById: async () => null,
    findByCode: async () => null,
    findAllActive: async () => [],
    create: async () => {
      throw new Error('not implemented');
    },
  },
  stationsQueryPort: {
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
  },
  providerMappingPort: { getByStation: async () => [], getByStationAndType: async () => null },
};

/**
 * Real e2e coverage of the 6 remaining public controllers previously
 * covered only by fake inline "contract" specs (weather/tide/wind-wave/
 * moon/sun/dashboard) that never imported the real controllers. Only the
 * outermost provider HTTP boundary is faked per module — WeatherService,
 * TideService, WindWaveService, MoonService, SunService,
 * OperationalCalendarService, RecommendationService, and DashboardService
 * all run for real, through genuine NestJS DI, including their real
 * caching behavior.
 */
describe('Public sourced-data controllers (e2e, faked providers)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        WeatherModule,
        TideModule,
        WindWaveModule,
        MoonModule,
        SunModule,
        DashboardModule,
        StationsModule,
      ],
      controllers: [
        PublicWeatherController,
        PublicTideController,
        PublicWindWaveController,
        PublicMoonController,
        PublicSunController,
        PublicDashboardController,
      ],
    })
      .overrideProvider(WEATHER_PROVIDER)
      .useValue(fakeWeatherProvider)
      .overrideProvider(TIDE_PROVIDER)
      .useValue(fakeTideProvider)
      .overrideProvider(WIND_WAVE_PROVIDER)
      .useValue(fakeWindWaveProvider)
      .overrideProvider(MOON_PROVIDER)
      .useValue(fakeMoonProvider)
      .overrideProvider(SUN_PROVIDER)
      .useValue(fakeSunProvider)
      .overrideProvider(STATION_REPOSITORY)
      .useValue(stationStubs.stationRepository)
      .overrideProvider(REGION_REPOSITORY)
      .useValue(stationStubs.regionRepository)
      .overrideProvider(STATIONS_QUERY_PORT)
      .useValue(stationStubs.stationsQueryPort)
      .overrideProvider(PROVIDER_MAPPING_PORT)
      .useValue(stationStubs.providerMappingPort)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /public/weather returns real WeatherService output', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/weather')
      .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-27' });
    expect(res.status).toBe(200);
    expect(res.body.data[0].temperature).toBe(30);
    expect(res.body.freshness.source).toBe('metmalaysia');
  });

  it('GET /public/tide returns real TideService output', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/tide')
      .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-27' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].type).toBe('HIGH');
  });

  it('GET /public/wind-wave returns real WindWaveService output', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/wind-wave')
      .query({ stationId: 'station-1', dateFrom: '2026-08-27', dateTo: '2026-08-27' });
    expect(res.status).toBe(200);
    expect(res.body.data[0].waveHeight).toBe(0.8);
  });

  it('GET /public/moon returns real MoonService output', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/moon')
      .query({ stationId: 'station-1', date: '2026-08-27' });
    expect(res.status).toBe(200);
    expect(res.body.data.phaseName).toBe('Full Moon');
  });

  it('GET /public/sun returns real SunService output', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/sun')
      .query({ stationId: 'station-1', date: '2026-08-27' });
    expect(res.status).toBe(200);
    expect(res.body.data.sunrise).toBe('07:00');
  });

  it('GET /public/dashboard aggregates calendar + recommendation for today', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/dashboard')
      .query({ stationId: 'station-1' });
    expect(res.status).toBe(200);
    expect(res.body.station.name).toBe('Pelabuhan Klang');
    expect(res.body.weather?.temperature).toBe(30);
    expect(res.body.wind?.speed).toBe(12);
    expect(res.body.moon?.phaseName).toBe('Full Moon');
    expect(res.body.sun?.sunrise).toBe('07:00');
    expect(['SAFE', 'CAUTION', 'WARNING', 'UNSAFE', 'UNKNOWN']).toContain(
      res.body.operationalStatus,
    );
  });

  it("a wider weather range is not served from a narrower range's cache entry", async () => {
    // Regression guard for the dateFrom-only cache key bug fixed earlier —
    // request a 1-day range first, then a range with the same dateFrom but
    // a different dateTo, and confirm the provider is actually re-queried.
    let calls = 0;
    const countingProvider: WeatherProviderPort = {
      getCurrentWeather: fakeWeatherProvider.getCurrentWeather,
      getForecast: async (_stationId, dateFrom, dateTo) => {
        calls++;
        const days = 1 + (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000;
        return Array.from({ length: days }, () => ({
          date: dateFrom,
          temperature: 30,
          conditions: 'CLOUDY',
          visibility: 8,
          precipitation: 0,
        }));
      },
    };

    const isolatedModule: TestingModule = await Test.createTestingModule({
      imports: [WeatherModule, StationsModule],
      controllers: [PublicWeatherController],
    })
      .overrideProvider(WEATHER_PROVIDER)
      .useValue(countingProvider)
      .overrideProvider(STATION_REPOSITORY)
      .useValue(stationStubs.stationRepository)
      .overrideProvider(REGION_REPOSITORY)
      .useValue(stationStubs.regionRepository)
      .overrideProvider(STATIONS_QUERY_PORT)
      .useValue(stationStubs.stationsQueryPort)
      .overrideProvider(PROVIDER_MAPPING_PORT)
      .useValue(stationStubs.providerMappingPort)
      .compile();

    const isolatedApp = isolatedModule.createNestApplication();
    isolatedApp.setGlobalPrefix('api');
    isolatedApp.useGlobalFilters(new DomainExceptionFilter());
    await isolatedApp.init();

    const first = await request(isolatedApp.getHttpServer())
      .get('/api/public/weather')
      .query({ stationId: 'station-regress', dateFrom: '2026-09-01', dateTo: '2026-09-01' });
    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(1);
    expect(calls).toBe(1);

    const second = await request(isolatedApp.getHttpServer())
      .get('/api/public/weather')
      .query({ stationId: 'station-regress', dateFrom: '2026-09-01', dateTo: '2026-09-03' });
    expect(second.status).toBe(200);
    expect(second.body.data).toHaveLength(3);
    expect(calls).toBe(2);

    await isolatedApp.close();
  });
});
