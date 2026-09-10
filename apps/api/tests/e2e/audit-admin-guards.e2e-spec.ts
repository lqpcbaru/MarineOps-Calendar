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

import { AuditModule } from '../../src/modules/audit/api/audit.module';
import { AuditController } from '../../src/api/admin/audit.controller';
import { AUDIT_REPOSITORY } from '../../src/modules/audit/application/di-tokens';
import { InMemoryAuditRepository } from '../../src/modules/audit/application/test-doubles';

import { RolesModule } from '../../src/modules/roles/api/roles.module';
import { RolesController } from '../../src/api/admin/roles.controller';
import { ROLE_REPOSITORY } from '../../src/modules/roles/application/di-tokens';
import { InMemoryRoleRepository } from '../../src/modules/roles/application/test-doubles';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/**
 * Real e2e coverage of AuditController — previously zero tests of any kind.
 * Same in-memory-infrastructure e2e pattern as the auth/roles suites.
 */
describe('Audit admin RBAC guards (e2e, in-memory infrastructure)', () => {
  let app: INestApplication;

  const planner: UserAuthRecord = makeUserRecord({
    id: 'user-planner',
    email: 'planner@marineops.local',
    permissionCodes: ['calendar.read'],
  });
  const auditor: UserAuthRecord = makeUserRecord({
    id: 'user-auditor',
    email: 'auditor@marineops.local',
    permissionCodes: ['audit.read'],
  });
  const roleAdmin: UserAuthRecord = makeUserRecord({
    id: 'user-role-admin',
    email: 'roleadmin@marineops.local',
    permissionCodes: ['role.manage', 'audit.read'],
  });

  beforeAll(async () => {
    process.env['JWT_ACCESS_SECRET'] = 'e2e-test-secret';

    const identityProvider = new InMemoryUserIdentityProvider(
      new Map([
        [planner.id, planner],
        [auditor.id, auditor],
        [roleAdmin.id, roleAdmin],
      ]),
    );
    const fakeTokenService = new FakeTokenService();

    const auditRepository = new InMemoryAuditRepository();
    await auditRepository.record({
      actorId: auditor.id,
      action: 'user.update',
      entityType: 'user',
      entityId: 'user-42',
      payload: { field: 'status' },
    });

    const roleRepository = new InMemoryRoleRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule, AuditModule, RolesModule],
      controllers: [AuthController, AuditController, RolesController],
    })
      .overrideProvider(USER_IDENTITY_PROVIDER)
      .useValue(identityProvider)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new FakePasswordHasher())
      .overrideProvider(TOKEN_SERVICE)
      .useValue(fakeTokenService)
      .overrideProvider(AUDIT_REPOSITORY)
      .useValue(auditRepository)
      .overrideProvider(ROLE_REPOSITORY)
      .useValue(roleRepository)
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

  it('rejects GET /v1/audit with 401 when unauthenticated', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/audit');
    expect(res.status).toBe(401);
  });

  it('rejects GET /v1/audit with 403 when the principal lacks audit.read', async () => {
    const token = await loginAs(planner.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows GET /v1/audit when the principal holds audit.read', async () => {
    const token = await loginAs(auditor.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].action).toBe('user.update');
  });

  it('rejects an invalid query param with 400', async () => {
    const token = await loginAs(auditor.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit?page=not-a-number')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  describe('end-to-end: a real admin mutation produces a queryable audit entry', () => {
    it('POST /v1/roles is recorded and readable back via GET /v1/audit', async () => {
      const token = await loginAs(roleAdmin.email);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2ERole', permissionCodes: ['station.read'] });
      expect(createRes.status).toBe(201);

      const auditRes = await request(app.getHttpServer())
        .get(`/api/v1/audit?entityType=role&action=role.create`)
        .set('Authorization', `Bearer ${token}`);
      expect(auditRes.status).toBe(200);

      const entry = auditRes.body.data.find(
        (e: { entityId: string }) => e.entityId === createRes.body.id,
      );
      expect(entry).toMatchObject({
        actorId: roleAdmin.id,
        action: 'role.create',
        entityType: 'role',
        entityId: createRes.body.id,
      });
    });
  });
});
