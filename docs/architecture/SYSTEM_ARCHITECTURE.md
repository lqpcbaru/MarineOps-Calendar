# §1 — System Architecture: MarineOps Hub

**Version:** 2.0.0 (Proposed — pending ADR-0011)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Style:** Modular monolith (ADR-0007 retained) serving two portals over a shared backend  
**Authorised by:** ADR-0011 (project direction change to Hub)

> This document supersedes the MarineOps Calendar v1.0.0 SYSTEM_ARCHITECTURE for the active scope. The Calendar version is preserved at `archive/calendar/architecture/SYSTEM_ARCHITECTURE.md`.

---

## 1. Goals of the architecture

- Deliver a **Public Portal** that anyone can use without authentication (tide, weather, moon, sun, calendar, alerts, stations).
- Deliver a hardened **Admin Portal** for administrators and fisheries officers only.
- Share **one backend** (NestJS modular monolith) and **one database** (PostgreSQL) across both portals — no service split, no duplicated stores.
- Keep the public surface **read-only and isolated** from the admin surface at the API routing layer.
- Preserve Clean Architecture + DDD: domain purity, ports/adapters for external data, in-process domain events.
- Allow future operational modules (Patrol Planner, AIS, VMS, Vessel Monitoring) to land on the admin surface without disturbing the public surface.

---

## 2. Topology — two portals, one backend

```
┌──────────────────────┐                ┌──────────────────────┐
│   Public Portal      │                │   Admin Portal       │
│   (apps/web-public)  │                │   (apps/web-admin)   │
│   React + Vite + TS  │                │   React + Vite + TS  │
│   NO LOGIN           │                │   LOGIN REQUIRED     │
└──────────┬───────────┘                └──────────┬───────────┘
           │                                        │
           │  /api/public  (read-only, no auth)     │  /api/v1  (JWT required)
           │                                        │
           └──────────────────┬─────────────────────┘
                              ▼
                 ┌────────────────────────┐
                 │  MarineOps Hub API     │
                 │  (apps/api — NestJS)   │
                 │  modular monolith      │
                 └─────────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            ▼                  ▼                      ▼
     ┌────────────┐   ┌──────────────┐      ┌─────────────────┐
     │ PostgreSQL │   │ External API │      │  Computable     │
     │  (primary) │   │ Adapters     │      │  (in-process)   │
     │  + caches  │   │ Tide/Weather │      │  Moon / Sun /   │
     │            │   │ Wind/Wave    │      │  Hijri          │
     └────────────┘   └──────┬───────┘      └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              ┌──────────┐        ┌──────────┐
              │ Tide/    │        │ Weather/ │
              │ Weather  │        │ Wind/Wave│
              │ APIs     │        │ APIs     │
              └──────────┘        └──────────┘
```

### 2.1 Why two portals instead of one SPA

- The Public Portal has **no auth surface at all** — no token storage, no login form, no XSS token-exfiltration risk. This is the smallest possible attack surface for a public-facing site.
- The Admin Portal can evolve its auth posture (MFA, session policy, IP allow-list) without forcing a redeploy of the public site.
- Release cadences decouple: public marketing/content changes don't touch admin auth, and admin security patches don't block public content.
- Both portals are first-class React apps sharing `packages/ui` and `packages/shared-kernel` to avoid duplication.

### 2.2 Why one backend (not a BFF per portal)

- A modular monolith already separates concerns by module. The public/admin split is an **API routing concern**, not a service boundary.
- Both portals read the same marine data (tide, weather, stations, calendar). Duplicating that logic across two backends would violate single-source-of-truth.
- A single deployable keeps operational overhead minimal for Phase 1. Extraction to a BFF or service requires a future ADR proving need.

---

## 3. Logical layers

```
┌─────────────────────────────────────────────────────────┐
│ Presentation                                          │
│  ├─ Public Portal (React)        ── /api/public        │
│  └─ Admin Portal  (React)        ── /api/v1 (JWT)      │
├─────────────────────────────────────────────────────────┤
│ API / Transport (NestJS controllers, DTOs, guards)     │
│  ├─ public/  controllers — @Public, read-only          │
│  └─ admin/   controllers — @RequireAuth, RBAC          │
├─────────────────────────────────────────────────────────┤
│ Application (use-cases / commands / queries / ports)   │
├─────────────────────────────────────────────────────────┤
│ Domain (entities, value objects, policies, events)     │
├─────────────────────────────────────────────────────────┤
│ Infrastructure (DB via Prisma, external adapters, clock)│
└─────────────────────────────────────────────────────────┘
```

### Layer rules (binding)

| Layer             | May import                              | May NOT import                                     |
| ----------------- | --------------------------------------- | -------------------------------------------------- |
| Domain            | shared-kernel primitives only           | HTTP, DB, Prisma, NestJS, external clients         |
| Application       | Domain + port interfaces                | Infrastructure implementations, NestJS controllers |
| Infrastructure    | Application ports + Prisma/HTTP clients | Controllers, other modules' internals              |
| API (controllers) | Application use-cases + DTOs + guards   | Domain internals, Prisma directly                  |

- **Domain purity is absolute.** No framework or DB imports inside `domain/` (ADR-0008 §3, ENGINEERING_STANDARDS §3.2).
- **UI never talks to DB or external APIs directly.** Only through the public or admin API surfaces.
- **Computable modules (Moon, Sun, Hijri) live in `domain/`** as pure functions — no I/O, no tables (ADR-0008).
- **Public controllers may only call read-side use-cases.** A public controller must never invoke a command/write use-case.

---

## 4. Bounded contexts (modules)

Modules are the unit of ownership. Each module owns its tables and exposes a published application port. Cross-module calls go through ports, never through foreign infrastructure.

### 4.1 Public-facing modules (served via `/api/public`)

| Module         | Responsibility                   | Data source           | Owns data      |
| -------------- | -------------------------------- | --------------------- | -------------- |
| Tide           | Tide data read                   | External API (cached) | tide_cache     |
| MarineWeather  | Weather read                     | External API (cached) | weather_cache  |
| Wind           | Wind read                        | External API (cached) | wind_cache     |
| Wave           | Wave height read                 | External API (cached) | wave_cache     |
| MoonPhase      | Moon phase computation           | Local computation     | —              |
| SunriseSunset  | Sunrise/sunset/twilight          | Local computation     | —              |
| MarineCalendar | Unified calendar read projection | Projections           | — (read model) |
| MarineAlerts   | Public alert read                | Internal              | alerts         |
| Stations       | Public station read              | Internal              | stations       |
| About          | Static content                   | Static/config         | —              |

### 4.2 Admin-facing modules (served via `/api/v1`)

| Module         | Responsibility                         | Data source | Owns data               |
| -------------- | -------------------------------------- | ----------- | ----------------------- |
| Authentication | Admin login, JWT issue/refresh, logout | Internal    | refresh_token           |
| Users          | User CRUD, status                      | Internal    | users                   |
| Roles          | Role & permission management           | Internal    | roles, role_permissions |
| Dashboard      | Admin operational summary              | Projections | — (read model)          |
| CalendarAdmin  | Calendar entry CRUD                    | Internal    | calendar_entries        |
| StationAdmin   | Station CRUD, archive                  | Internal    | stations (shared read)  |
| AlertsAdmin    | Alert CRUD, publish                    | Internal    | alerts (shared read)    |
| Audit          | Append-only audit stream               | Internal    | audit_events            |
| Settings       | Org config, provider config            | Internal    | settings                |

### 4.3 Future modules (each requires its own ADR before implementation)

| Module           | Notes                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| PatrolPlanner    | Patrol plan CRUD, lifecycle, condition snapshot. Reused from Calendar design. |
| AIS              | Automatic Identification System feed. Integration shape TBD.                  |
| VMS              | Vessel Monitoring System integration.                                         |
| VesselMonitoring | Vessel tracking aggregation across AIS/VMS.                                   |

### 4.4 SharedKernel

Provides: IDs, Result/Error, AuthPrincipal, Clock, freshness envelope, pagination types. Primitives only — no business logic, no I/O.

---

## 5. Core runtime flows

### 5.1 Public Portal — view marine calendar for a station

1. Anonymous browser requests `/api/public/calendar?stationId=...&date=...`.
2. Public controller is marked `@Public`; no auth guard runs.
3. `MarineCalendar.getPublicEntry(stationId, date)` reads projections from Tide, Weather, Wind, Wave, Moon, Sun, Hijri ports.
4. Each sourced module checks its cache; stale → serve cached with `stale` flag (ADR-0008 retained).
5. Response returned with freshness envelope. No write path is reachable.

### 5.2 Admin Portal — login

1. Admin browser posts credentials to `/api/v1/auth/login`.
2. `Authentication.login` verifies credentials (argon2id), checks the user is an admin/officer role, mints access JWT (15 min) + opaque refresh (7 day, httpOnly cookie).
3. Subsequent admin requests carry `Authorization: Bearer <access>`; the global `JwtAuthGuard` populates `AuthPrincipal`.
4. RBAC guard + use-case-level `AuthorizeUseCase` enforce permission codes.

### 5.3 Admin Portal — manage stations (CRUD)

1. Authenticated admin with `station.write` calls `/api/v1/stations`.
2. `StationAdmin.create/udpate/archive` validates, persists, emits `StationCreated` / `StationStatusChanged`.
3. Audit module consumes the event and writes an append-only audit row.
4. The Public Portal's `/api/public/stations` immediately reflects the change (same `stations` table, read-only projection).

### 5.4 Scheduled data refresh (cron)

1. NestJS Schedule cron jobs trigger per sourced data module (Tide hourly, Weather 3-hourly, etc.).
2. For each active station nearing `validUntil`: fetch fresh via provider port; update cache.
3. On failure: log, emit `DataStaleDetected`, leave cache as stale. (Future Notifications module consumes this.)

---

## 6. Data architecture

| Store                          | Use                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------- |
| PostgreSQL 16                  | System of record for all modules; cache tables for sourced data                   |
| Object storage (S3-compatible) | Report exports, future file attachments                                           |
| Cache (in-DB)                  | Per-module cache tables (`tide_cache`, `weather_cache`, …) — not Redis in Phase 1 |
| Queue (optional later)         | Email, heavy exports, batch refresh — BullMQ + Redis via future ADR               |

### Conventions

- UTC timestamps; convert at edges.
- Soft delete / archive for master data (stations, users, calendar entries).
- Cache tables: `stationId, parameter, fetchedAt, validUntil, payload (JSONB), source`.
- Computable modules (Moon, Sun, Hijri) have **no tables**.
- Cross-module references by ID only; no cross-module joins as default (§9).
- Migrations versioned with Prisma.

---

## 7. API design principles

- Resource-oriented HTTP JSON.
- Two surfaces (see §5 API Versioning): `/api/public` (read-only, no auth) and `/api/v1` (admin, JWT).
- Pagination, filtering, sorting on all list endpoints.
- Consistent error shape: `code`, `message`, `details`, `correlationId`.
- All sourced data responses include a `freshness` envelope.
- Computable data responses are instant (no freshness envelope).

### Endpoint group summary

| Prefix                          | Audience      | Auth                                                  |
| ------------------------------- | ------------- | ----------------------------------------------------- |
| `/api/public/*`                 | Public Portal | None                                                  |
| `/api/v1/auth/*`                | Admin Portal  | Public login only                                     |
| `/api/v1/users`, `/roles`       | Admin Portal  | JWT + `user.manage` / `role.manage`                   |
| `/api/v1/stations`              | Admin Portal  | JWT + `station.write` (write) / `station.read` (read) |
| `/api/v1/calendar`              | Admin Portal  | JWT + calendar CRUD perms                             |
| `/api/v1/alerts`                | Admin Portal  | JWT + alerts CRUD perms                               |
| `/api/v1/audit`                 | Admin Portal  | JWT + `audit.read`                                    |
| `/api/v1/settings`              | Admin Portal  | JWT + `settings.write`                                |
| `/api/v1/dashboard`             | Admin Portal  | JWT + `dashboard.read`                                |
| `/health/live`, `/health/ready` | Platform      | None                                                  |

Full route table: see §8 Public vs Private Routes.

---

## 8. Security architecture

- TLS everywhere non-local.
- **AuthN (admin only):** JWT access + refresh rotation (ADR-0010 mechanics retained). The Public Portal never authenticates.
- **AuthZ:** RBAC with permission codes. Anonymous callers receive only the implicit `public.read` capability against `/api/public`. Admin callers carry role-based codes against `/api/v1`.
- Passwords: argon2id.
- External API keys: env/secret store only; loaded in infrastructure layer; never exposed to domain or to any client.
- Audit of all admin state-changing actions.
- Least-privilege DB and cloud roles.
- Public surface rate-limiting and caching recommended at the edge (reverse proxy / CDN).

See §6 Authentication Strategy and §7 Authorization Strategy for detail.

---

## 9. Observability

- Structured JSON logs with `correlationId`, `userId` (admin only), `module`, `portal` (`public` | `admin`).
- Metrics: request rate, latency, error rate, external API call latency, cache hit/miss.
- Health: `/health/live`, `/health/ready`.
- External API monitoring: per-provider latency, error rate, quota.
- Public vs admin traffic tagged separately for alerting (e.g. auth failures on `/api/public` are impossible — any 401 on public routes is a misconfiguration).

---

## 10. Deployment view

```
[ CDN / reverse proxy ]
        |
        ├─── /                → Public Portal static build
        ├─── /admin           → Admin Portal static build
        ├─── /api/public      → API containers × N (NestJS)
        └─── /api/v1          → API containers × N (NestJS)
                                   │
                            [ PostgreSQL ] [ Object store ]
```

- 12-factor config; separate env per environment (local, staging, prod).
- Cron jobs run inside the API process (NestJS Schedule).
- Blue/green or rolling deploys.
- Both portals are static builds served by the reverse proxy; only the API is a long-running server process.

---

## 11. Technology stack (decided — ADR-0009 re-confirmed)

| Layer              | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Language / runtime | TypeScript 5.x, Node.js 22 LTS                     |
| API framework      | NestJS                                             |
| Validation         | Zod                                                |
| Database           | PostgreSQL 16                                      |
| ORM / migrations   | Prisma                                             |
| Object storage     | S3-compatible (MinIO local, AWS S3 prod)           |
| Public Portal      | React 19 + Vite + TanStack Router + TanStack Query |
| Admin Portal       | React 19 + Vite + TanStack Router + TanStack Query |
| CSS                | Tailwind CSS                                       |
| Auth (admin)       | JWT httpOnly cookies + argon2id + refresh rotation |
| Scheduled tasks    | @nestjs/schedule (cron)                            |
| Testing            | Vitest (unit/integration), Playwright (E2E)        |
| Linting            | ESLint + Prettier                                  |
| Package manager    | pnpm (monorepo workspaces)                         |
| CI                 | GitHub Actions                                     |

---

## 12. Quality attributes mapping

| Attribute       | Approach                                                                       |
| --------------- | ------------------------------------------------------------------------------ |
| Security        | Admin-only auth; isolated public read surface; RBAC; TLS; argon2id             |
| Auditability    | Audit module + append-only event log for all admin writes                      |
| Reliability     | Graceful degradation via cached data (ADR-0008)                                |
| Performance     | Pagination, indexes, instant computable data, cache for sourced data           |
| Maintainability | Module boundaries, adapter pattern, docs-first, DoD                            |
| Extensibility   | Ports/adapters, domain events, swappable providers, future-module slots        |
| Observability   | Structured logs, external API monitoring, health checks, portal-tagged traffic |

---

## 13. Risks and mitigations

| Risk                                                    | Mitigation                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Accidental exposure of admin endpoint on public surface | Dedicated `/api/public` prefix; public controllers physically separate; CI lint rule forbidding `@Public` outside `public/` controllers |
| Public Portal abused as a data-scraping vector          | Rate-limit `/api/public` at edge; cache aggressively; no PII in public responses                                                        |
| External API downtime                                   | Cache with stale fallback (ADR-0008)                                                                                                    |
| Two frontends diverge on shared types                   | `packages/shared-kernel` + `packages/api-client` are the single source for DTO types                                                    |
| Future AIS/VMS integration reshapes domain              | Each future module requires its own ADR before implementation                                                                           |
| Admin auth fatigue (small audience, long sessions)      | Refresh rotation + 15-min access TTL (ADR-0010); optional MFA deferred to Phase 3                                                       |

---

## 14. Change log

| Version | Date       | Notes                                                                       |
| ------- | ---------- | --------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | MarineOps Hub baseline — two-portal topology over shared backend (ADR-0011) |
