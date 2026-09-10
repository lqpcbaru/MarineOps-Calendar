import { Inject, Injectable } from '@nestjs/common';
import type { AuditEventParams } from '../domain';
import type { AuditRepository } from './ports';
import { AUDIT_REPOSITORY } from './di-tokens';
import { LoggingService } from '../../../platform/logging.service';

@Injectable()
export class RecordAuditUseCase {
  private readonly logger = new LoggingService('RecordAuditUseCase');

  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepo: AuditRepository) {}

  // Callers invoke this after their primary mutation has already committed
  // (no shared transaction spans the two — see the audit-integrity review).
  // Throwing here would surface a 500 for a request that actually succeeded,
  // which is worse for callers than a logged, discoverable audit gap.
  async execute(params: AuditEventParams): Promise<void> {
    try {
      await this.auditRepo.record(params);
    } catch (error) {
      this.logger.error(
        'Failed to record audit event — the underlying mutation already committed',
        error instanceof Error ? error : undefined,
        {
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
        },
      );
    }
  }
}
