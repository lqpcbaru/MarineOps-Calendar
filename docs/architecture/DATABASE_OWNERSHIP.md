# §9 — Database Ownership Rules: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Authorised by:** ADR-0011

> Carries forward the Calendar v1.0.0 data architecture conventions (ADR-0007, ADR-0008) unchanged in mechanics. Adds the public/admin read-sharing rule for the Hub.

---

## 1. Single database, per-module ownership

MarineOps Hub uses **one PostgreSQL database**. Every table is **owned by exactly one module**. The owning module is the only module that writes to those tables; other modules read via the owning module's query port or reference rows by ID.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL (one database)                         │
│                                                                        │
│  Authentication owns:     refresh_token                                │
│  Users owns:              users, user_roles                            │
│  Roles owns:              roles, role_permissions                      │
│  Stations owns:           stations                                     │
│  CalendarAdmin owns:      calendar_entries                            │
│  MarineAlerts owns:       alerts                                       │
│  Tide owns:               tide_cache                                   │
│  MarineWeather owns:      weather_cache                                │
│  Wind owns:               wind_cache                                   │
│  Wave owns:               wave_cache                                   │
│  Audit owns:              audit_events                                 │
│  Settings owns:           settings                                     │
│  Moon/Sun/Hijri:          (no tables — pure computation)               │
│  Dashboard/Calendar:      (no tables — read projections)               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The ownership rules (binding)

### Rule 1 — One owner per table

Every table has exactly one owning module. The owner's `infrastructure/` layer is the only code that writes to it.

### Rule 2 — No cross-module writes

Module A may not `INSERT`/`UPDATE`/`DELETE` rows in a table owned by module B. Cross-module data needs are met by:

- Calling module B's **command use-case** (in-process), or
- Subscribing to module B's **domain event** (in-process bus), or
- Emitting an event that module B consumes.

### Rule 3 — Foreign references by ID only

A table may store another module's entity ID as a plain column (e.g. `calendar_entries.stationId` references `stations.id`), but there is **no enforced foreign key with cascade** across module boundaries. The reference is a logical ID, not a relational dependency. This keeps modules independently refactorable.

> Exception: tables that are logically one aggregate split for performance (e.g. `users` + `user_roles`) live under the same module and may use enforced FKs.

### Rule 4 — No cross-module joins as default

List endpoints must not `JOIN` across module-owned tables. To compose data from multiple modules, call each module's query port in the application layer and compose the DTOs. This preserves module isolation and keeps queries indexable.

> A documented exception may be granted via ADR for a proven performance hotspot, with Architect review.

### Rule 5 — Public and admin reads share the table, not the writer

For modules that serve both surfaces (Stations, MarineAlerts, MarineCalendar), the same owning module's tables back both `/api/public/<x>` and `/api/v1/<x>` reads. Writes come only from the admin use-case. This is **read-through sharing**, not shared ownership — the owning module is still the sole writer.

### Rule 6 — Computable modules have no tables

MoonPhase, SunriseSunset, HijriCalendar have **no database tables**. They are pure functions. Do not add tables for them.

### Rule 7 — Soft delete / archive for master data

Master data (stations, users, calendar entries, alerts) uses **soft delete / archive** (a `status` or `deletedAt` column). No hard delete when referenced. Audit rows are **append-only** — no update or delete in application paths.

### Rule 8 — UTC timestamps

All timestamps stored as UTC. Convert at the presentation edge to the user/org timezone.

### Rule 9 — Migrations via Prisma only

Schema changes go through Prisma migrations, versioned under `apps/api/prisma/migrations/`. No manual prod schema edits (ENGINEERING_STANDARDS §5).

### Rule 10 — Cache tables follow the ADR-0008 convention

Sourced-data cache tables (`tide_cache`, `weather_cache`, `wind_cache`, `wave_cache`) follow the shape:
`stationId, parameter, fetchedAt, validUntil, payload (JSONB), source`.
Freshness = `now < validUntil`. Past `validUntil` = stale. Cache entries are upserted by `stationId + parameter + time range`.

---

## 3. Ownership table (canonical)

| Table              | Owning module  | Written by                  | Read by                                      |
| ------------------ | -------------- | --------------------------- | -------------------------------------------- |
| `refresh_token`    | Authentication | Authentication              | Authentication                               |
| `users`            | Users          | Users (admin)               | Authentication (via port), Audit             |
| `user_roles`       | Users          | Users (admin)               | Users, Authentication (via port)             |
| `roles`            | Roles          | Roles (admin)               | Users (via port), Authentication (via port)  |
| `role_permissions` | Roles          | Roles (admin)               | Roles, Authentication (via port)             |
| `stations`         | Stations       | Stations (admin)            | Stations (public+admin), Calendar, Dashboard |
| `calendar_entries` | CalendarAdmin  | CalendarAdmin (admin)       | MarineCalendar (projection), Dashboard       |
| `alerts`           | MarineAlerts   | MarineAlerts (admin)        | MarineAlerts (public+admin), Dashboard       |
| `tide_cache`       | Tide           | Tide                        | Tide (public+admin), Calendar                |
| `weather_cache`    | MarineWeather  | MarineWeather               | MarineWeather (public+admin), Calendar       |
| `wind_cache`       | Wind           | Wind                        | Wind (public+admin), Calendar                |
| `wave_cache`       | Wave           | Wave                        | Wave (public+admin), Calendar                |
| `audit_events`     | Audit          | Audit (via event consumers) | Audit (admin)                                |
| `settings`         | Settings       | Settings (admin)            | Adapter modules (via port)                   |

---

## 4. Public/admin read-sharing pattern

For a module like Stations that serves both surfaces:

```
                    ┌─────────────────────────────────┐
                    │       stations table            │  (owned by Stations)
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                          ▼
   ┌──────────────────────┐                ┌────────────────────────┐
   │ StationsQuery port   │                │ StationAdmin use-cases  │
   │ (read DTO, public    │                │ (commands + queries)    │
   │  subset + admin DTO) │                │ — admin only            │
   └──────────┬───────────┘                └────────────┬────────────┘
              │                                          │
   ┌──────────┴────────────┐              ┌─────────────┴──────────┐
   │ public-stations.ctrl  │              │ stations.ctrl (admin)  │
   │ /api/public/stations  │              │ /api/v1/stations       │
   └───────────────────────┘              └────────────────────────┘
```

- The same query port returns the public DTO for public controllers and the admin DTO for admin controllers (or two distinct query methods, e.g. `findPublic()` vs `findAdmin()`).
- Writes only ever come from the admin use-case. The public controller has no import path to a write use-case (enforced by CI lint).

---

## 5. Indexing & performance conventions

- Every list endpoint must be paginated (NFR-PERF-002).
- Indexes on: foreign ID columns (`stationId`, `userId`), `status`, `createdAt`, and the cache tables' `(stationId, parameter, validUntil)`.
- Cache lookups index `token_hash` / `(stationId, parameter, validUntil)` uniquely.
- No unbounded queries; `LIMIT` enforced at the repository layer.

---

## 6. Change log

| Version | Date       | Notes                                                                    |
| ------- | ---------- | ------------------------------------------------------------------------ |
| 2.0.0   | 2026-07-31 | Hub database ownership rules — adds public/admin read-sharing (ADR-0011) |
