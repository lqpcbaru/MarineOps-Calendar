import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetAuditUseCase } from '../../modules/audit/application/get-audit.use-case';
import type { ListAuditQuery } from '../../modules/audit/application/dtos';
import { JwtAuthGuard } from '../../modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../modules/authentication/api/permissions.guard';

@Controller('v1/audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly getAudit: GetAuditUseCase) {}

  @Get()
  @RequirePermissions('audit.read')
  async list(@Query() query: ListAuditQuery) {
    const result = await this.getAudit.list(query);
    return {
      data: result.events.map((e) => ({
        id: e.id,
        actorId: e.actorId,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        payload: e.payload,
        at: e.at.toISOString(),
      })),
      total: result.total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }
}
