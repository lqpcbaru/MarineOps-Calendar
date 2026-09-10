import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  StationsModule,
  STATIONS_QUERY_PORT,
  PROVIDER_MAPPING_PORT,
} from '../../src/modules/stations/api/stations.module';
import { PublicStationsController } from '../../src/api/public/public-stations.controller';
import {
  STATION_REPOSITORY,
  REGION_REPOSITORY,
} from '../../src/modules/stations/application/di-tokens';
import type {
  StationRepository,
  RegionRepository,
} from '../../src/modules/stations/application/ports';
import type {
  StationRecord,
  StationListResult,
  OperationRegionRecord,
} from '../../src/modules/stations/domain';

import { AUDIT_REPOSITORY } from '../../src/modules/audit/application/di-tokens';
import { InMemoryAuditRepository } from '../../src/modules/audit/application/test-doubles';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

class ReadOnlyStationRepository implements StationRepository {
  constructor(private readonly stations: StationRecord[]) {}

  async findById(id: string) {
    return this.stations.find((s) => s.id === id) ?? null;
  }
  async findByIdAdmin(id: string) {
    return this.stations.find((s) => s.id === id) ?? null;
  }
  async findByCode(code: string) {
    return this.stations.find((s) => s.code === code) ?? null;
  }
  async findAllPublic(): Promise<StationListResult> {
    const active = this.stations.filter((s) => s.status === 'ACTIVE');
    return { stations: active, total: active.length, page: 1, pageSize: 20 };
  }
  async findAllAdmin(): Promise<StationListResult> {
    return { stations: this.stations, total: this.stations.length, page: 1, pageSize: 20 };
  }
  async create(): Promise<StationRecord> {
    throw new Error('not implemented — public controller does not write');
  }
  async update(): Promise<StationRecord> {
    throw new Error('not implemented — public controller does not write');
  }
  async archive(): Promise<StationRecord> {
    throw new Error('not implemented — public controller does not write');
  }
}

class SingleRegionRepository implements RegionRepository {
  constructor(private readonly regions: OperationRegionRecord[]) {}
  async findById(id: string) {
    return this.regions.find((r) => r.id === id) ?? null;
  }
  async findByCode(code: string) {
    return this.regions.find((r) => r.code === code) ?? null;
  }
  async findAllActive(): Promise<OperationRegionRecord[]> {
    return this.regions.filter((r) => r.status === 'ACTIVE');
  }
  async create(params: { code: string; name: string }): Promise<OperationRegionRecord> {
    return {
      id: 'region-new',
      code: params.code,
      name: params.name,
      description: null,
      parentRegionId: null,
      status: 'ACTIVE',
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Real e2e coverage of PublicStationsController — previously zero tests of
 * any kind. @Public(), no guard scaffolding needed.
 */
describe('PublicStationsController (e2e, in-memory infrastructure)', () => {
  let app: INestApplication;

  const activeStation: StationRecord = {
    id: 'station-1',
    code: 'PKG-01',
    name: 'Pelabuhan Klang',
    latitude: 3.0033,
    longitude: 101.3925,
    timezone: 'Asia/Kuala_Lumpur',
    regionId: 'region-1',
    regionName: 'Selangor',
    status: 'ACTIVE',
    metadata: { internalNote: 'harbourmaster direct line redacted-for-test' },
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };
  const archivedStation: StationRecord = {
    ...activeStation,
    id: 'station-2',
    code: 'OLD-01',
    name: 'Decommissioned Station',
    status: 'ARCHIVED',
  };
  const region: OperationRegionRecord = {
    id: 'region-1',
    code: 'SEL',
    name: 'Selangor',
    description: null,
    parentRegionId: null,
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [StationsModule],
      controllers: [PublicStationsController],
    })
      .overrideProvider(STATION_REPOSITORY)
      .useValue(new ReadOnlyStationRepository([activeStation, archivedStation]))
      .overrideProvider(REGION_REPOSITORY)
      .useValue(new SingleRegionRepository([region]))
      .overrideProvider(STATIONS_QUERY_PORT)
      .useValue({
        findById: async () => null,
        findPublicById: async () => null,
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

  it('GET /public/stations returns only ACTIVE stations', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/stations');
    expect(res.status).toBe(200);
    expect(res.body.stations).toHaveLength(1);
    expect(res.body.stations[0].code).toBe('PKG-01');
  });

  it('GET /public/stations never leaks metadata, status, or timestamps', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/stations');
    expect(res.status).toBe(200);
    const station = res.body.stations[0];
    expect(station).toEqual({
      id: 'station-1',
      code: 'PKG-01',
      name: 'Pelabuhan Klang',
      latitude: 3.0033,
      longitude: 101.3925,
      timezone: 'Asia/Kuala_Lumpur',
      regionId: 'region-1',
      regionName: 'Selangor',
    });
    // Belt-and-suspenders: the seeded internal note must not appear anywhere
    // in the serialized body, in case it leaked under some other key.
    expect(JSON.stringify(res.body)).not.toContain('harbourmaster');
  });

  it('GET /public/stations/regions returns active regions', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/stations/regions');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Selangor');
  });

  it('GET /public/stations/:id returns a public-safe subset (no metadata)', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/stations/station-1');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('PKG-01');
    expect(res.body.regionName).toBe('Selangor');
    expect(res.body.metadata).toBeUndefined();
  });

  it('GET /public/stations/:id returns 404 for an archived/unknown station', async () => {
    const res = await request(app.getHttpServer()).get('/api/public/stations/does-not-exist');
    expect(res.status).toBe(404);
  });
});
