import { apiRequest, buildQuery } from '../../shared/api/http';

/** Mirrors the response built by audit.controller.ts. */
export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown> | null;
  at: string;
}

export interface AuditListResult {
  data: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAuditParams {
  page?: number;
  pageSize?: number;
  entityType?: string;
  action?: string;
  actorId?: string;
}

/**
 * GET /api/v1/audit. `from`/`to` are also supported by listAuditQuerySchema
 * but require full ISO datetimes; they are omitted here until the UI offers
 * a proper range picker rather than sending a guessable partial value.
 */
export function listAudit(params: ListAuditParams = {}): Promise<AuditListResult> {
  const qs = buildQuery({
    page: params.page,
    pageSize: params.pageSize,
    entityType: params.entityType,
    action: params.action,
    actorId: params.actorId,
  });
  return apiRequest<AuditListResult>(`/api/v1/audit${qs}`, {
    fallbackMessage: 'Gagal mendapatkan jejak audit',
  });
}
