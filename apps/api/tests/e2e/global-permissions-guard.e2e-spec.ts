import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AuthenticationModule } from '../../src/modules/authentication/api/authentication.module';
import { AuthController } from '../../src/api/admin/auth.controller';
import { JwtAuthGuard } from '../../src/modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../src/modules/authentication/api/permissions.guard';
import { Public } from '../../src/modules/authentication/api/public.decorator';
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
import { DomainExceptionFilter } from '../../src/platform/domain-exception.filter';

/**
 * PermissionsGuard is registered globally in AppModule. This proves what
 * that buys: a controller carrying @RequirePermissions but NO
 * @UseGuards(PermissionsGuard) is still enforced.
 *
 * That combination is the realistic mistake — the decorator is only
 * metadata, so before the guard was global such a route read as protected
 * in review and enforced nothing at runtime. Every controller in the repo
 * currently does declare @UseGuards; this covers the one that forgets.
 */
@Controller('v1/guardless')
class GuardlessController {
  @Get('protected')
  @RequirePermissions('station.write')
  protectedRoute(): { ok: true } {
    return { ok: true };
  }

  // No @RequirePermissions: the global guard must let this through, or
  // registering it would have broken every unannotated route.
  @Get('unannotated')
  unannotated(): { ok: true } {
    return { ok: true };
  }

  // @Public() routes must stay reachable with no credentials at all.
  @Public()
  @Get('open')
  open(): { ok: true } {
    return { ok: true };
  }
}

describe('Global PermissionsGuard (e2e)', () => {
  let app: INestApplication;

  const reader: UserAuthRecord = makeUserRecord({
    id: 'user-reader',
    email: 'reader@marineops.local',
    permissionCodes: ['station.read'],
  });
  const writer: UserAuthRecord = makeUserRecord({
    id: 'user-writer',
    email: 'writer@marineops.local',
    permissionCodes: ['station.read', 'station.write'],
  });

  beforeAll(async () => {
    process.env['JWT_ACCESS_SECRET'] = 'e2e-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule],
      controllers: [AuthController, GuardlessController],
      // Exactly how AppModule registers them, order included.
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    })
      .overrideProvider(USER_IDENTITY_PROVIDER)
      .useValue(
        new InMemoryUserIdentityProvider(
          new Map([
            [reader.id, reader],
            [writer.id, writer],
          ]),
        ),
      )
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(PASSWORD_HASHER)
      .useValue(new FakePasswordHasher())
      .overrideProvider(TOKEN_SERVICE)
      .useValue(new FakeTokenService())
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

  it('rejects an unauthenticated request to the annotated route with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/guardless/protected');
    expect(res.status).toBe(401);
  });

  it('enforces @RequirePermissions without @UseGuards on the controller', async () => {
    const token = await loginAs(reader.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/guardless/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows the holder of the required permission through', async () => {
    const token = await loginAs(writer.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/guardless/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('leaves a route with no @RequirePermissions to authentication alone', async () => {
    const token = await loginAs(reader.email);
    const res = await request(app.getHttpServer())
      .get('/api/v1/guardless/unannotated')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('leaves @Public() routes reachable with no credentials', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/guardless/open');
    expect(res.status).toBe(200);
  });
});
