import { Module, Global } from '@nestjs/common';
import { RecordAuditUseCase } from '../application/record-audit.use-case';
import { GetAuditUseCase } from '../application/get-audit.use-case';
import { PrismaAuditRepository } from '../infrastructure/prisma-audit.repository';
import { AUDIT_REPOSITORY } from '../application/di-tokens';

@Global()
@Module({
  providers: [
    RecordAuditUseCase,
    GetAuditUseCase,
    { provide: AUDIT_REPOSITORY, useClass: PrismaAuditRepository },
  ],
  exports: [RecordAuditUseCase, GetAuditUseCase, AUDIT_REPOSITORY],
})
export class AuditModule {}
