import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { VesselIntelligenceModule } from '../../src/modules/vessel-intelligence/api/vessel-intelligence.module';
import { PublicVesselsController } from '../../src/api/public/public-vessels.controller';
import { AIS_PROVIDER } from '../../src/modules/ais/application/ais.service';
import type { AISProviderPort } from '../../src/modules/ais/domain';
import type {
  AisVesselSummary,
  AisVesselProfile,
  AisVesselEvent,
} from '../../src/modules/ais/domain';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/**
 * Real e2e coverage of PublicVesselsController — previously zero tests of
 * any kind (the only AIS-related spec, public-ais.contract.spec.ts, was
 * deleted along with the dead PublicAisController it tested; it never
 * imported a real controller either). This is @Public() — no guard
 * scaffolding needed. Only AIS_PROVIDER (the GFW HTTP boundary) is faked;
 * VesselIntelligenceService, AisService, and the real domain mappers all run.
 */
describe('PublicVesselsController (e2e, fake AIS provider)', () => {
  let app: INestApplication;

  const fakeVessel: AisVesselSummary = {
    id: 'v-1',
    name: 'Nelayan Jaya',
    mmsi: '533123456',
    imo: null,
    flag: 'MY',
    vesselType: 'fishing',
    source: 'gfw',
    lastKnownPosition: {
      latitude: 3.0,
      longitude: 101.0,
      speed: 5,
      course: 90,
      heading: 85,
      timestamp: '2026-08-27T00:00:00Z',
    },
    lastPositionAt: '2026-08-27T00:00:00Z',
  };

  const fakeProfile: AisVesselProfile = {
    identity: {
      id: 'v-1',
      name: 'Nelayan Jaya',
      mmsi: '533123456',
      imo: null,
      flag: 'MY',
      callsign: null,
      vesselType: 'fishing',
      length: 18,
      width: 4,
      grossTonnage: 25,
    },
    position: fakeVessel.lastKnownPosition,
    activity: { fishingHours: 120, encounterCount: 2, portVisitCount: 5 },
  };

  const fakeEvent: AisVesselEvent = {
    id: 'ev-1',
    vesselId: 'v-1',
    type: 'FISHING',
    startAt: '2026-08-26T00:00:00Z',
    endAt: '2026-08-26T06:00:00Z',
    latitude: 3.0,
    longitude: 101.0,
    metadata: null,
  };

  const fakeProvider: AISProviderPort = {
    searchVessels: async (query) => {
      if (query === 'empty') return { vessels: [], total: 0 };
      return { vessels: [fakeVessel], total: 1 };
    },
    getVesselProfile: async (vesselId) => {
      if (vesselId === 'unknown') throw new Error('vessel not found upstream');
      return fakeProfile;
    },
    getVesselEvents: async () => [fakeEvent],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [VesselIntelligenceModule],
      controllers: [PublicVesselsController],
    })
      .overrideProvider(AIS_PROVIDER)
      .useValue(fakeProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /public/vessels/search returns mapped vessel summaries', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/vessels/search?q=nelayan');
    expect(res.status).toBe(200);
    expect(res.body.vessels).toHaveLength(1);
    expect(res.body.vessels[0].name).toBe('Nelayan Jaya');
    expect(res.body.total).toBe(1);
    expect(res.body.source).toBe('gfw');
  });

  it('GET /public/vessels/search returns an empty list without erroring', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/vessels/search?q=empty');
    expect(res.status).toBe(200);
    expect(res.body.vessels).toHaveLength(0);
  });

  it('GET /public/vessels/:vesselId returns a mapped profile with events', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/vessels/v-1');
    expect(res.status).toBe(200);
    expect(res.body.identity.name).toBe('Nelayan Jaya');
    expect(res.body.identity.mmsi).toBe('533123456');
    expect(res.body.events).toHaveLength(1);
    expect(res.body.source).toBe('gfw');
  });

  it('GET /public/vessels/:vesselId/events returns mapped events', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/vessels/v-1/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].type).toBe('FISHING');
  });

  it('GET /public/vessels/:vesselId surfaces an upstream provider failure as a 500', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/vessels/unknown');
    expect(res.status).toBe(500);
  });
});
