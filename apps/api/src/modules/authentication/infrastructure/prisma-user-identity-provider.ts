import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { AuthPrincipal } from '../domain';
import type {
  UserAuthRecord,
  UserIdentityProvider,
} from '../application/ports/user-identity-provider.port';

/**
 * Local Postgres-backed identity provider (ADR-0010 §6).
 *
 * Reads from the Users module's tables (users, roles, user_roles). The Users
 * module owns those tables; Authentication reads them through this port so it
 * can be swapped for an OIDC IdP in a later phase without touching use-cases.
 */
@Injectable()
export class PrismaUserIdentityProvider implements UserIdentityProvider {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.map(user) : null;
  }

  async findById(id: string): Promise<UserAuthRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.map(user) : null;
  }

  toPrincipal(user: UserAuthRecord): AuthPrincipal {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissionCodes: user.permissionCodes,
    };
  }

  private map(user: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    status: string;
    roles: Array<{ role: { name: string; permissionCodes: string[] } }>;
  }): UserAuthRecord {
    const roles = user.roles.map((r) => r.role.name);
    const permissionCodes = Array.from(new Set(user.roles.flatMap((r) => r.role.permissionCodes)));
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      status: user.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
      roles,
      permissionCodes,
    };
  }
}
