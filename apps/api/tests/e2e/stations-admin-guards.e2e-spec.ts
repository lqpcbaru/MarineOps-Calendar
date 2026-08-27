import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AuthenticationModule } from '../../src/modules/authentication/api/authentication.module';
import { AuthController } from '../../src/api/admin/auth.controller';
import {
  USER_IDENTITY_PROVIDER,
  REFRESH_TOKEN_REPOSITORY,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
} from '../../src/modules/authentication/application/di-tokens';
import {
  InMemoryUserIdentityProvider,
  InMemoryRefreshTokenRepository,
  FakePasswordHasher,
  FakeTokenService,
  makeUserRecord,
} from '../../src/modules/authentication/application/test-doubles';
import type { UserAuthRecord } from '../../src/modules/authentication/application/ports';

import {
  StationsModule,
  STATIONS_QUERY_PORT,
  PROVIDER_MAPPING_PORT,
} from '../../src/modules/stations/api/stations.module';
import { AdminStationsController } from '../../src/api/admin/admin-stations.controller';
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
  CreateStationParams,
  UpdateStationParams,
} from '../../src/modules/stations/domain';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/** Minimal in-memory StationRepository — no shared test-double module exists
 * for this port (unlike users/roles/audit), so this is built locally. */
class InMemoryStationRepository implements StationRepository {
  private readonly byId = new Map<string, StationRecord>();
  private readonly byCode = new Map<string, StationRecord>();

  seed(stations: StationRecord[]): void {
    for (const s of stations) {
      this.byId.set(s.id, s);
      this.byCode.set(s.code, s);
    }
  }

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByIdAdmin(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByCode(code: string) {
    return this.byCode.get(code) ?? null;
  }
  async findAllPublic(): Promise<StationListResult> {
    const stations = [...this.byId.values()].filter((s) => s.status === 'ACTIVE');
    return { stations, total: stations.length, page: 1, pageSize: 20 };
  }
  async findAllAdmin(): Promise<StationListResult> {
    const stations = [...this.byId.values()];
    return { stations, total: stations.length, page: 1, pageSize: 20 };
  }
  async create(params: CreateStationParams): Promise<StationRecord> {
    const record: StationRecord = {
      id: `station-${this.byId.size + 1}`,
      code: params.code,
      name: params.name,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
      regionId: params.regionId ?? null,
      status: 'ACTIVE',
      metadata: params.metadata ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.byId.set(record.id, record);
    this.byCode.set(record.code, record);
    return record;
  }
  async update(id: string, params: UpdateStationParams): Promise<StationRecord> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error('not found');
    const updated: StationRecord = { ...existing, ...params, updatedAt: new Date() };
    this.byId.set(id, updated);
    return updated;
  }
  async archive(id: string): Promise<StationRecord> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error('not found');
    const archived: StationRecord = { ...existing, status: 'ARCHIVED', updatedAt: new Date() };
    this.byId.set(id, archived);
    return archived;
  }
}

class InMemoryRegionRepository implements RegionRepository {
  async findById(): Promise<OperationRegionRecord | null> {
    return null;
  }
  async findByCode(): Promise<OperationRegionRecord | null> {
    return null;
  }
  async findAllActive(): Promise<OperationRegionRecord[]> {
    return [];
  }
  async create(params: { code: string; name: string }): Promise<OperationRegionRecord> {
    return {
      id: 'region-1',
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

describe('Stations admin RBAC + business rules (e2e, in-memory infrastructure)', () => {
  let app: INestApplication;

  const planner: UserAuthRecord = makeUserRecord({
    id: 'user-planner',
    email: 'planner@marineops.local',
    permissionCodes: ['calendar.read'],
  });
  const stationReader: UserAuthRecord = makeUserRecord({
    id: 'user-reader',
    email: 'reader@marineops.local',
    permissionCodes: ['station.read'],
  });
  const stationWriter: UserAuthRecord = makeUserRecord({
    id: 'user-writer',
    email: 'writer@marineops.local',
    permissionCodes: ['station.read', 'station.write'],
  });

  const existingStation: StationRecord = {
    id: 'station-existing',
    code: 'PKG-01',
    name: 'Pelabuhan Klang',
    latitude: 3.0033,
    longitude: 101.3925,
    timezone: 'Asia/Kuala_Lumpur',
    regionId: null,
    status: 'ACTIVE',
    metadata: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };

  beforeAll(async () => {
    process.env['JWT_ACCESS_SECRET'] = 'e2e-test-secret';

    const identityProvider = new InMemoryUserIdentityProvider(
      new Map([
        [planner.id, planner],
        [stationReader.id, stationReader],
        [stationWriter.id, stationWriter],
      ]),
    );
    const fakeTokenService = new FakeTokenService();

    const stationRepository = new InMemoryStationRepository();
    stationRepository.seed([existingStation]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule, StationsModule],
      controllers: [AuthController, AdminStationsController],
    })
      .overrideProvider(USER_IDENTITY_PROVIDER)
      .useValue(identityProvider)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new FakePasswordHasher())
      .overrideProvider(TOKEN_SERVICE)
      .useValue(fakeTokenService)
      .overrideProvider(STATION_REPOSITORY)
      .useValue(stationRepository)
      .overrideProvider(REGION_REPOSITORY)
      .useValue(new InMemoryRegionRepository())
      // Not exercised by AdminStationsController, but StationsModule
      // eagerly instantiates every provider it declares — these adapters
      // otherwise need a real PrismaService.
      .overrideProvider(STATIONS_QUERY_PORT)
      .useValue({
        findById: async () => null,
        findPublicById: async () => null,
        list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        listRegions: async () => [],
      })
      .overrideProvider(PROVIDER_MAPPING_PORT)
      .useValue({
        getByStation: async () => [],
        getByStationAndType: async () => null,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  async function loginAs(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'correct-horse-battery' });
    expect(res.status).toBe(201);
    return res.body.accessToken as string;
  }

  describe('guard enforcement', () => {
    it('rejects GET /v1/stations with 401 when unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/stations');
      expect(res.status).toBe(401);
    });

    it('rejects GET /v1/stations with 403 when the principal lacks station.read', async () => {
      const token = await loginAs(planner.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('allows GET /v1/stations when the principal holds station.read', async () => {
      const token = await loginAs(stationReader.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.stations[0].code).toBe('PKG-01');
    });

    it('rejects POST /v1/stations with 403 for a principal with only station.read', async () => {
      const token = await loginAs(stationReader.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'NEW-01',
          name: 'New Station',
          latitude: 1,
          longitude: 101,
          timezone: 'Asia/Kuala_Lumpur',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('business rules', () => {
    it('POST /v1/stations creates a station for a principal with station.write', async () => {
      const token = await loginAs(stationWriter.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'LGK-01',
          name: 'Langkawi',
          latitude: 6.35,
          longitude: 99.8,
          timezone: 'Asia/Kuala_Lumpur',
        });
      expect(res.status).toBe(201);
      expect(res.body.code).toBe('LGK-01');
    });

    it('POST /v1/stations rejects a duplicate code with 409', async () => {
      const token = await loginAs(stationWriter.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'PKG-01',
          name: 'Duplicate',
          latitude: 3,
          longitude: 101,
          timezone: 'Asia/Kuala_Lumpur',
        });
      expect(res.status).toBe(409);
    });

    it('POST /v1/stations rejects an invalid code format with 400', async () => {
      const token = await loginAs(stationWriter.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'lowercase-not-allowed',
          name: 'Bad Code',
          latitude: 3,
          longitude: 101,
          timezone: 'Asia/Kuala_Lumpur',
        });
      expect(res.status).toBe(400);
    });

    it('GET /v1/stations/:id returns 404 for an unknown station', async () => {
      const token = await loginAs(stationReader.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/stations/does-not-exist')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
