import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { Prisma } from '@prisma/client';
import type { AuditEvent, AuditEventParams } from '../domain';
import type { AuditRepository } from '../application/ports';

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: AuditEventParams): Promise<AuditEvent> {
    const row = await this.prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entityType,
        entityId: params.entityId,
        userId: params.actorId,
        changes: params.payload as Prisma.InputJsonValue | undefined,
      },
    });
    return this.map(row);
  }

  async findByEntity(params: { entityType: string; entityId: string }): Promise<AuditEvent[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entity: params.entityType, entityId: params.entityId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByActor(actorId: string, params: { page: number; pageSize: number }) {
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId: actorId },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: { userId: actorId } }),
    ]);
    return { events: rows.map((r) => this.map(r)), total };
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
    const where: Prisma.AuditLogWhereInput = {};
    if (params.entityType) where.entity = params.entityType;
    if (params.actorId) where.userId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { events: rows.map((r) => this.map(r)), total };
  }

  private map(row: {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string | null;
    changes: unknown;
    createdAt: Date;
  }): AuditEvent {
    return {
      id: row.id,
      actorId: row.userId,
      action: row.action,
      entityType: row.entity,
      entityId: row.entityId,
      payload: row.changes as Record<string, unknown> | null,
      at: row.createdAt,
    };
  }
}
