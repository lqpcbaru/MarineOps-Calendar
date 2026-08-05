# Domain: Authentication

**Module:** Authentication  
**Phase:** 1 (Sprint 2)  
**Status:** Active  
**SRS:** §3.1 (FR-AUTH-001 .. FR-AUTH-005)  
**ADR:** [ADR-0010](../decisions/ADR-0010-authentication-jwt-strategy.md)  
**Domain model:** [§5.1](../architecture/DOMAIN_MODEL.md)

---

## 1. Scope & non-scope

### In scope

- Email + password login (FR-AUTH-001).
- JWT access token issuance (short TTL, response body).
- Opaque refresh token with rotation (FR-AUTH-004, FR-AUTH-005).
- Refresh token reuse detection → family invalidation (theft mitigation).
- Logout — revoke refresh token + clear httpOnly cookie (FR-AUTH-003).
- RBAC enforcement at the application layer (FR-AUTH-002, ADR-0010 §5).
- Password hashing with argon2id (NFR-SEC-003).
- Disabled users cannot authenticate (FR-USR-003).

### Out of scope (later sprints)

- Password reset / invite flow (FR-AUTH-006).
- Optional MFA (FR-AUTH-007).
- External OIDC IdP (ADR-0010 §6 — the port abstracts it; no implementation yet).
- Full Users CRUD (Users module owns User/Role tables; Authentication only reads them).

---

## 2. Aggregates & invariants

### RefreshToken (root)

Fields: `id, userId, tokenHash, familyId, expiresAt, revokedAt, replacedBy, createdAt`.

Invariants (DOMAIN_MODEL §5.1, ADR-0010 §1/§4):

- Only the **hash** of the refresh token is persisted — never the raw token.
- A revoked token cannot be used to refresh.
- A token that has been replaced cannot be used to refresh.
- Reuse of a revoked/replaced token **invalidates the entire family** (`familyId`).
- `familyId` is preserved across rotation so the chain stays traceable.

### Value objects

- `AccessToken` — JWT, `token`, `expiresAt`, `ttlSeconds`.
- `IssuedRefreshToken` — `rawToken` (handed to client once), `hash`, `expiresAt`, `ttlSeconds`.
- `TokenPair` — combined access + refresh issuance.
- `AuthPrincipal` — `userId, email, name, roles, permissionCodes`; carried through the application layer for RBAC.

### Status model (access token freshness)

- Access token is self-validating via signature; no server-side revocation list (15-min max exposure window, ADR-0010 §2).
- Refresh token freshness = `now < expiresAt`.

---

## 3. Use-cases (map to SRS IDs)

| Use-case           | SRS ID                   | Description                                                                                            |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `LoginUseCase`     | FR-AUTH-001              | Verify credentials → mint access + refresh → persist hash → emit `UserLoggedIn`.                       |
| `RefreshUseCase`   | FR-AUTH-004, FR-AUTH-005 | Rotate refresh token; detect reuse → revoke family; emit `RefreshTokenRotated` / `RefreshTokenReused`. |
| `LogoutUseCase`    | FR-AUTH-003              | Revoke presented refresh token; idempotent; emit `UserLoggedOut`.                                      |
| `AuthorizeUseCase` | FR-AUTH-002              | RBAC check at use-case entry (`requireAll` / `requireAny`).                                            |

---

## 4. Published ports (inbound/outbound)

### Outbound (implemented by infrastructure)

- `UserIdentityProvider` — `findByEmail`, `findById`, `toPrincipal`. (ADR-0010 §6 — swappable for OIDC.)
- `TokenService` — `mintAccessToken`, `verifyAccessToken`, `generateRefreshToken`, `hashRefreshToken`.
- `RefreshTokenRepository` — `save`, `findByHash`, `findById`, `revokeFamily`.
- `PasswordHasher` — `hash`, `verify` (argon2id).
- `DomainEventBus` — `publish`.

### Inbound (consumed by other modules)

- `TokenService.verifyAccessToken` — used by `JwtAuthGuard` to populate `AuthPrincipal` on the request for all protected routes.
- `AuthPrincipal` (via `@CurrentPrincipal()`) — read by any module's controllers/use-cases for RBAC.
- `AuthorizeUseCase` — any module can inject it for permission checks.

---

## 5. Events emitted / consumed

### Emitted

| Event                 | When                                   | Consumers (planned)                     |
| --------------------- | -------------------------------------- | --------------------------------------- |
| `UserLoggedIn`        | Successful login                       | Audit                                   |
| `RefreshTokenRotated` | Successful refresh                     | Audit                                   |
| `RefreshTokenReused`  | Revoked token replayed → family burned | Audit, (Notifications — security alert) |
| `UserLoggedOut`       | Successful logout                      | Audit                                   |

### Consumed

- None yet. (When Users module emits `UserDisabled`, Auth will rely on the identity provider returning `DISABLED` status at next login/refresh — already handled.)

---

## 6. Permissions

Authentication itself does not require a permission to log in (login is public). The `AuthorizeUseCase` and `PermissionsGuard` enforce arbitrary permission codes for other modules. Permission catalog is defined in [DOMAIN_MODEL §8](../architecture/DOMAIN_MODEL.md).

---

## 7. Persistence notes

### Owned by Authentication

- `refresh_token` table (Prisma `RefreshToken` model). Schema per ADR-0010 §4.
  - Indexes: unique `token_hash`, index `user_id`, index `family_id`.
  - FK `user_id → users.id` (cascade on delete).

### Read by Authentication, owned by Users module

- `users`, `roles`, `user_roles` tables (Prisma `User`, `Role`, `UserRole` models).
- Added in Sprint 2 because Authentication lands before Users; the Users module will own full CRUD in a later sprint.

### Secrets

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` loaded from env (never committed).
- API keys never appear in domain/application layers (ADR-0008 §3, ADR-0010).

---

## 8. API endpoints

| Method | Path                   | Auth                         | SRS                      |
| ------ | ---------------------- | ---------------------------- | ------------------------ |
| POST   | `/api/v1/auth/login`   | Public                       | FR-AUTH-001              |
| POST   | `/api/v1/auth/refresh` | Public (uses refresh cookie) | FR-AUTH-004, FR-AUTH-005 |
| POST   | `/api/v1/auth/logout`  | Bearer access token          | FR-AUTH-003              |
| GET    | `/api/v1/auth/me`      | Bearer access token          | Helper                   |

Refresh token is delivered/set via an `httpOnly` + `Secure` (non-local) + `SameSite=Lax` cookie scoped to `/api/v1/auth`.

---

## 9. Configuration

| Env var                  | Default     | Purpose                                                       |
| ------------------------ | ----------- | ------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`      | `change-me` | HS256 signing secret for access JWTs.                         |
| `JWT_REFRESH_SECRET`     | `change-me` | Reserved for future refresh-token signing (currently opaque). |
| `JWT_ACCESS_TTL_MINUTES` | `15`        | Access token TTL.                                             |
| `JWT_REFRESH_TTL_DAYS`   | `7`         | Refresh token TTL.                                            |

---

## 10. Open questions

- When the Notifications module lands (Phase 2), subscribe to `RefreshTokenReused` for a security alert to admins.
- When OIDC is introduced (ADR-0010 §6), implement `UserIdentityProvider` against the IdP; local user tables may become a mirror only.
