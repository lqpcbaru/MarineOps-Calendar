export interface AuditEvent {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown> | null;
  at: Date;
}

export interface AuditEventParams {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown> | null;
}
