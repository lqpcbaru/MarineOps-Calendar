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

import { UsersModule } from '../../src/modules/users/api/users.module';
import { UsersController } from '../../src/api/admin/users.controller';
import { USER_REPOSITORY } from '../../src/modules/users/application/di-tokens';
import { InMemoryUserRepository } from '../../src/modules/users/application/test-doubles';
import type { UserRecord } from '../../src/modules/users/domain';

import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/**
 * Real e2e coverage of the HTTP layer: guard wiring, DI, and routing — the
 * gap the existing "contract" specs never covered (they boot fake inline
 * controllers, never the real ones). Only the outermost infrastructure
 * (Prisma, argon2, real JWT signing) is swapped for the module's own
 * in-memory test-doubles; AuthController, UsersController, JwtAuthGuard,
 * and PermissionsGuard are all resolved through the real NestJS DI graph.
 * Requires vitest.e2e.config.ts's unplugin-swc transform — without it,
 * JwtAuthGuard's bare-type `reflector: Reflector` param never resolves.
 */
describe('Auth flow + admin RBAC guards (e2e, in-memory infrastructure)', () => {
  let app: INestApplication;

  const planner: UserAuthRecord = makeUserRecord({
    id: 'user-planner',
    email: 'planner@marineops.local',
    permissionCodes: ['patrolplan.write', 'calendar.read'],
  });
  const admin: UserAuthRecord = makeUserRecord({
    id: 'user-admin',
    email: 'admin@marineops.local',
    permissionCodes: ['user.manage'],
  });

  beforeAll(async () => {
    process.env['JWT_ACCESS_SECRET'] = 'e2e-test-secret';

    const identityProvider = new InMemoryUserIdentityProvider(
      new Map([
        [planner.id, planner],
        [admin.id, admin],
      ]),
    );
    const fakeTokenService = new FakeTokenService();

    const adminRecord: UserRecord = {
      id: 'user-admin',
      email: 'admin@marineops.local',
      name: 'Admin',
      passwordHash: 'fake:irrelevant',
      status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en',
      roleIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const userRepository = new InMemoryUserRepository();
    userRepository.seed([adminRecord]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule, UsersModule],
      controllers: [AuthController, UsersController],
    })
      .overrideProvider(USER_IDENTITY_PROVIDER)
      .useValue(identityProvider)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new FakePasswordHasher())
      .overrideProvider(TOKEN_SERVICE)
      .useValue(fakeTokenService)
      .overrideProvider(USER_REPOSITORY)
      .useValue(userRepository)
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

  describe('POST /v1/auth/login', () => {
    it('returns an access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: planner.email, password: 'correct-horse-battery' });

      expect(res.status).toBe(201);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects an unknown email with 401 and no token leaked', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@marineops.local', password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body.accessToken).toBeUndefined();
    });

    it('rejects a wrong password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: planner.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('rejects a request with no Authorization header (JwtAuthGuard)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the authenticated principal for a valid token', async () => {
      const token = await loginAs(planner.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(planner.email);
      expect(res.body.permissionCodes).toEqual(planner.permissionCodes);
    });
  });

  describe('GET /v1/users (RequirePermissions("user.manage") via PermissionsGuard)', () => {
    it('rejects with 401 when unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('rejects with 403 when the principal lacks user.manage', async () => {
      const token = await loginAs(planner.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('allows the request when the principal holds user.manage', async () => {
      const token = await loginAs(admin.email);
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users[0].email).toBe('admin@marineops.local');
    });

    it('rejects an invalid/garbage bearer token with 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
    });
  });
});
