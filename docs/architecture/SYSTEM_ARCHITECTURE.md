# System Architecture — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline (frozen)  
**Style:** Modular monolith (ADR-0007); extract services only with ADR justification  

---

## 1. Goals of the architecture

- Provide a unified marine operational planning platform with environmental data integration  
- Integrate external data sources (tide, weather, wind, wave) via adapter pattern with caching (ADR-0008)  
- Compute astronomical data (sun, moon, Hijri) locally for zero-dependency, zero-cost accuracy  
- Enforce security, audit, and data integrity at the core  
- Keep deploy simple for early phases (single deployable app + DB)  
- Leave room for multi-tenant, offline, and external integrations  

---

## 2. Architectural style

### 2.1 Modular monolith (ADR-0007)

One deployable **backend** (NestJS) and one **web frontend** (React), internally split into **domain modules** with:

- Explicit public module APIs (application services / use-cases)  
- No deep imports across module internals  
- Shared kernel only for cross-cutting primitives (IDs, errors, auth context, clock)  

### 2.2 Evolution path

```
Phase 0–1: Modular monolith (NestJS Schedule for data refresh)
    ↓
Phase 2+: Optional extract of heavy modules (Notifications, Reports)
    ↓
Later: Queue-based refresh (BullMQ + Redis) if scheduling outgrows cron
```

Extraction requires ADR + interface stability.

---

## 3. High-level context

```
┌─────────────┐     HTTPS      ┌──────────────────────┐
│  Web Client │ ──────────────►│  MarineOps Calendar  │
│  (React SPA)│◄──────────────│  API (NestJS)        │
└─────────────┘                └──────────┬───────────┘
                                          │
              ┌───────────────────────────┼───────────────────────┐
              ▼                           ▼                       ▼
       ┌────────────┐           ┌──────────────┐        ┌─────────────────┐
       │ PostgreSQL │           │ External API │        │  Computable     │
       │  (primary) │           │ Adapters      │        │  (in-process)   │
       │  + caches  │           │ Tide/Weather/ │        │  MoonPhase      │
       │            │           │ Wind/Wave     │        │  SunriseSunset  │
       └────────────┘           └──────┬───────┘        │  HijriCalendar  │
                                       │                └─────────────────┘
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                   ┌──────────┐ ┌──────────┐ ┌──────────┐
                   │ Tide API │ │Weather API│ │Wind/Wave │
                   │(NOAA etc)│ │(OM/OWM)  │ │ API      │
                   └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Logical layers

```
┌─────────────────────────────────────────────┐
│ Presentation (Web UI — React)               │
├─────────────────────────────────────────────┤
│ API / Transport (HTTP, DTOs, auth middleware)│
├─────────────────────────────────────────────┤
│ Application (use-cases / commands-queries)  │
├─────────────────────────────────────────────┤
│ Domain (entities, policies, domain events)  │
├─────────────────────────────────────────────┤
│ Infrastructure (DB, external adapters, clock)│
└─────────────────────────────────────────────┘
```

**Rules:**

- Domain has **no** framework or DB imports.  
- Application orchestrates domain + ports.  
- Infrastructure implements ports — including external API adapters.  
- UI never talks to DB or external APIs directly.  
- Computable modules (Moon, Sun, Hijri) live in `domain/` — they are pure functions.  

---

## 5. Bounded contexts (modules)

See also [DOMAIN_MODEL.md](DOMAIN_MODEL.md).

| Module | Responsibility | Data source | Owns data |
|--------|----------------|-------------|-----------|
| **Authentication** | Login, JWT issuance/refresh, logout | Internal | Yes |
| **Users** | Users, roles, permissions | Internal | Yes |
| **Stations** | Station CRUD, status, archive | Internal | Yes |
| **MarineCalendar** | Unified calendar read projection | Projections | No (read model) |
| **Tide** | Tide data fetch, cache, serve | External API | Yes (cache) |
| **MoonPhase** | Moon phase computation | Local computation | No |
| **HijriCalendar** | Gregorian→Hijri conversion | Local computation | No |
| **Weather** | Weather data fetch, cache, serve | External API | Yes (cache) |
| **Wind** | Wind data fetch, cache, serve | External API | Yes (cache) |
| **Wave** | Wave data fetch, cache, serve | External API | Yes (cache) |
| **SunriseSunset** | Sunrise/sunset/twilight computation | Local computation | No |
| **Dashboard** | Operational summary read model | Projections | No (read model) |
| **PatrolPlanner** | Patrol plan CRUD, lifecycle, snapshots | Internal | Yes |
| **Notifications** | In-app/email dispatch | Internal | Yes |
| **Reports** | Report generation, export | Projections | No (read model) |
| **Settings** | Org config, provider config, reference data | Internal | Yes |
| **Audit** | Append-only audit stream | Internal | Yes |
| **SharedKernel** | IDs, Result/Error, auth principal, time | — | Primitives only |

### 5.1 Cross-module communication

- **Sync in-process calls** via published application interfaces for MVP  
- **Domain events** (in-process bus) for side effects: `PatrolPlanAssigned`, `PatrolPlanStatusChanged`, `DataStaleDetected`  
- **No shared mutable tables** across modules  
- Foreign keys across modules: **IDs only**  
- Sourced data modules expose a **query port** (e.g. `ITideQuery`) that other modules call  
- Computable modules expose a **pure function port** (e.g. `computeMoonPhase(date)`)  

### 5.2 Adapter pattern for sourced data (ADR-0008)

Each sourced data module (Tide, Weather, Wind, Wave) follows this internal structure:

```
modules/tide/
├── domain/
│   └── tide-data.ts              # Domain model (TideData value object)
├── application/
│   ├── ports/
│   │   ├── tide-provider.port.ts # Interface: fetch from external API
│   │   └── tide-query.port.ts    # Interface: query tide data (public to other modules)
│   ├── get-tide.use-case.ts      # Orchestrate: check cache → fetch → cache → return
│   └── tide-cache.service.ts     # Cache read/write logic
├── infrastructure/
│   ├── noaa-tide-provider.ts     # Implements tide-provider.port (external API call)
│   └── prisma-tide-cache.repo.ts # Implements cache repository
└── api/
    └── tide.controller.ts        # HTTP endpoint
```

**Key rule:** The domain and application layers know **nothing** about which provider is used. Swapping NOAA for a commercial API requires only a new `infrastructure/` file.

---

## 6. Core runtime flows

### 6.1 Fetch tide data for calendar

1. API authenticates user, loads principal + permissions.  
2. `MarineCalendar.getCalendarEntry(stationId, dateRange)` calls `TideQuery` port.  
3. Tide module's `GetTideData` use-case checks cache (`validUntil > now?`).  
4. If fresh: return cached data with freshness envelope.  
5. If stale: attempt external fetch via `TideProvider` port; on success, update cache and return fresh; on failure, return cached data with `stale` flag.  
6. If no cache and API unreachable: return `unavailable` freshness status.  

### 6.2 Create patrol plan with condition snapshot

1. API authenticates user, checks `patrolplan.write` permission.  
2. `PatrolPlanner.CreatePatrolPlan` validates station exists via Stations query port.  
3. Patrol plan persisted with `Draft` status.  
4. Domain event `PatrolPlanCreated` emitted.  
5. When plan transitions to `Scheduled`: `ConditionSnapshot` captured by querying Tide, Weather, Wind, Wave, Moon, Sun ports.  
6. Snapshot is immutable; stored with the patrol plan.  
7. Audit event written.  
8. Notifications module handles `PatrolPlanAssigned` event (in-app).  

### 6.3 Scheduled data refresh (cron)

1. NestJS Schedule cron job triggers per data module (e.g., every 1 hour for tide, every 3 hours for weather).  
2. For each active station: check if cache is nearing `validUntil`.  
3. If yes: fetch fresh data via provider port; update cache.  
4. If fetch fails: log error, emit `DataStaleDetected` event, leave cache as stale.  
5. Notifications module handles `DataStaleDetected` for configured stations.  

### 6.4 Authorization

- Permission checks at application layer (use-case entry).  
- Resource-level rules (station-scoped roles) expressed as domain/application policy.  
- UI may hide actions but **never** is the only control.  

---

## 7. Data architecture

| Store | Use |
|-------|-----|
| PostgreSQL 16 | System of record for all modules; cache tables for sourced data |
| Object storage (S3) | Report exports (CSV/PDF), future file attachments |
| Cache (in-DB) | Per-module cache tables (`tide_cache`, `weather_cache`, etc.) — not Redis in Phase 1 |
| Queue (optional later) | Email, heavy exports, batch refresh — BullMQ + Redis via ADR if needed |

**Conventions:**

- UTC timestamps  
- Soft delete / archive for master data with history  
- Cache tables: `stationId, parameter, fetchedAt, validUntil, payload (JSONB), source`  
- Computable modules (Moon, Sun, Hijri) have **no tables** — pure functions  
- Migrations versioned with Prisma  

---

## 8. API design principles

- Resource-oriented HTTP JSON  
- Versioning: URL prefix `/api/v1`  
- Pagination, filtering, sorting on lists  
- Consistent error shape: `code`, `message`, `details`, `correlationId`  
- All sourced data responses include a `freshness` envelope (Domain Model §9)  
- Computable data responses are instant (no freshness envelope needed)  

### API endpoint groups

| Prefix | Module |
|--------|--------|
| `/api/v1/auth` | Authentication |
| `/api/v1/users` | Users |
| `/api/v1/stations` | Stations |
| `/api/v1/calendar` | Marine Calendar |
| `/api/v1/tide` | Tide |
| `/api/v1/weather` | Weather |
| `/api/v1/wind` | Wind |
| `/api/v1/wave` | Wave |
| `/api/v1/moon` | Moon Phase |
| `/api/v1/sun` | Sunrise/Sunset |
| `/api/v1/hijri` | Hijri Calendar |
| `/api/v1/dashboard` | Dashboard |
| `/api/v1/patrol-plans` | Patrol Planner |
| `/api/v1/notifications` | Notifications |
| `/api/v1/reports` | Reports |
| `/api/v1/settings` | Settings |
| `/api/v1/audit` | Audit |
| `/health/live`, `/health/ready` | Platform |

---

## 9. Security architecture

- TLS everywhere non-local  
- AuthN: JWT access + refresh rotation (ADR-0010)  
- AuthZ: RBAC with permission codes (Domain Model §8)  
- Passwords: argon2id  
- External API keys: stored in env/secret store, loaded in infrastructure layer only  
- Secrets outside repo  
- Audit of security-relevant actions  
- Least privilege DB and cloud roles  

---

## 10. Observability

- Structured logs (JSON) with `correlationId`, `userId` (where safe), `module`  
- Metrics: request rate, latency, error rate, external API call latency, cache hit/miss rate  
- Health: `/health/live`, `/health/ready`  
- External API monitoring: per-provider latency, error rate, quota tracking  
- Tracing optional in Phase 1+  

---

## 11. Deployment view

```
[ CDN / reverse proxy ]
          |
    [ Web static (React build) ]
          |
    [ API containers × N (NestJS) ]
          |
    [ PostgreSQL ] [ Object store (S3) ]
```

- 12-factor config  
- Separate env: local, staging, production  
- Cron jobs run inside the API process (NestJS Schedule)  
- Blue/green or rolling deploys preferred  

---

## 12. Technology stack (decided)

| Layer | Choice | ADR |
|-------|--------|-----|
| Language / runtime | TypeScript 5.x, Node.js 22 LTS | ADR-0009 |
| API framework | NestJS | ADR-0009 |
| Validation | Zod | ADR-0009 |
| Database | PostgreSQL 16 | ADR-0009 |
| ORM / migrations | Prisma | ADR-0009 |
| Object storage | S3-compatible (MinIO local, AWS S3 prod) | ADR-0009 |
| Web client | React 19 + TanStack Router + TanStack Query | ADR-0009 |
| CSS | Tailwind CSS | ADR-0009 |
| Auth | JWT httpOnly cookies + argon2id + refresh rotation | ADR-0010 |
| Scheduled tasks | @nestjs/schedule (cron) | ADR-0009 |
| Testing | Vitest (unit/integration), Playwright (E2E) | ADR-0009 |
| Linting | ESLint + Prettier | ADR-0009 |
| Package manager | pnpm (monorepo workspaces) | ADR-0009 |
| CI | GitHub Actions | ADR-0009 |

---

## 13. Quality attributes mapping

| Attribute | Approach |
|-----------|----------|
| Security | RBAC, TLS, argon2id, external key isolation, validation |
| Auditability | Audit module + append-only event log |
| Reliability | Graceful degradation via cached data (ADR-0008) |
| Performance | Pagination, indexes, computable data is instant, cache for sourced data |
| Maintainability | Module boundaries, adapter pattern, docs-first, DoD |
| Extensibility | Ports/adapters, domain events, swappable providers |
| Observability | Structured logs, external API monitoring, health checks |

---

## 14. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| External API downtime | Cache with stale fallback (ADR-0008) |
| External API rate limits | Scheduling + caching + per-station batching |
| God-module monolith | Enforce module boundaries; code review checklist |
| Cron job lost on restart | Idempotent re-fetch on startup; acceptable for Phase 1 |
| Provider schema change | Adapter maps to domain model; provider swap via infrastructure only |
| Computation library inaccuracy | Use well-established astronomical libraries; validate against known tables |

---

## 15. Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-31 | Initial system architecture for MarineOps Calendar (PMD-0001) |