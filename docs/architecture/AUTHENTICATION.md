# §6 — Authentication Strategy: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Authorised by:** ADR-0011 (carries ADR-0010 mechanics forward for the admin surface)

> Supersedes the MarineOps Calendar v1.0.0 authentication narrative for the active scope. The Calendar version is preserved at `archive/calendar/decisions/ADR-0010-authentication-jwt-strategy.md`.

---

## 1. Core principle: authentication is admin-only

In MarineOps Hub, **authentication is only for administrators and fisheries officers**. The Public Portal has **no login, no sessions, no tokens**. This is a deliberate reduction of the attack surface:

- The Public Portal ships **zero auth code** — no token storage, no login form, no XSS token-exfiltration risk.
- Anonymous visitors hit `/api/public/*`, which never requires or returns credentials.
- Only the Admin Portal authenticates, and only admin/officer roles may hold an account.

This is the single biggest authentication difference from the Calendar v1.0.0 baseline (where every operational user authenticated).

---

## 2. Token model (admin surface only)

Retained from ADR-0010, unchanged in mechanics:

| Token   | Type                                | TTL        | Delivery                                                           | Storage                                     |
| ------- | ----------------------------------- | ---------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Access  | JWT (HS256)                         | 15 minutes | Response body                                                      | Frontend memory only (never `localStorage`) |
| Refresh | Opaque random (48 bytes, base64url) | 7 days     | `httpOnly` + `Secure` + `SameSite=Lax` cookie, path `/api/v1/auth` | `refresh_token` table — **hash** only       |

- Access token sent as `Authorization: Bearer <token>` on every `/api/v1` request.
- Refresh token never sent via JSON body by default; the cookie is the source. (A body fallback exists for non-browser tooling but is discouraged.)
- **Refresh rotation:** every refresh issues a new refresh token and revokes the old one. Reuse of a revoked token invalidates the entire token family (theft signal).
- **Logout:** client clears access token from memory; server clears the refresh cookie and revokes the token. Access token expires naturally within 15 min.

---

## 3. Password storage

- **argon2id** (preferred) per ADR-0010 §3. bcrypt (cost ≥ 12) is an acceptable fallback only if argon2 is unavailable in a target environment; record the choice in an ADR.
- Plaintext or reversible-encrypted passwords are forbidden.

---

## 4. Refresh token storage

- `refresh_token` table: `id, userId, tokenHash, familyId, expiresAt, revokedAt, replacedBy, createdAt`.
- The **hash** of the refresh token is stored (SHA-256), never the raw token — mirroring password-storage discipline.
- `familyId` groups a rotation chain; reuse detection revokes the whole family.
- Owned by the Authentication module (§9).

---

## 5. Identity provider abstraction

The `UserIdentityProvider` port (in `authentication/application/ports/`) abstracts where admin/officer identity comes from:

- Today: local Postgres-backed `users` + `roles` tables (owned by the Users module; Authentication only reads them via the port).
- Future: external OIDC IdP (ADR-0010 §6). Swapping requires only a new `infrastructure/` implementation — domain and application layers stay unchanged.

Login is rejected if the user record's `status` is not `ACTIVE` or if the user has no admin/officer role.

---

## 6. Endpoints (admin surface)

| Method | Path                   | Auth                         | Purpose                                      |
| ------ | ---------------------- | ---------------------------- | -------------------------------------------- |
| POST   | `/api/v1/auth/login`   | Public (login only)          | Verify credentials → issue access + refresh  |
| POST   | `/api/v1/auth/refresh` | Public (uses refresh cookie) | Rotate refresh token; issue new access token |
| POST   | `/api/v1/auth/logout`  | Bearer access token          | Revoke refresh token; clear cookie           |
| GET    | `/api/v1/auth/me`      | Bearer access token          | Return current principal                     |

Only these four endpoints on `/api/v1` are public; every other `/api/v1` route requires a valid access token.

---

## 7. Guards & middleware

- **Global `JwtAuthGuard`** is registered as `APP_GUARD`. It:
  - Skips routes/controllers marked `@Public()`.
  - Skips the entire `/api/public` surface (enforced by controller location + decorator).
  - For all other `/api/v1` routes, verifies the Bearer token and attaches `AuthPrincipal` to the request.
- **Cookie-parser** middleware is registered at bootstrap so the refresh cookie is readable.
- **`DomainExceptionFilter`** maps `DomainError` subclasses (e.g. `InvalidCredentialsError`, `RefreshTokenReusedError`) to stable HTTP status codes and the consistent error envelope (§5).

---

## 8. What the Public Portal must NOT do (binding)

- Never call `/api/v1/*` (build-time lint rule).
- Never store or send a token or cookie.
- Never render login UI.
- Never include admin-only components from `packages/ui`.

Any authentication failure logged on `/api/public/*` is a **misconfiguration alert** — public routes are anonymous by design.

---

## 9. Future: MFA & OIDC

- **MFA** for privileged admin roles is a Phase 3 candidate; not in scope for v2.0.0.
- **External OIDC IdP** is supported architecturally by the `UserIdentityProvider` port. Adoption requires a new ADR and a new `infrastructure/` implementation only.

---

## 10. Change log

| Version | Date       | Notes                                                                                                               |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Admin-only authentication; public portal has no auth (ADR-0011). ADR-0010 mechanics retained for the admin surface. |
