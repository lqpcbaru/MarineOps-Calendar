# §3 + §4 — Module Dependency & Domain Boundaries: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline

This document combines:

- **§3 Module Dependency Diagram** — how modules call each other (ports, events, projection reads).
- **§4 Domain Boundaries** — bounded contexts, aggregates, ownership, and the public/admin split per module.

> Supersedes the MarineOps Calendar v1.0.0 DOMAIN_MODEL for the active scope. Calendar version preserved at `archive/calendar/architecture/DOMAIN_MODEL.md`.

---

## §3 — Module Dependency Diagram

### 3.1 High-level context map

```
                          ┌──────────────────────────────────┐
                          │       MarineOps Hub API          │
                          │   (apps/api — NestJS monolith)   │
                          └──────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼─────────────────────────────────┐
        │ /api/public (no auth)          │              /api/v1 (JWT + RBAC) │
        ▼                                ▼                                 ▼
┌───────────────────┐         ┌──────────────────────┐        ┌────────────────────┐
│  Public Portal    │         │  Read-side use-cases │        │ Admin use-cases    │
│  (apps/web-public)│────────▶│  (query ports only) │◀───────│ (commands + queries)│
└───────────────────┘         └──────────┬───────────┘        └─────────┬──────────┘
                                          │                              │
                                          ▼                              ▼
        ┌───────────────────────────────────────────────────────────────────┐
        │                          DOMAIN MODULES                            │
        │                                                                    │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │   Tide   │  │ Weather  │  │   Wind   │  │   Wave   │  │  Moon  ││
        │  │ (cached) │  │ (cached) │  │ (cached) │  │ (cached) │  │ (pure) ││
        │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───┘│
        │       └──────────────┴──────────────┴──────────────┘             │
        │                              │                                    │
        │                       ┌──────┴──────┐  ┌──────────┐  ┌──────────┐│
        │                       │ MarineCalendar│ │SunriseSet│  │ HijriCal ││
        │                       │ (projection) │  │ (pure)   │  │ (pure)   ││
        │                       └──────┬──────┘  └────┬─────┘  └────┬─────┘│
        │                              │              │             │       │
        │                              ▼              ▼             ▼       │
        │                       ┌────────────────────────────────────────┐  │
        │                       │  MarineCalendar reads projections from │  │
        │                       │  Tide/Weather/Wind/Wave/Moon/Sun/Hijri │  │
        │                       └────────────────────────────────────────┘  │
        │                                                                    │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │ Stations │  │   Alerts │  │  Audit   │  │ Settings │  │  Users ││
        │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘│
        │       │             │             │             │            │     │
        │       └─────────────┴──── events ▼            │            │     │
        │                              └────────────────►│            │     │
        │                                                             │     │
        │  ┌──────────────────────────────────────────────────────┐   │     │
        │  │ Authentication reads user identity via port ◀────────┼───┘     │
        │  └──────────────────────────────────────────────────────┘         │
        │                                                                    │
        │  ┌──────────────────────┐                                          │
        │  │  Dashboard (read)    │◀── reads projections from Calendar/Stations/Alerts
        │  └──────────────────────┘                                          │
        └────────────────────────────────────────────────────────────────────┘
```

### 3.2 Dependency rules (binding)

| Rule                     | Detail                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Public → read ports only | Public controllers may ONLY call query ports (`tide-query.port.ts`, etc.) or read use-cases. Never commands.                       |
| Admin → full use-cases   | Admin controllers call both command and query use-cases for their module.                                                          |
| Cross-module calls       | Via published application ports only. Never reach into another module's infrastructure or domain internals.                        |
| No shared mutable tables | Modules do not write to each other's tables. Reads across modules go through query ports returning DTOs, not raw table joins (§9). |
| Foreign references       | By ID. A `patrol_plan.stationId` is an ID reference to the Stations module's `stations.id`; no FK-enforced cross-module cascade.   |
| Domain events            | In-process bus for side effects (Audit, future Notifications). Producers do not know consumers.                                    |

### 3.3 Port catalog (inbound/outbound)

#### Sourced data modules (Tide, MarineWeather, Wind, Wave) — each exposes:

- `<module>-query.port.ts` — public query interface (both surfaces call this).
- `<module>-provider.port.ts` — external fetch interface (infrastructure implements).

#### Computable modules (MoonPhase, SunriseSunset, HijriCalendar) — each exposes:

- A pure function port: `computeMoonPhase(date)`, `computeSunriseSunset(lat, long, date)`, `convertToHijri(date)`.

#### Internal modules:

- `StationsQuery` — read port consumed by Calendar, Dashboard, public stations controller.
- `AlertsQuery` — read port consumed by public alerts controller, Dashboard.
- `UserIdentityProvider` — read port consumed by Authentication (§6).
- `CalendarQuery` — read port consumed by public calendar controller, Dashboard.
- `AuditWriter` — write port consumed by every admin module that mutates state.

### 3.4 Domain events catalog (initial)

| Event                          | Producer               | Consumers                       |
| ------------------------------ | ---------------------- | ------------------------------- |
| `UserDisabled`                 | Users                  | Audit, (future Notifications)   |
| `StationCreated`               | Stations (admin)       | Audit, Dashboard, Calendar      |
| `StationStatusChanged`         | Stations (admin)       | Audit, Dashboard, Calendar      |
| `CalendarEntryCreated/Updated` | CalendarAdmin          | Audit, Calendar projection      |
| `AlertPublished`               | AlertsAdmin            | Audit, (future Notifications)   |
| `SettingChanged`               | Settings               | Audit, affected adapter modules |
| `DataStaleDetected`            | Tide/Weather/Wind/Wave | (future Notifications)          |

---

## §4 — Domain Boundaries

### 4.1 Bounded contexts

| Module         | Responsibility                          | Data ownership          | Data source       | Audience                  |
| -------------- | --------------------------------------- | ----------------------- | ----------------- | ------------------------- |
| Authentication | Admin login, JWT issue/refresh, logout  | refresh_token           | Internal          | Admin                     |
| Users          | User CRUD, status                       | users                   | Internal          | Admin                     |
| Roles          | Role & permission management            | roles, role_permissions | Internal          | Admin                     |
| Stations       | Station CRUD, status, archive           | stations                | Internal          | Admin write + Public read |
| MarineCalendar | Unified calendar read projection        | — (read model)          | Projections       | Public + Admin read       |
| CalendarAdmin  | Calendar entry CRUD                     | calendar_entries        | Internal          | Admin                     |
| Tide           | Tide data fetch, cache, serve           | tide_cache              | External API      | Public + Admin read       |
| MarineWeather  | Weather fetch, cache, serve             | weather_cache           | External API      | Public + Admin read       |
| Wind           | Wind fetch, cache, serve                | wind_cache              | External API      | Public + Admin read       |
| Wave           | Wave height fetch, cache, serve         | wave_cache              | External API      | Public + Admin read       |
| MoonPhase      | Moon phase computation                  | —                       | Local computation | Public + Admin read       |
| SunriseSunset  | Sunrise/sunset/twilight                 | —                       | Local computation | Public + Admin read       |
| HijriCalendar  | Gregorian→Hijri conversion              | —                       | Local computation | Public + Admin read       |
| MarineAlerts   | Alert CRUD + public read                | alerts                  | Internal          | Admin write + Public read |
| Dashboard      | Admin operational summary               | — (read model)          | Projections       | Admin                     |
| Audit          | Append-only audit stream                | audit_events            | Internal          | Admin                     |
| Settings       | Org config, provider config             | settings                | Internal          | Admin                     |
| About          | Static content                          | —                       | Static/config     | Public                    |
| SharedKernel   | IDs, Result/Error, AuthPrincipal, Clock | Primitives              | —                 | Cross-cutting             |

### 4.2 Aggregates (logical)

#### Authentication

- **RefreshToken** (root): `id, userId, tokenHash, familyId, expiresAt, revokedAt, replacedBy, createdAt`.
- Invariants: revoked tokens cannot refresh; reuse of a revoked token invalidates the family; only the hash is persisted.

#### Users

- **User** (root): `id, email, name, status, roleIds, timestamps`.
- **Role** (root): `id, name, permissionCodes`.
- Invariants: disabled users cannot authenticate; roles grant only known permission codes.

#### Stations

- **Station** (root): `id, name, code, latitude, longitude, timezone, status, metadata`.
- Invariants: code unique per org; cannot hard-delete if referenced.

#### CalendarAdmin

- **CalendarEntry** (root): `id, stationId, date, title, payload, status, timestamps`.
- Invariants: entry is station-scoped; soft-delete on removal.

#### MarineAlerts

- **Alert** (root): `id, stationId?, severity, title, body, status, publishAt, expiresAt, timestamps`.
- Invariants: only `published` alerts appear in public read; expired alerts hidden from public.

#### Sourced data (Tide/Weather/Wind/Wave)

- **XCache** (root): `id, stationId, parameter, fetchedAt, validUntil, payload (JSONB), source`.
- Invariants: `validUntil` determines freshness; past `validUntil` = stale; cache entries replaceable.

#### Computable (Moon/Sun/Hijri)

- No persistent aggregate. Pure functions. Same input → same output, no I/O.

#### Audit

- **AuditEvent** (root, append-only): `id, actorId, action, entityType, entityId, at, payload`.
- Invariants: no update/delete in application paths.

#### Settings

- **Setting** (root): `id, key, value, category, updatedAt`.
- Invariants: API keys stored as secrets (never returned in plaintext); keys namespaced by module.

### 4.3 Public vs admin boundary per module

| Module                 | Public reads via       | Admin writes via                            | Shared table                                               |
| ---------------------- | ---------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Stations               | `/api/public/stations` | `/api/v1/stations`                          | `stations` (Stations module owns; admin writes, both read) |
| MarineAlerts           | `/api/public/alerts`   | `/api/v1/alerts`                            | `alerts` (Alerts module owns; admin writes, both read)     |
| MarineCalendar         | `/api/public/calendar` | `/api/v1/calendar` (CRUD via CalendarAdmin) | `calendar_entries` + projections                           |
| Tide/Weather/Wind/Wave | `/api/public/<x>`      | `/api/v1/<x>` (refresh/config only)         | `<x>_cache`                                                |
| Moon/Sun/Hijri         | `/api/public/<x>`      | n/a (pure computation, no admin CRUD)       | —                                                          |

The boundary is enforced at the **controller layer** (`src/api/public/` vs `src/api/admin/`) and reinforced by RBAC. The shared table is acceptable because writes come only from the owning module's admin use-cases; public reads go through the owning module's query port, never raw SQL.

### 4.4 Modeling rules for engineers

1. One aggregate root per transaction boundary where possible.
2. Reference other contexts by ID, not by embedding full aggregates.
3. Put business rules in domain; not only in UI.
4. Name classes and tables after ubiquitous language.
5. Computable modules are pure functions — no I/O, no DB.
6. Sourced data modules use the adapter pattern — domain sees only the port, infrastructure sees the external API.
7. Public controllers may only invoke read-side use-cases; a CI lint rule enforces this.
8. Document new aggregates under `docs/domains/`.

---

## Change log

| Version | Date       | Notes                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Hub module dependency + domain boundaries — public/admin split (ADR-0011) |
