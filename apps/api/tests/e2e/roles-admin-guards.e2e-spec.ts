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

import { RolesModule } from '../../src/modules/roles/api/roles.module';
import { RolesController } from '../../src/api/admin/roles.controller';
import { ROLE_REPOSITORY } from '../../src/modules/roles/application/di-tokens';
import { InMemoryRoleRepository } from '../../src/modules/roles/application/test-doubles';
import type { RoleRecord } from '../../src/modules/roles/domain';

import { AuditModule } from '../../src/modules/audit/api/audit.module';
import { AUDIT_REPOSITORY } from '../../src/modules/audit/application/di-tokens';
import { InMemoryAuditRepository } from '../../src/modules/audit/application/test-doubles';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/**
 * Real e2e coverage of RolesController — previously zero tests of any kind
 * (not even a fake contract spec). Same pattern as
 * auth-and-admin-guards.e2e-spec.ts: real controllers/guards through
 * genuine NestJS DI, with only Prisma/argon2/JWT swapped for in-memory
 * test-doubles.
 */
describe('Roles admin RBAC + business rules (e2e, in-memory infrastructure)', () => {
  let app: INestApplication;
  let auditRepository: InMemoryAuditRepository;

  const auditor: UserAuthRecord = makeUserRecord({
    id: 'user-auditor',
    email: 'auditor@marineops.local',
    permissionCodes: ['audit.read'],
  });
  const admin: UserAuthRecord = makeUserRecord({
    id: 'user-admin',
    email: 'admin@marineops.local',
    permissionCodes: ['role.manage'],
  });

  let roleRepository: InMemoryRoleRepository;
  const existingRole: RoleRecord = {
    id: 'role-1',
    name: 'FisheriesOfficer',
    permissionCodes: ['station.read', 'calendar.read'],
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };
  const roleWithUsers: RoleRecord = {
    id: 'role-2',
    name: 'Auditor',
    permissionCodes: ['audit.read'],
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
  };

  beforeAll(async () => {
    process.env['JWT_ACCESS_SECRET'] = 'e2e-test-secret';

    const identityProvider = new InMemoryUserIdentityProvider(
      new Map([
        [auditor.id, auditor],
        [admin.id, admin],
      ]),
    );
    const fakeTokenService = new FakeTokenService();

    roleRepository = new InMemoryRoleRepository();
    roleRepository.seed([existingRole, roleWithUsers]);
    roleRepository.setUserCount(roleWithUsers.id, 3);
    auditRepository = new InMemoryAuditRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule, RolesModule, AuditModule],
      controllers: [AuthController, RolesController],
    })
      .overrideProvider(USER_IDENTITY_PROVIDER)
      .useValue(identityProvider)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new FakePasswordHasher())
      .overrideProvider(TOKEN_SERVICE)
      .useValue(fakeTokenService)
      .overrideProvider(ROLE_REPOSITORY)
      .useValue(roleRepository)
      .overrideProvider(AUDIT_REPOSITORY)
      .useValue(auditRepository)
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
    it('rejects GET /v1/roles with 401 when unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/roles');
      expect(res.status).toBe(401);
    });

    it('rejects GET /v1/roles with 403 when the principal lacks role.manage', async () => {
      const token = await loginAs(auditor.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('allows GET /v1/roles when the principal holds role.manage', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.map((r: { name: string }) => r.name)).toContain('FisheriesOfficer');
    });
  });

  describe('business rules', () => {
    it('POST /v1/roles rejects a duplicate name with 409', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'FisheriesOfficer', permissionCodes: ['station.read'] });
      expect(res.status).toBe(409);
    });

    it('POST /v1/roles creates a role with a unique name', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DataAnalyst', permissionCodes: ['dashboard.read'] });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('DataAnalyst');
      const auditEntry = auditRepository.events.find((e) => e.entityId === res.body.id);
      expect(auditEntry).toMatchObject({
        actorId: admin.id,
        action: 'role.create',
        entityType: 'role',
      });
    });

    it('POST /v1/roles rejects an empty permissionCodes array with 400', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'EmptyRole', permissionCodes: [] });
      expect(res.status).toBe(400);
    });

    it('DELETE /v1/roles/:id rejects a role that still has users with 409', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/roles/${roleWithUsers.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(409);
    });

    it('GET /v1/roles/:id returns 404 for an unknown role', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/roles/does-not-exist')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
