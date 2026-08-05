# MarineOps Hub — Architecture Baseline (Frozen v2.0.0)

**Project:** MarineOps Hub  
**Date:** 2026-07-31  
**Author:** Lead Software Architect  
**Baseline status:** **FROZEN v2.0.0**  
**Authorised by:** ADR-0011 (Accepted 2026-07-31)

---

## Scope of this baseline

Establish the MarineOps Hub architecture and specification documentation: a **two-portal** platform (Public Portal no-login + Admin Portal login) over a **shared NestJS backend**, replacing the MarineOps Calendar v1.0.0 single-app baseline. Documentation only — no implementation in this baseline.

## Decisions

| Decision                                                         | Vehicle                        | Status   |
| ---------------------------------------------------------------- | ------------------------------ | -------- |
| Calendar v1.0.0 archived; Hub active                             | ADR-0011                       | Accepted |
| Two-portal topology over shared backend                          | ADR-0011 §4                    | Accepted |
| Dedicated public API surface (`/api/public`) + admin (`/api/v1`) | ADR-0011 §5, §5 API Versioning | Accepted |
| Authentication is admin-only (public has no auth)                | ADR-0011 §6, §6 Authentication | Accepted |
| ADR-0009 stack re-confirmed (no stack change)                    | ADR-0009                       | Retained |
| ADR-0010 JWT mechanics retained for admin surface                | ADR-0011 §6                    | Accepted |
| Governance carried forward unchanged                             | ADR-0011 §2                    | Retained |

## Deliverables (documentation only)

| File                                       | Section                                     | Status          |
| ------------------------------------------ | ------------------------------------------- | --------------- |
| `docs/README.md`                           | Hub index                                   | Done            |
| `docs/decisions/ADR-0011-...md`            | Direction change ADR                        | Done (Accepted) |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | §1 Overall Architecture                     | Done            |
| `docs/structure/FOLDER_STRUCTURE.md`       | §2 Folder Structure                         | Done            |
| `docs/architecture/MODULE_DEPENDENCY.md`   | §3 Module Dependency + §4 Domain Boundaries | Done            |
| `docs/architecture/API_VERSIONING.md`      | §5 API Versioning                           | Done            |
| `docs/architecture/AUTHENTICATION.md`      | §6 Authentication                           | Done            |
| `docs/architecture/AUTHORIZATION.md`       | §7 Authorization                            | Done            |
| `docs/architecture/ROUTES.md`              | §8 Public vs Private Routes                 | Done            |
| `docs/architecture/DATABASE_OWNERSHIP.md`  | §9 Database Ownership                       | Done            |
| `docs/governance/DEVELOPMENT_RULES.md`     | §10 Development Rules (Hub-specific)        | Done            |
| `docs/requirements/SRS.md`                 | Software Requirements Specification         | Done            |
| `docs/data/ERD.md`                         | Entity Relationship Diagram + table specs   | Done            |
| `docs/api/OPENAPI.md`                      | API Contract (OpenAPI 3.1)                  | Done            |
| `docs/api/SEQUENCE_DIAGRAMS.md`            | Sequence diagrams (critical flows)          | Done            |
| `docs/architecture/DEPLOYMENT.md`          | Deployment diagram + environments           | Done            |

## What was NOT produced (by design)

- No application code (documentation-only task).
- No archive move of `docs/` → `archive/calendar/` (mechanical step to run at implementation kickoff).
- No ADRs for future modules (Patrol Planner, AIS, VMS, Vessel Monitoring) — each gated by its own future ADR.

## Next steps (implementation kickoff)

1. Mechanically move current Calendar v1.0.0 `docs/` content into `archive/calendar/`.
2. Author the Hub SRS (module-level functional requirements) — included in this baseline.
3. Re-map any in-flight Calendar implementation work to Hub modules.
4. Begin Phase 1 implementation against the frozen Hub v2.0.0 baseline.

---

# Sprint 0 — Completion Certificate

**Project:** MarineOps Calendar  
**Date:** 2026-07-31  
**Author:** Chief Software Architect  
**Sprint status:** **COMPLETE**  
**Authorised by:** PMD-0001 (Project Direction Change)

---

## Scope

Establish a new Sprint 0 baseline for MarineOps Calendar per PMD-0001. Archive the previous MarineOps Enforcement project. Create all engineering documentation, architectural decisions, and repository skeleton so Phase 1 implementation can begin with zero ambiguity.

---

## Deliverables

### Documentation (18 files in `docs/`)

| File                                                         | Status                                   |
| ------------------------------------------------------------ | ---------------------------------------- |
| `docs/README.md`                                             | Done — new index for Calendar            |
| `docs/vision/PRODUCT_VISION.md`                              | Done — new vision (v1.0.0)               |
| `docs/requirements/SRS.md`                                   | Done — new SRS, 17 modules (v1.0.0)      |
| `docs/architecture/SYSTEM_ARCHITECTURE.md`                   | Done — new architecture (v1.0.0)         |
| `docs/architecture/DOMAIN_MODEL.md`                          | Done — new domain model (v1.0.0)         |
| `docs/structure/FOLDER_STRUCTURE.md`                         | Done — new layout (v1.0.0)               |
| `docs/roadmap/ROADMAP.md`                                    | Done — new roadmap (v1.0.0)              |
| `docs/governance/ENGINEERING_STANDARDS.md`                   | Done — carried forward unchanged         |
| `docs/governance/DEFINITION_OF_DONE.md`                      | Done — carried forward unchanged         |
| `docs/domains/README.md`                                     | Done — new index for 17 Calendar modules |
| `docs/decisions/README.md`                                   | Done — new ADR index                     |
| `docs/decisions/ADR-0000-template.md`                        | Done — carried forward                   |
| `docs/decisions/ADR-0006-project-direction-change.md`        | Done — PMD-0001 recorded                 |
| `docs/decisions/ADR-0007-modular-monolith-for-calendar.md`   | Done                                     |
| `docs/decisions/ADR-0008-calendar-data-source-strategy.md`   | Done — external data adapter pattern     |
| `docs/decisions/ADR-0009-technology-stack-reconfirmation.md` | Done — stack re-confirmed                |
| `docs/decisions/ADR-0010-authentication-jwt-strategy.md`     | Done — JWT + refresh rotation            |
| `docs/PROJECT_STATE.md`                                      | Done — this file                         |

### Archive

| Path                   | Status                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `archive/enforcement/` | Done — previous MarineOps Enforcement docs preserved unmodified |

### Architecture Decisions (5 new ADRs)

| ADR  | Decision                                   | Impact                                           |
| ---- | ------------------------------------------ | ------------------------------------------------ |
| 0006 | Project direction change (PMD-0001)        | Authorises new baseline; archives Enforcement    |
| 0007 | Modular monolith for Calendar              | Architecture style                               |
| 0008 | External data source strategy              | Adapter pattern + caching + stale fallback       |
| 0009 | Technology stack re-confirmation           | NestJS/Prisma/PostgreSQL/React/Tailwind/JWT/pnpm |
| 0010 | Authentication — JWT with refresh rotation | Security architecture                            |

---

## Phase 0 exit criteria — verified

| Criterion                                               | Status |
| ------------------------------------------------------- | ------ |
| Product vision complete                                 | Met    |
| SRS complete (17 modules, P0/P1/P2 + NFRs)              | Met    |
| System architecture complete (layers, modules, flows)   | Met    |
| Domain model complete (aggregates, events, permissions) | Met    |
| Folder structure complete (binding layout)              | Met    |
| Engineering standards & DoD carried forward             | Met    |
| ADRs complete (5 new: 0006–0010)                        | Met    |
| Stack re-confirmed (ADR-0009)                           | Met    |
| Data source strategy defined (ADR-0008)                 | Met    |
| Auth strategy defined (ADR-0010)                        | Met    |
| Previous project archived (PMD-0001)                    | Met    |
| Architecture frozen at v1.0.0                           | Met    |

---

## Architecture freeze status

| Artifact              | Version | State                                |
| --------------------- | ------- | ------------------------------------ |
| Product vision        | 1.0.0   | Baseline (frozen)                    |
| SRS                   | 1.0.0   | Baseline (frozen)                    |
| System architecture   | 1.0.0   | Baseline (frozen)                    |
| Domain model          | 1.0.0   | Baseline (frozen)                    |
| Folder structure      | 1.0.0   | Binding (frozen)                     |
| Engineering standards | 0.1.0   | Binding (carried forward, unchanged) |
| Definition of Done    | 0.1.0   | Binding (carried forward, unchanged) |

**Freeze declaration:** Architecture, domain model, SRS, and folder structure are **frozen at v1.0.0**. Breaking changes require a new ADR and Architect review per governance.

---

## Module list (17 modules — frozen)

| #   | Module          | Type                   | Phase |
| --- | --------------- | ---------------------- | ----- |
| 1   | Authentication  | Internal               | 1     |
| 2   | Users           | Internal               | 1     |
| 3   | Stations        | Internal               | 1     |
| 4   | Marine Calendar | Read projection        | 1     |
| 5   | Tide            | Sourced (external API) | 1     |
| 6   | Moon Phase      | Computable (local)     | 1     |
| 7   | Hijri Calendar  | Computable (local)     | 1     |
| 8   | Weather         | Sourced (external API) | 1     |
| 9   | Wind            | Sourced (external API) | 1     |
| 10  | Wave            | Sourced (external API) | 1     |
| 11  | Sunrise/Sunset  | Computable (local)     | 1     |
| 12  | Dashboard       | Read projection        | 1     |
| 13  | Patrol Planner  | Internal               | 1     |
| 14  | Notifications   | Internal               | 2     |
| 15  | Reports         | Read projection        | 2     |
| 16  | Settings        | Internal               | 1     |
| 17  | Audit           | Internal               | 1     |

**Out of scope (per PMD-0001):** AIS, VMS, Vessel Tracking, Live Tracking, Geofence, Heatmap.

---

# Sprint 1 — Platform Bootstrap Completion Certificate

**Date:** 2026-07-31  
**Author:** Lead Backend Engineer  
**Sprint status:** **COMPLETE**  
**Scope:** Platform bootstrap only — no business modules, no application logic.

---

## Deliverables

### Repository scaffolding

| Item                                                      | Status |
| --------------------------------------------------------- | ------ |
| pnpm workspace configuration                              | Done   |
| Root `package.json` with workspace scripts                | Done   |
| `apps/api` — NestJS project scaffold                      | Done   |
| `apps/web` — React + Vite + TypeScript scaffold           | Done   |
| `packages/shared-kernel` — Shared types/errors/primitives | Done   |
| `packages/api-client` — Placeholder directory             | Done   |
| `packages/ui` — Placeholder directory                     | Done   |

### Configuration & tooling

| Item                                          | Status |
| --------------------------------------------- | ------ |
| ESLint (flat config)                          | Done   |
| Prettier                                      | Done   |
| Husky + lint-staged                           | Done   |
| TypeScript base config (`tsconfig.base.json`) | Done   |
| Environment files (`.env`, `.env.example`)    | Done   |
| `.gitignore`                                  | Done   |

### API foundation (`apps/api`)

| Item                                                          | Status |
| ------------------------------------------------------------- | ------ |
| NestJS bootstrap (`main.ts`, `app.module.ts`)                 | Done   |
| Configuration module (`src/config/`)                          | Done   |
| Logging service (`src/platform/logging.service.ts`)           | Done   |
| Health endpoints (`/health/live`, `/health/ready`)            | Done   |
| Shared kernel (`src/shared-kernel/index.ts`)                  | Done   |
| Prisma schema (initial `AuditLog` table)                      | Done   |
| Prisma seed file placeholder                                  | Done   |
| Module directories (17 Calendar modules with layer structure) | Done   |
| `vitest.config.ts` + `vitest.e2e.config.ts`                   | Done   |

### Web foundation (`apps/web`)

| Item                                 | Status |
| ------------------------------------ | ------ |
| Vite + React + TypeScript scaffold   | Done   |
| Tailwind CSS v4 configuration        | Done   |
| TanStack Router + Query dependencies | Done   |
| App shell (`App.tsx`)                | Done   |
| Feature directory placeholders       | Done   |
| `vitest.config.ts`                   | Done   |

### Infrastructure

| Item                                     | Status                         |
| ---------------------------------------- | ------------------------------ |
| Docker Compose — PostgreSQL 16           | Done                           |
| Environment configs (dev/staging/prod)   | Done                           |
| DB bootstrap script                      | Done                           |
| CI workflow (`.github/workflows/ci.yml`) | Existing — verified compatible |

---

## What was NOT implemented (by design)

- Authentication (JWT, login, refresh) — Sprint 2
- Users module — Sprint 2
- Stations module — Sprint 2
- All 17 business modules — future Sprints
- Application logic, use-cases, controllers beyond health
- Mock data, sample APIs
- E2E tests, contract tests

---

## Verification checklist

- [x] `pnpm install` succeeds
- [x] `pnpm lint` passes (no source files to lint yet)
- [x] `pnpm typecheck` passes
- [x] `docker compose up` starts PostgreSQL
- [x] `pnpm db:migrate:dev` creates initial migration
- [x] `pnpm dev:api` starts NestJS on port 3000
- [x] `GET /health/live` returns `{"status":"ok"}`
- [x] `GET /health/ready` returns `{"status":"ok"}`
- [x] `pnpm dev:web` starts Vite on port 5173
- [x] Folder structure matches `docs/structure/FOLDER_STRUCTURE.md`
- [x] No business logic, no mock data, no sample APIs

---

## Handoff to Sprint 2 (Authentication)

Sprint 2 should implement per ADR-0010:

- JWT access tokens (15-min TTL, `Authorization: Bearer`)
- Refresh token rotation (7-day TTL, httpOnly cookie)
- Logout (clear cookie + blocklist)
- Argon2id password hashing
- RBAC at application layer
- `refresh_token` table in Prisma schema

### Key handoff files

| Read first                                                           | Why                      |
| -------------------------------------------------------------------- | ------------------------ |
| `docs/decisions/ADR-0010-authentication-jwt-strategy.md`             | Auth implementation spec |
| `docs/architecture/DOMAIN_MODEL.md` §7 (Authentication aggregate)    | Auth domain model        |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` §6.4 (Authorization flow) | Auth runtime flow        |
| `docs/requirements/SRS.md` FR-AUTH-*                                 | Auth requirements        |
| `apps/api/src/config/configuration.ts`                               | Config keys available    |
| `apps/api/src/shared-kernel/index.ts`                                | Shared types to use      |

---

Sprint 1 is complete. Architecture remains frozen at v1.0.0. Sprint 2 is cleared to begin.

---

# Sprint 1 (Backend) — Completion Certificate

**Date:** 2026-08-05
**Author:** Lead Backend Engineer
**Sprint status:** **COMPLETE**
**Scope:** Authentication, User, Role, Permission, Audit — backend only per Sprint 1 scope.

---

## Scope

Implement the five core platform modules against the frozen Hub v2.0.0 architecture:

| Module         | Owns tables               | SRS IDs            |
| -------------- | ------------------------- | ------------------ |
| Authentication | `refresh_token`           | FR-AUTH-001..006   |
| Users          | `users`, `user_roles`     | FR-USR-001..003    |
| Roles          | `roles`, `role_permissions` (via `text[]`) | FR-ROL-001..003 |
| Permission     | (no table — guard + use-case) | FR-AUTH-002     |
| Audit          | `audit_log`               | FR-AUD-001..003    |

---

## Deliverables

### Authentication module (39 files)

| Layer            | Files                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **domain**       | `refresh-token.aggregate.ts`, `tokens.ts`, `auth-principal.ts`, `events.ts`, `event-bus.port.ts`, `errors.ts` + spec |
| **application**  | `login.use-case.ts`, `refresh.use-case.ts`, `logout.use-case.ts`, `authorize.use-case.ts`, `dtos.ts` (Zod), `di-tokens.ts`, `clock.ts`, `test-doubles.ts` + 4 specs |
| **infrastructure** | `jwt-token.service.ts` (HS256 + opaque refresh), `argon2-password-hasher.ts`, `prisma-refresh-token.repository.ts`, `prisma-user-identity-provider.ts`, `in-process-event-bus.ts` |
| **api**          | `jwt-auth.guard.ts`, `permissions.guard.ts`, `public.decorator.ts`, `current-principal.decorator.ts`, `refresh-cookie.ts`, `authentication.module.ts` |

### Users module (19 files)

| Layer            | Files                                                     |
| ---------------- | --------------------------------------------------------- |
| **domain**       | `user.ts` (record + params), `errors.ts`                  |
| **application**  | `create-user.use-case.ts`, `get-users.use-case.ts`, `update-user.use-case.ts`, `disable-user.use-case.ts`, `dtos.ts` (Zod), `test-doubles.ts` + 4 specs |
| **infrastructure** | `prisma-user.repository.ts`                             |
| **api**          | `users.module.ts`                                        |

### Roles module (18 files)

| Layer            | Files                                                     |
| ---------------- | --------------------------------------------------------- |
| **domain**       | `role.ts` (record), `errors.ts`                           |
| **application**  | `create-role.use-case.ts`, `get-roles.use-case.ts`, `update-role.use-case.ts`, `delete-role.use-case.ts`, `dtos.ts` (Zod), `test-doubles.ts` + 4 specs |
| **infrastructure** | `prisma-role.repository.ts`                             |
| **api**          | `roles.module.ts`                                        |

### Audit module (14 files)

| Layer            | Files                                                     |
| ---------------- | --------------------------------------------------------- |
| **domain**       | `audit-event.ts` (event + params)                         |
| **application**  | `record-audit.use-case.ts`, `get-audit.use-case.ts`, `dtos.ts` (Zod), `test-doubles.ts` + 2 specs |
| **infrastructure** | `prisma-audit.repository.ts`                            |
| **api**          | `audit.module.ts`                                        |

### Admin API controllers (`src/api/admin/`)

| Controller            | Endpoints                                                    | Permission     |
| --------------------- | ------------------------------------------------------------ | -------------- |
| `auth.controller.ts`  | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | Public / Bearer |
| `users.controller.ts` | `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` | `user.manage`  |
| `roles.controller.ts` | `GET /roles`, `GET /roles/:id`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id` | `role.manage`  |
| `audit.controller.ts` | `GET /audit`                                                | `audit.read`   |

### Prisma schema (5 tables)

| Table            | Owner          | Key fields                                            |
| ---------------- | -------------- | ----------------------------------------------------- |
| `users`          | Users          | id, email (UK), password_hash, status, timezone, locale |
| `roles`          | Roles          | id, name (UK), permission_codes (text[])              |
| `user_roles`     | Users          | id, user_id (FK), role_id (FK), UK(user_id, role_id)  |
| `refresh_token`  | Authentication | id, token_hash (UK), family_id, expires_at, revoked_at, replaced_by |
| `audit_log`      | Audit          | id, action, entity, entity_id, user_id, changes, created_at |

### Seed data

- `Admin` role — all 13 permission codes from AUTHORIZATION.md §4
- `FisheriesOfficer` role — 6 permission codes (read + alert-write)
- `Auditor` role — 6 permission codes (read-only)
- `admin@marineops.local` user with `Admin` role

---

## Architecture compliance

| Rule                                                              | Status |
| ----------------------------------------------------------------- | ------ |
| Clean Architecture (domain → application → infrastructure → api)  | Met    |
| Domain-Driven Design (aggregates, value objects, domain events)   | Met    |
| JWT access token (15-min TTL, HS256, response body)               | Met    |
| Opaque refresh token (48-byte random, SHA-256 hash stored)        | Met    |
| Refresh token rotation + family reuse detection                   | Met    |
| httpOnly + Secure + SameSite=Lax cookie (`mops_rt`)               | Met    |
| argon2id password hashing (OWASP params)                          | Met    |
| RBAC via PermissionsGuard (controller) + AuthorizeUseCase (use-case) | Met    |
| `@Public()` decorator for unauthenticated routes                  | Met    |
| `@RequirePermissions()` decorator for protected routes            | Met    |
| `@CurrentPrincipal()` param decorator                             | Met    |
| `DomainExceptionFilter` mapping error codes to HTTP statuses      | Met    |
| Zod validation on all write DTOs                                  | Met    |
| No cross-module DB joins (per DATABASE_OWNERSHIP Rule 4)          | Met    |
| Controllers in `src/api/admin/`, not inside module folders        | Met    |
| Audit events append-only (no UPDATE/DELETE in application paths)  | Met    |
| Admin-only authentication (public portal has no auth)             | Met    |

---

## Verification checklist

| Check                          | Result        |
| ------------------------------ | ------------- |
| `npx tsc --noEmit`             | Pass (clean)  |
| `npx eslint "src/**/*.ts"`     | Pass (clean)  |
| `npx vitest run` (45 tests)    | 45/45 passed  |
| `git status`                   | Clean         |
| `git log --oneline` (3 commits)| Committed     |

---

## What was NOT implemented (by design)

- Frontend (`apps/web` remains a stub — placeholder only)
- Two-portal split (`apps/web-admin/`, `apps/web-public/` not yet created)
- Password reset / invite flow (FR-AUTH-007 — P1)
- MFA (FR-AUTH-008 — P2)
- OIDC IdP (ADR-0010 §6 — port exists, no implementation)
- All 12 business modules (stations, tide, weather, wind, wave, moon-phase, sunrise-sunset, hijri-calendar, marine-calendar, dashboard, patrol-planner, notifications, reports, settings)
- E2E tests, contract tests
- Rate limiting, correlation IDs

---

## Handoff to Sprint 2 (Frontend + Business Modules)

Sprint 2 should implement:

1. Two-portal frontend split (`apps/web-admin/` + `apps/web-public/`)
2. Public API surface (`/api/public/*` controllers)
3. Admin Portal UI (login, dashboard, users, roles, audit)
4. Stations module (admin CRUD + public read)
5. Calendar module (read projection)
6. Tide module (sourced data per ADR-0008)

### Key handoff files

| Read first                                                     | Why                          |
| -------------------------------------------------------------- | ---------------------------- |
| `docs/structure/FOLDER_STRUCTURE.md` §2.2, §3, §4              | Controller split + portal layouts |
| `docs/architecture/AUTHORIZATION.md` §3                        | Public vs admin audience     |
| `docs/architecture/DATABASE_OWNERSHIP.md` §4                   | Public/admin read-sharing    |
| `docs/requirements/SRS.md` FR-STN-*, FR-CAL-*, FR-TID-*        | Next module requirements     |
| `docs/decisions/ADR-0008-calendar-data-source-strategy.md`     | Tide/weather data pattern    |
| `docs/api/OPENAPI.md`                                          | Full API contract            |

---

Sprint 1 (Backend) is complete. Architecture remains frozen at v2.0.0. Sprint 2 is cleared to begin.

---

# Sprint 3.0 — Public API Architecture (Documentation Only)

**Date:** 2026-08-05  
**Author:** Chief Backend Architect  
**Sprint status:** **COMPLETE**  
**Scope:** Public API architecture design — documentation only, no code.

---

## Scope

Design the complete Public API architecture for the `/api/public` surface, covering endpoints, DTOs, caching, error handling, versioning, and the provider adapter pattern. No application code was written.

---

## Deliverables

### New documentation

| File | Description |
|------|-------------|
| `docs/architecture/PUBLIC_API.md` | Complete Public API architecture: route map, endpoints, DTOs, caching strategy, error responses, versioning, provider adapter architecture, sequence diagram, public dashboard design |

### Updated documentation

| File | Changes |
|------|---------|
| `docs/api/OPENAPI.md` | Added `/wind-wave` combined endpoint; added `/dashboard` public endpoint; expanded DTO schemas (TideDataPoint, WeatherDataPoint, WindWaveDataPoint, PublicDashboardResponse, CalendarDayEntry); added 503 ProviderUnavailable response; version bumped to 2.1.0 |
| `docs/api/SEQUENCE_DIAGRAMS.md` | Added diagram 9 (sourced data read with cache + stale fallback); added diagram 10 (public dashboard fan-out) |
| `docs/PROJECT_STATE.md` | This entry |

---

## Key design decisions

| Decision | Rationale |
|----------|-----------|
| `/wind-wave` combined endpoint | Reduces round-trips for the Public Portal "Angin & Ombak" page; granular `/wind` and `/wave` remain available |
| `/dashboard` public endpoint | Single-call aggregation for the "Pusat Operasi" homepage; 5-minute CDN cache; no PII |
| Two-tier cache (CDN L1 + PostgreSQL L2) | CDN for shared response caching; DB for adapter-pattern source-of-truth cache |
| Stale-while-revalidate on provider failure | Graceful degradation per ADR-0008; never 503 when any cached data exists |
| 503 only on cache miss + provider failure | Clear signal that data is truly unavailable |
| Computable data (moon/sun/hijri) — no cache table | Pure functions, deterministic per date; 24h CDN cache only; sub-100ms response (NFR-PERF-003) |
| Provider adapter pattern (ADR-0008) | Provider swappable without domain/application change; API keys isolated to infrastructure |

---

## What was NOT implemented (by design)

- No application code (documentation-only sprint)
- No backend controllers, use-cases, or repositories
- No Prisma schema changes
- No frontend changes
- No API integration

---

## Handoff to Sprint 3.1 (Backend Implementation)

Sprint 3.1 should implement:

1. Public controllers (`src/api/public/*.controller.ts`)
2. Sourced-data modules (Tide, Weather, Wind, Wave) with adapter + cache
3. Computable modules (MoonPhase, SunriseSunset, HijriCalendar) as pure functions
4. Marine Calendar read projection
5. Public Dashboard read projection
6. Prisma schema for cache tables (`tide_cache`, `weather_cache`, `wind_cache`, `wave_cache`)

### Key handoff files

| Read first | Why |
|------------|-----|
| `docs/architecture/PUBLIC_API.md` | Complete Public API architecture |
| `docs/api/OPENAPI.md` | API contract (source of truth) |
| `docs/decisions/ADR-0008-calendar-data-source-strategy.md` | Adapter pattern + caching convention |
| `docs/architecture/DATABASE_OWNERSHIP.md` | Table ownership rules |
| `docs/data/ERD.md` | Cache table schemas (§2.9–§2.12) |

---

Sprint 3.0 is complete. Architecture remains frozen at v2.0.0. Sprint 3.1 is cleared to begin.
