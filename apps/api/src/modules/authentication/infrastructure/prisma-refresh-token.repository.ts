import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import { RefreshToken, type RefreshTokenState } from '../domain';
import type { RefreshTokenRepository } from '../application/ports/refresh-token-repository.port';

/**
 * Prisma implementation of RefreshTokenRepository (ADR-0010 §4).
 * Stores only the token HASH; never the raw token.
 */
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(token: RefreshToken): Promise<void> {
    const state = token.toState();
    await this.prisma.refreshToken.upsert({
      where: { id: state.id },
      create: {
        id: state.id,
        userId: state.userId,
        tokenHash: state.tokenHash,
        familyId: state.familyId,
        expiresAt: state.expiresAt,
        revokedAt: state.revokedAt,
        replacedBy: state.replacedBy,
        createdAt: state.createdAt,
      },
      update: {
        revokedAt: state.revokedAt,
        replacedBy: state.replacedBy,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? RefreshToken.fromState(this.toState(row)) : null;
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { id } });
    return row ? RefreshToken.fromState(this.toState(row)) : null;
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
    return result.count;
  }

  async revokeIfActive(id: string, replacedBy: string, now: Date = new Date()): Promise<boolean> {
    // The `revokedAt: null` predicate makes this a single atomic
    // conditional UPDATE — Postgres guarantees only one concurrent
    // transaction can match a not-yet-revoked row, so at most one caller
    // ever gets count === 1 for the same token.
    const result = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now, replacedBy },
    });
    return result.count === 1;
  }

  async deleteExpired(userId: string, now: Date = new Date()): Promise<number> {
    // Scoped to one user and served by refresh_token_user_id_idx, so this
    // stays a small indexed delete rather than a table-wide sweep.
    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: now } },
    });
    return result.count;
  }

  private toState(row: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedBy: string | null;
    createdAt: Date;
  }): RefreshTokenState {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      familyId: row.familyId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedBy: row.replacedBy,
      createdAt: row.createdAt,
    };
  }
}
