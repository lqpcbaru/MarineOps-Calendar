import type { AuditEvent, AuditEventParams } from '../../domain';

export interface AuditRepository {
  record(params: AuditEventParams): Promise<AuditEvent>;
  findByEntity(params: { entityType: string; entityId: string }): Promise<AuditEvent[]>;
  findByActor(
    actorId: string,
    params: { page: number; pageSize: number },
  ): Promise<{ events: AuditEvent[]; total: number }>;
  findAll(params: {
    page: number;
    pageSize: number;
    entityType?: string;
    actorId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ events: AuditEvent[]; total: number }>;
}
