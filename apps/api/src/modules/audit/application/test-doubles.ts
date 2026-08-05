import type { AuditEvent, AuditEventParams } from '../domain';
import type { AuditRepository } from '../application/ports';

export class InMemoryAuditRepository implements AuditRepository {
  readonly events: AuditEvent[] = [];
  private counter = 0;

  async record(params: AuditEventParams): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit-${++this.counter}`,
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload ?? null,
      at: new Date(),
    };
    this.events.push(event);
    return event;
  }

  async findByEntity(params: { entityType: string; entityId: string }): Promise<AuditEvent[]> {
    return this.events.filter(
      (e) => e.entityType === params.entityType && e.entityId === params.entityId,
    );
  }

  async findByActor(actorId: string, params: { page: number; pageSize: number }) {
    const filtered = this.events.filter((e) => e.actorId === actorId);
    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    return { events: filtered.slice(start, start + params.pageSize), total };
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    entityType?: string;
    actorId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  }) {
    let filtered = this.events;
    if (params.entityType) filtered = filtered.filter((e) => e.entityType === params.entityType);
    if (params.actorId) filtered = filtered.filter((e) => e.actorId === params.actorId);
    if (params.action) filtered = filtered.filter((e) => e.action === params.action);
    if (params.from) filtered = filtered.filter((e) => e.at >= params.from!);
    if (params.to) filtered = filtered.filter((e) => e.at <= params.to!);
    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    return { events: filtered.slice(start, start + params.pageSize), total };
  }
}
