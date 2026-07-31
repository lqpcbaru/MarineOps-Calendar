# ADR-0010: Authentication strategy — JWT with refresh rotation

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Chief Software Architect

## Context

MarineOps Calendar requires authentication (the Authentication module is P0). The system is online-first, single-organization, SPA + API architecture. The PMD-0001 project scope specifies JWT as the authentication technology.

The SPA-to-API communication pattern and the need for stateless API scaling make JWT a natural fit. However, JWT introduces token-revocation and theft-mitigation concerns that must be addressed architecturally.

## Decision

### 1. Token model

- **Access token**: JWT, short TTL (15 minutes), signed with `JWT_ACCESS_SECRET`.  
- **Refresh token**: opaque random string (not JWT), long TTL (7 days), stored in `httpOnly` + `Secure` + `SameSite=Lax` cookie.  
- **Refresh rotation**: every refresh issues a new refresh token and invalidates the old one (detected reuse signals theft).  
- **Access token delivery**: returned in response body; frontend stores in memory (not localStorage) and sends as `Authorization: Bearer <token>`.

### 2. Logout

- Client clears access token from memory.  
- Server endpoint clears refresh cookie and blocklists the refresh token.  
- Access token expires naturally (15 min max exposure window).

### 3. Password storage

- **argon2id** (preferred) or **bcrypt** (cost ≥ 12) for password hashing.  
- Never store plaintext or reversible-encrypted passwords.

### 4. Session/refresh storage

- Refresh tokens stored in a `refresh_token` table: `id, userId, tokenHash, expiresAt, revokedAt, createdAt`.  
- Store **hash** of refresh token, not the token itself (same pattern as password storage).

### 5. Roles and permissions

- RBAC enforced at the **application layer** (use-case entry), not only at the API/controller layer.  
- Permission codes are stable strings (see Domain Model §7).  
- UI may hide actions but server-side authorization is always authoritative.

### 6. Future: OIDC

- The architecture supports swapping local auth for an external IdP (OIDC) in a later phase via a new ADR. The `application/` port abstracts the identity provider.

## Consequences

### Positive

- Stateless API — access tokens are self-validating via signature  
- Refresh rotation detects token theft (reuse of revoked refresh token invalidates the family)  
- httpOnly cookie prevents XSS-based refresh token exfiltration  
- Access token in memory (not localStorage) limits XSS damage  
- argon2id is the current OWASP-recommended password hash  

### Negative / trade-offs

- Access token revocation is not instant (15-minute window) — acceptable for this product  
- Refresh rotation requires a DB write on every refresh — acceptable volume for Phase 1  
- httpOnly cookie complicates Swagger/OpenAPI interactive testing — mitigated with a dev-mode bearer token override  
- CORS must allow credentials — configured explicitly per environment  

## Alternatives considered

| Option | Why not |
|--------|---------|
| JWT-only (no refresh token) | Long-lived JWT = long theft exposure; short-lived JWT = user re-logs constantly |
| Server-side sessions (DB lookup every request) | Adds DB hit on every API call; defeats stateless benefit |
| localStorage for both tokens | XSS can exfiltrate everything; httpOnly is safer for refresh |
| bcrypt only | argon2id is OWASP-recommended as of 2024+; bcrypt acceptable fallback |
| OIDC from day 1 | External IdP dependency slows local dev; no business requirement yet |

## References

- `docs/requirements/SRS.md` §3.1 (FR-AUTH-001 through 006)  
- `docs/architecture/SYSTEM_ARCHITECTURE.md` §9 (security architecture)  
- `docs/architecture/DOMAIN_MODEL.md` §7 (permission catalog)  
- `docs/governance/ENGINEERING_STANDARDS.md` §3 (RBAC on server), §10 (security minimum bar)  
- ADR-0009 (stack re-confirmation — JWT confirmed)