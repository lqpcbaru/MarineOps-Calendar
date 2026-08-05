import { Inject, Injectable } from '@nestjs/common';
import type { AuditRepository } from './ports';
import { AUDIT_REPOSITORY } from './di-tokens';
import type { ListAuditQuery } from './dtos';
import { listAuditQuerySchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class GetAuditUseCase {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepo: AuditRepository) {}

  async list(query: ListAuditQuery) {
    const valid = listAuditQuerySchema.safeParse(query);
    if (!valid.success) throw new ValidationError('Invalid query parameters');

    return this.auditRepo.findAll({
      page: valid.data.page,
      pageSize: valid.data.pageSize,
      entityType: valid.data.entityType,
      actorId: valid.data.actorId,
      action: valid.data.action,
      from: valid.data.from ? new Date(valid.data.from) : undefined,
      to: valid.data.to ? new Date(valid.data.to) : undefined,
    });
  }
}
