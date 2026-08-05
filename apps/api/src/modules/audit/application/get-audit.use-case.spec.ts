import { describe, expect, it } from 'vitest';
import { GetAuditUseCase } from './get-audit.use-case';
import { InMemoryAuditRepository } from './test-doubles';

describe('GetAuditUseCase', () => {
  it('lists audit events with pagination', async () => {
    const repo = new InMemoryAuditRepository();
    await repo.record({
      actorId: 'user-1',
      action: 'user.create',
      entityType: 'user',
      entityId: 'u1',
    });
    await repo.record({
      actorId: 'user-1',
      action: 'user.update',
      entityType: 'user',
      entityId: 'u1',
    });
    const useCase = new GetAuditUseCase(repo);

    const result = await useCase.list({ page: 1, pageSize: 10 });
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('filters by entityType', async () => {
    const repo = new InMemoryAuditRepository();
    await repo.record({
      actorId: 'user-1',
      action: 'user.create',
      entityType: 'user',
      entityId: 'u1',
    });
    await repo.record({
      actorId: 'user-1',
      action: 'role.create',
      entityType: 'role',
      entityId: 'r1',
    });
    const useCase = new GetAuditUseCase(repo);

    const result = await useCase.list({ page: 1, pageSize: 10, entityType: 'role' });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.entityType).toBe('role');
  });
});
