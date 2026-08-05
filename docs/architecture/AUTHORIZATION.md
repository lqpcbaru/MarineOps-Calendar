# §7 — Authorization Strategy: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Authorised by:** ADR-0011

> Supersedes the MarineOps Calendar v1.0.0 authorization narrative for the active scope.

---

## 1. Core principle: two authorization audiences

MarineOps Hub has exactly **two authorization audiences**, and the boundary between them is enforced at the API routing layer:

| Audience            | Surface         | Capability                    | Mechanism                                                            |
| ------------------- | --------------- | ----------------------------- | -------------------------------------------------------------------- |
| Anonymous           | `/api/public/*` | `public.read` only (implicit) | `@Public()` decorator; controllers may only call read-side use-cases |
| Authenticated admin | `/api/v1/*`     | Role-based permission codes   | JWT + RBAC (guards + use-case-level checks)                          |

There is **no overlap**: an anonymous caller can never reach an admin endpoint, and an admin caller authenticates only to use `/api/v1`. The Admin Portal may also read `/api/public/*` data when it needs the public read shape, but admin write actions always go through `/api/v1`.

---

## 2. Authorization is server-side authoritative

Per ENGINEERING_STANDARDS §3.4 and ADR-0010 §5, **RBAC is enforced at the application layer**, not only at the controller or UI layer:

1. **Controller guard** — `PermissionsGuard` checks `@RequirePermissions(...)` as a first filter.
2. **Use-case entry** — `AuthorizeUseCase.requireAll/requireAny` is invoked inside the use-case as the authoritative check. This survives any controller misconfiguration.
3. **UI hiding** — the Admin Portal hides actions the principal lacks permission for, but this is **never** the only control.

A controller that forgets the guard still cannot grant access, because the use-case itself enforces the permission.

---

## 3. Anonymous capability (`public.read`)

- Anonymous callers to `/api/public/*` are granted an implicit `public.read` capability by virtue of the route being public. There is no anonymous principal object.
- Public controllers are **physically separated** under `src/api/public/` and decorated `@Public()`. A CI lint rule forbids:
  - `@Public()` on any controller outside `src/api/public/`.
  - Importing a command/write use-case from any file under `src/api/public/`.
- Public responses must contain **no PII** and no admin-only fields. DTOs for public endpoints are a strict subset of admin DTOs (projected at the application layer, never at the controller).

---

## 4. Permission catalog (admin surface)

Permission codes are stable strings. The catalog is owned by the Roles module and seeded at deploy time. Initial catalog:

| Code              | Description                           |
| ----------------- | ------------------------------------- |
| `user.manage`     | Manage users                          |
| `role.manage`     | Manage roles & permissions            |
| `station.read`    | View stations (admin context)         |
| `station.write`   | Create/update/archive stations        |
| `calendar.read`   | View calendar (admin context)         |
| `calendar.write`  | Create/update/delete calendar entries |
| `alert.read`      | View alerts (admin context)           |
| `alert.write`     | Create/update/publish alerts          |
| `dashboard.read`  | View admin dashboard                  |
| `audit.read`      | Read audit trail                      |
| `settings.read`   | View settings                         |
| `settings.write`  | Manage settings                       |
| `admin.reference` | Manage reference data                 |

### Future (when modules land — each gated by its own ADR)

| Code                                                     | Description       |
| -------------------------------------------------------- | ----------------- |
| `patrolplan.read` / `.write` / `.assign` / `.transition` | Patrol Planner    |
| `ais.read`                                               | AIS feed          |
| `vms.read`                                               | VMS feed          |
| `vessel.monitor`                                         | Vessel monitoring |

---

## 5. Roles

Roles are named sets of permission codes, owned by the Roles module. Initial seed roles:

| Role                  | Permission codes                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `Admin`               | All codes (full admin)                                                                       |
| `FisheriesOfficer`    | `station.read`, `calendar.read`, `alert.read`, `alert.write`, `dashboard.read`, `audit.read` |
| `Auditor` (read-only) | `*.read` subset, `audit.read`                                                                |

Only `Admin` and `FisheriesOfficer` roles may log in. An `Auditor` role may be granted login in a future revision if read-only admin access is needed; record in an ADR.

---

## 6. Enforcement points (inbound request lifecycle)

```
HTTP request
   │
   ▼
JwtAuthGuard (global APP_GUARD)
   │  - /api/public/*  → @Public → skip
   │  - /api/v1/auth/login|refresh → @Public → skip
   │  - else → verify Bearer JWT → attach AuthPrincipal
   ▼
PermissionsGuard (per-route @RequirePermissions)
   │  - require all listed codes
   ▼
Controller → Use-case
   │
   ▼
AuthorizeUseCase.requireAll/requireAny  ← AUTHORITATIVE
   │  - throws ForbiddenError on denial
   ▼
Domain logic executes
```

- `ForbiddenError` and `UnauthorizedError` are mapped by `DomainExceptionFilter` to HTTP 403/401 with the stable error envelope (§5).
- Audit events are emitted for denied sensitive actions (e.g. failed access to `audit.read`) when the Audit module lands.

---

## 7. Resource-level authorization

Some permissions are resource-scoped (e.g. a fisheries officer may manage alerts only for their assigned stations). Resource-level rules live in the application layer as policy objects, not in controllers. Initial v2.0.0 scope is **organization-wide** (single org); station-scoped roles are a future enhancement recorded as an open question.

---

## 8. Public vs admin DTO projection

To prevent accidental data leakage to the public surface:

- Every module that serves both surfaces defines a **public read DTO** and an **admin read DTO**.
- The public DTO is a strict subset (no PII, no admin metadata, no internal IDs that aren't meant to be public).
- The public controller calls a `*PublicQuery` use-case that returns the public DTO directly; it never receives the admin DTO and strips fields.

This is enforced by type, not by convention — the public controller literally cannot import the admin DTO type.

---

## 9. Change log

| Version | Date       | Notes                                                                        |
| ------- | ---------- | ---------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Two-audience authorization: anonymous `public.read` vs admin RBAC (ADR-0011) |
