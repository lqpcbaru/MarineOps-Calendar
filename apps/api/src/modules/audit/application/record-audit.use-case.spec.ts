import { describe, expect, it, vi } from 'vitest';
import { RecordAuditUseCase } from './record-audit.use-case';
import { InMemoryAuditRepository } from './test-doubles';
import type { AuditRepository } from './ports';

describe('RecordAuditUseCase', () => {
  it('records an audit event', async () => {
    const repo = new InMemoryAuditRepository();
    const useCase = new RecordAuditUseCase(repo);

    await useCase.execute({
      actorId: 'user-1',
      action: 'user.create',
      entityType: 'user',
      entityId: 'user-2',
      payload: { name: 'New User' },
    });

    expect(repo.events).toHaveLength(1);
    expect(repo.events[0]!.action).toBe('user.create');
    expect(repo.events[0]!.entityType).toBe('user');
    expect(repo.events[0]!.payload).toEqual({ name: 'New User' });
  });

  it('swallows a repository failure instead of throwing', async () => {
    // The caller's primary mutation has already committed by the time this
    // runs (no shared transaction — see the audit-integrity review). If we
    // let this throw, an already-successful request would surface as a 500.
    const failingRepo: AuditRepository = {
      record: vi.fn().mockRejectedValue(new Error('db unavailable')),
      findByEntity: vi.fn(),
      findByActor: vi.fn(),
      findAll: vi.fn(),
    };
    const useCase = new RecordAuditUseCase(failingRepo);

    await expect(
      useCase.execute({
        actorId: 'user-1',
        action: 'user.create',
        entityType: 'user',
        entityId: 'user-2',
      }),
    ).resolves.toBeUndefined();

    expect(failingRepo.record).toHaveBeenCalledTimes(1);
  });
});
