import { describe, expect, it } from 'vitest';
import { ArchiveStationUseCase } from './archive-station.use-case';
import type { StationRepository } from './ports';
import type { StationEventBus, StationDomainEvent } from '../domain';
import type { StationRecord } from '../domain';
import { StationNotFoundError } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

describe('ArchiveStationUseCase', () => {
  it('archives a station, emits StationArchived, and records the audit entry', async () => {
    const byId = new Map<string, StationRecord>();
    byId.set('st-1', {
      id: 'st-1',
      code: 'PKG-01',
      name: 'Test',
      latitude: 1,
      longitude: 1,
      timezone: 'UTC',
      regionId: null,
      status: 'ACTIVE',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const events: unknown[] = [];
    const repo: StationRepository = {
      findById: async (id) => byId.get(id) ?? null,
      findByIdAdmin: async (id) => byId.get(id) ?? null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => {
        throw new Error('not used');
      },
      update: async () => {
        throw new Error('not used');
      },
      archive: async (id) => {
        const r = byId.get(id)!;
        r.status = 'ARCHIVED';
        return r;
      },
    };
    const bus: StationEventBus = {
      async publish(e: StationDomainEvent) {
        events.push(e);
      },
    };
    const auditRepo = new InMemoryAuditRepository();

    const useCase = new ArchiveStationUseCase(repo, bus, new RecordAuditUseCase(auditRepo));
    const result = await useCase.execute('st-1', 'user-1');
    expect(result.status).toBe('ARCHIVED');
    expect(events).toHaveLength(1);
    expect((events[0] as { type: string }).type).toBe('StationArchived');
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-1',
      action: 'station.archive',
      entityType: 'station',
      entityId: 'st-1',
    });
  });

  it('throws when station not found', async () => {
    const repo: StationRepository = {
      findById: async () => null,
      findByIdAdmin: async () => null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => {
        throw new Error('not used');
      },
      update: async () => {
        throw new Error('not used');
      },
      archive: async () => {
        throw new Error('not used');
      },
    };
    const bus: StationEventBus = { async publish() {} };
    const useCase = new ArchiveStationUseCase(
      repo,
      bus,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );
    await expect(useCase.execute('nonexistent')).rejects.toBeInstanceOf(StationNotFoundError);
  });
});
