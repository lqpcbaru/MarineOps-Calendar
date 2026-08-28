import type { Clock } from './clock';
import type {
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
  UserIdentityProvider,
  UserAuthRecord,
} from './ports';
import type {
  AccessToken,
  AuthPrincipal,
  IssuedRefreshToken,
  RefreshToken,
  DomainEventBus,
  AuthenticationDomainEvent,
} from '../domain';

/** Fixed-date clock for deterministic tests. */
export class FixedClock implements Clock {
  constructor(private readonly date: Date) {}
  now(): Date {
    return this.date;
  }
}

/** In-memory refresh token repository. */
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly byId = new Map<string, RefreshToken>();
  private readonly byHash = new Map<string, RefreshToken>();

  async save(token: RefreshToken): Promise<void> {
    const state = token.toState();
    this.byId.set(state.id, token);
    this.byHash.set(state.tokenHash, token);
  }

  async findByHash(hash: string): Promise<RefreshToken | null> {
    return this.byHash.get(hash) ?? null;
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.byId.get(id) ?? null;
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<number> {
    let count = 0;
    for (const token of this.byId.values()) {
      if (token.familyId === familyId && !token.isRevoked()) {
        this.byId.set(token.id, token.revoke(now));
        this.byHash.set(token.tokenHash, token.revoke(now));
        count++;
      }
    }
    return count;
  }
}

/** Fake token service: deterministic tokens, SHA-256 hashes, real JWT-less verify. */
export class FakeTokenService implements TokenService {
  private counter = 0;
  private readonly accessSecret: string;
  readonly issuedAccess = new Map<string, AuthPrincipal>();
  readonly refreshHashes = new Map<string, string>();

  constructor(accessSecret = 'test-secret') {
    this.accessSecret = accessSecret;
  }

  async mintAccessToken(principal: AuthPrincipal): Promise<AccessToken> {
    const token = `access-${++this.counter}`;
    this.issuedAccess.set(token, principal);
    return {
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      ttlSeconds: 15 * 60,
    };
  }

  async verifyAccessToken(token: string): Promise<AuthPrincipal> {
    const principal = this.issuedAccess.get(token);
    if (!principal) throw new Error('Invalid access token');
    return principal;
  }

  async generateRefreshToken(userId: string, now: Date = new Date()): Promise<IssuedRefreshToken> {
    const rawToken = `refresh-${userId}-${++this.counter}`;
    const hash = await this.hashRefreshToken(rawToken);
    this.refreshHashes.set(rawToken, hash);
    return {
      rawToken,
      hash,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ttlSeconds: 7 * 24 * 60 * 60,
    };
  }

  async hashRefreshToken(rawToken: string): Promise<string> {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(rawToken).digest('hex');
  }

  refreshTokenTtlSeconds(): number {
    return 7 * 24 * 60 * 60;
  }
  accessTokenTtlSeconds(): number {
    return 15 * 60;
  }
}

/** Plaintext password hasher (tests only — never use in production). */
export class FakePasswordHasher implements PasswordHasher {
  verifyCallCount = 0;

  async hash(plaintext: string): Promise<string> {
    return `fake:${plaintext}`;
  }
  async verify(plaintext: string, encoded: string): Promise<boolean> {
    this.verifyCallCount += 1;
    return encoded === `fake:${plaintext}`;
  }
}

/** In-memory user identity provider. */
export class InMemoryUserIdentityProvider implements UserIdentityProvider {
  constructor(private readonly users: Map<string, UserAuthRecord>) {}

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    for (const u of this.users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }

  async findById(id: string): Promise<UserAuthRecord | null> {
    return this.users.get(id) ?? null;
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
}

/** Capturing event bus. */
export class CapturingEventBus implements DomainEventBus {
  readonly events: AuthenticationDomainEvent[] = [];
  async publish(event: AuthenticationDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

export function makeUserRecord(overrides: Partial<UserAuthRecord> = {}): UserAuthRecord {
  return {
    id: 'user-1',
    email: 'planner@marineops.local',
    name: 'Planner',
    passwordHash: 'fake:correct-horse-battery',
    status: 'ACTIVE',
    roles: ['Operations Planner'],
    permissionCodes: ['patrolplan.write', 'calendar.read'],
    ...overrides,
  };
}
