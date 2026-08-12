import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

@Controller('ais/vessels')
class TestAisController {
  @Get('search')
  async search(@Query('q') _q: string) {
    return {
      vessels: [
        {
          id: 'v-1',
          name: 'Mock Vessel',
          mmsi: '123',
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
            timestamp: '2026-08-07T00:00:00Z',
          },
          lastPositionAt: '2026-08-07T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      freshness: { status: 'fresh', fetchedAt: new Date().toISOString(), source: 'gfw' },
    };
  }
  @Get(':vesselId')
  async profile(@Param('vesselId') id: string) {
    return {
      profile: {
        identity: {
          id,
          name: 'Mock Vessel',
          mmsi: '123',
          imo: null,
          flag: 'MY',
          callsign: null,
          vesselType: 'fishing',
          length: null,
          width: null,
          grossTonnage: null,
        },
        position: null,
        activity: { fishingHours: null, encounterCount: null, portVisitCount: null },
      },
      freshness: { status: 'fresh', fetchedAt: new Date().toISOString(), source: 'gfw' },
    };
  }
  @Get(':vesselId/events')
  async events(@Param('vesselId') id: string) {
    return {
      vesselId: id,
      events: [
        {
          id: 'ev-1',
          vesselId: id,
          type: 'FISHING',
          startAt: '2026-08-07T00:00:00Z',
          endAt: null,
          latitude: 3.0,
          longitude: 101.0,
          metadata: null,
        },
      ],
      freshness: { status: 'fresh', fetchedAt: new Date().toISOString(), source: 'gfw' },
    };
  }
}

describe('AIS Pipeline — Contract Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAisController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /ais/vessels/search returns AisSearchResult shape', async () => {
    const res = await request(app.getHttpServer()).get('/ais/vessels/search?q=test');
    expect(res.status).toBe(200);
    const b = res.body;
    expect(Array.isArray(b.vessels)).toBe(true);
    expect(b.vessels[0].name).toBe('Mock Vessel');
    expect(b.vessels[0].source).toBe('gfw');
    expect(b.vessels[0].lastKnownPosition).toBeDefined();
    expect(b.freshness.status).toBe('fresh');
    expect(b.freshness.source).toBe('gfw');
  });

  it('GET /ais/vessels/:vesselId returns AisProfileResult shape', async () => {
    const res = await request(app.getHttpServer()).get('/ais/vessels/v-1');
    expect(res.status).toBe(200);
    expect(res.body.profile.identity.name).toBe('Mock Vessel');
    expect(res.body.freshness.status).toBe('fresh');
  });

  it('GET /ais/vessels/:vesselId/events returns AisEventsResult shape', async () => {
    const res = await request(app.getHttpServer()).get('/ais/vessels/v-1/events');
    expect(res.status).toBe(200);
    expect(res.body.events[0].type).toBe('FISHING');
    expect(res.body.freshness.status).toBe('fresh');
  });
});
