import { describe, expect, it } from 'vitest';
import { RecordAuditUseCase } from './record-audit.use-case';
import { InMemoryAuditRepository } from './test-doubles';

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
});
