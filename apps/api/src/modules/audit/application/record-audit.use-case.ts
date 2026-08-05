import { Inject, Injectable } from '@nestjs/common';
import type { AuditEventParams } from '../domain';
import type { AuditRepository } from './ports';
import { AUDIT_REPOSITORY } from './di-tokens';

@Injectable()
export class RecordAuditUseCase {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepo: AuditRepository) {}

  async execute(params: AuditEventParams): Promise<void> {
    await this.auditRepo.record(params);
  }
}
