import { describe, expect, it } from 'vitest';
import { HttpException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from './prisma.service';

function stubPrisma(queryRaw: () => Promise<unknown>): PrismaService {
  return { $queryRaw: queryRaw } as unknown as PrismaService;
}

describe('HealthController', () => {
  describe('liveness', () => {
    it('returns ok with uptime and version', () => {
      const ctrl = new HealthController(stubPrisma(async () => [{}]));
      const res = ctrl.liveness();
      expect(res.status).toBe('ok');
      expect(typeof res.uptime).toBe('number');
      expect(typeof res.version).toBe('string');
      expect(typeof res.timestamp).toBe('string');
    });
  });

  describe('readiness', () => {
    it('returns 200 database ok when the DB probe succeeds', async () => {
      const ctrl = new HealthController(stubPrisma(async () => [{ '?column?': 1 }]));
      const res = await ctrl.readiness();
      expect(res.status).toBe('ok');
      expect(res.checks.database).toBe('ok');
    });

    it('throws 503 with database error when the DB probe fails', async () => {
      const ctrl = new HealthController(
        stubPrisma(async () => {
          throw new Error('connection refused');
        }),
      );
      await expect(ctrl.readiness()).rejects.toBeInstanceOf(HttpException);
      await expect(ctrl.readiness()).rejects.toMatchObject({
        status: 503,
      });
    });

    it('does not expose the raw database error in the response', async () => {
      const ctrl = new HealthController(
        stubPrisma(async () => {
          throw new Error('password authentication failed for user "marineops"');
        }),
      );
      try {
        await ctrl.readiness();
        throw new Error('expected readiness to throw');
      } catch (err) {
        const e = err as HttpException;
        const body = e.getResponse() as Record<string, unknown>;
        const serialized = JSON.stringify(body);
        expect(serialized).not.toContain('password');
        expect(serialized).not.toContain('marineops');
        expect(body.checks).toEqual({ database: 'error' });
      }
    });

    it('does not fabricate cache/scheduler status', async () => {
      const ctrl = new HealthController(stubPrisma(async () => [{}]));
      const res = await ctrl.readiness();
      expect(res.checks).toEqual({ database: 'ok' });
      expect(res.checks).not.toHaveProperty('cache');
      expect(res.checks).not.toHaveProperty('scheduler');
    });
  });
});
