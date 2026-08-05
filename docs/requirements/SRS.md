# Software Requirements Specification (SRS) — MarineOps Hub

**Version:** 2.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline (Frozen)  
**Authorised by:** ADR-0011  
**Related:** [PRODUCT_VISION](../vision/PRODUCT_VISION.md), [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md), [MODULE_DEPENDENCY](../architecture/MODULE_DEPENDENCY.md), [ERD](../data/ERD.md), [OPENAPI](../api/OPENAPI.md)

> Supersedes the MarineOps Calendar v1.0.0 SRS for the active scope. The Calendar SRS is preserved at `archive/calendar/requirements/SRS.md`.

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the functional and non-functional requirements for MarineOps Hub. Engineers implement only what is specified here or approved via change control (updated SRS + ADR when needed).

### 1.2 Scope

MarineOps Hub is a two-portal marine information platform:

- **Public Portal** (no login): Tide, Marine Weather, Moon Phase, Sunrise/Sunset, Marine Calendar, Marine Alerts, Stations, About.
- **Admin Portal** (login required, administrators & fisheries officers): Dashboard, User Management, Role & Permission, Calendar CRUD, Station CRUD, Alerts CRUD, Audit Log, Settings.

**Future modules** (each gated by its own ADR): Patrol Planner, AIS, VMS, Vessel Monitoring.

**Out of scope for v2.0.0:** MFA, email/webhook notifications, CSV/PDF export, multi-tenant SaaS, OIDC IdP, station-scoped officer roles.

### 1.3 Definitions

| Term              | Definition                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| Public Portal     | Anonymous browser application; no authentication                                    |
| Admin Portal      | Authenticated application for admins & fisheries officers                           |
| Surface           | An API prefix group: `/api/public` (read-only, no auth) or `/api/v1` (JWT + RBAC)   |
| Station           | Geographic reference point where environmental data is observed/predicted           |
| Marine Calendar   | Unified read projection combining environmental, astronomical, and operational data |
| Marine Alert      | Publishable notice shown on the Public Portal when `published` and not expired      |
| Sourced Data      | Environmental data fetched from external APIs (tide, weather, wind, wave)           |
| Computable Data   | Astronomical data computed locally (moon phase, sunrise/sunset, Hijri date)         |
| Data Freshness    | Status: `fresh`, `stale`, or `unavailable` per ADR-0008                             |
| Admin             | Role with all permission codes                                                      |
| Fisheries Officer | Role with a read + alert-write subset                                               |

### 1.4 References

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/MODULE_DEPENDENCY.md`
- `docs/architecture/AUTHENTICATION.md`, `AUTHORIZATION.md`, `ROUTES.md`, `API_VERSIONING.md`, `DATABASE_OWNERSHIP.md`
- `docs/data/ERD.md`, `docs/api/OPENAPI.md`, `docs/api/SEQUENCE_DIAGRAMS.md`
- ADR-0008, ADR-0009, ADR-0010, ADR-0011

### 1.5 Audience split (binding)

| Requirement prefix | Surface       | Portal        | Auth                        |
| ------------------ | ------------- | ------------- | --------------------------- |
| `FR-PUB-*`         | `/api/public` | Public Portal | None                        |
| `FR-ADM-*`         | `/api/v1`     | Admin Portal  | JWT + RBAC                  |
| `FR-SHARED-*`      | Both          | Both          | None (public) / JWT (admin) |

---

## 2. Overall description

### 2.1 Product perspective

MarineOps Hub is a greenfield web platform (one backend + two frontends). It supersedes the archived MarineOps Calendar per ADR-0011.

### 2.2 User classes

| ID     | Class             | Description                       | Portal         |
| ------ | ----------------- | --------------------------------- | -------------- |
| U-ANON | Anonymous visitor | Browses public marine information | Public         |
| U-ADM  | Admin             | Full administrative access        | Admin          |
| U-OFC  | Fisheries Officer | Read + alert management subset    | Admin          |
| U-AUD  | Auditor (future)  | Read-only admin access            | Admin (future) |

### 2.3 Operating environment

- Modern browsers (last two major versions of Chrome, Edge, Firefox, Safari).
- Server: container-friendly Linux or equivalent cloud runtime.
- Database: PostgreSQL 16.
- Time: store UTC; display user/org timezone.
- External APIs: tide/weather providers accessible over HTTPS.

### 2.4 Design constraints

- Follow `docs/structure/FOLDER_STRUCTURE.md`.
- Follow `docs/governance/ENGINEERING_STANDARDS.md` and `DEVELOPMENT_RULES.md`.
- No secrets in source control.
- API-first: portals consume only `/api/public` or `/api/v1`.
- Domain layer must have no I/O (ADR-0008 adapter pattern).
- Public surface is GET-only and returns no PII.

### 2.5 Assumptions

- Single organization in v2.0.0.
- Public Portal users have network connectivity.
- External data APIs (tide/weather) are available with reasonable uptime.
- Computable data (moon/sun/Hijri) requires no external dependency.

---

## 3. Functional requirements

Requirements use IDs `FR-XXX`. Priority: **P0** must for MVP, **P1** near-term, **P2** later.

### 3.1 Authentication (admin only)

| ID          | Priority | Requirement                                                                                                             |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| FR-AUTH-001 | P0       | Admins/officers shall authenticate with email and password via `/api/v1/auth/login`.                                    |
| FR-AUTH-002 | P0       | Only `Admin` and `FisheriesOfficer` roles may authenticate; all others are rejected.                                    |
| FR-AUTH-003 | P0       | Access tokens (JWT) shall have a short TTL (15 min); refresh tokens shall rotate on use.                                |
| FR-AUTH-004 | P0       | Refresh tokens shall be stored as httpOnly cookies; reuse of a revoked refresh token shall invalidate the token family. |
| FR-AUTH-005 | P0       | Logout shall revoke the refresh token and clear the cookie.                                                             |
| FR-AUTH-006 | P0       | Disabled users cannot authenticate.                                                                                     |
| FR-AUTH-007 | P1       | Password reset / invite flow for new admin users.                                                                       |
| FR-AUTH-008 | P2       | Optional MFA for the Admin role.                                                                                        |

### 3.2 Users (admin)

| ID         | Priority | Requirement                                                                   |
| ---------- | -------- | ----------------------------------------------------------------------------- |
| FR-USR-001 | P0       | Admins shall create, read, update, and disable users.                         |
| FR-USR-002 | P0       | User shall store: email, name, status, roleIds, timezone, locale, timestamps. |
| FR-USR-003 | P0       | Admins shall assign roles to users.                                           |
| FR-USR-004 | P1       | Users shall update their own profile (name, timezone, locale).                |
| FR-USR-005 | P1       | Users shall change their own password.                                        |

### 3.3 Roles & Permissions (admin)

| ID         | Priority | Requirement                                                              |
| ---------- | -------- | ------------------------------------------------------------------------ |
| FR-ROL-001 | P0       | Admins shall create, read, update roles and their permission codes.      |
| FR-ROL-002 | P0       | System shall seed `Admin` and `FisheriesOfficer` roles at deploy.        |
| FR-ROL-003 | P0       | Permission codes shall match the catalog in `AUTHORIZATION.md` §4.       |
| FR-ROL-004 | P1       | Deleting a role shall fail if users are still assigned (reassign first). |

### 3.4 Stations (shared: admin write + public read)

| ID         | Priority | Requirement                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------- |
| FR-STN-001 | P0       | Admins shall create, read, update, and archive stations.                          |
| FR-STN-002 | P0       | Station shall store: name, code, latitude, longitude, timezone, status, metadata. |
| FR-STN-003 | P0       | Station code shall be unique within the organization.                             |
| FR-STN-004 | P0       | Soft-delete/archive stations; no hard delete if referenced.                       |
| FR-STN-005 | P0       | Public Portal shall list and view active stations via `/api/public/stations`.     |
| FR-STN-006 | P1       | Admins shall search/filter stations by name, code, status.                        |
| FR-STN-007 | P1       | Public station responses shall exclude admin-only metadata.                       |

### 3.5 Tide (sourced, shared read)

| ID         | Priority | Requirement                                                                                                                      |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FR-TID-001 | P0       | System shall provide tide height/timing data for a station and date range via `/api/public/tide` and (admin) `/api/public/tide`. |
| FR-TID-002 | P0       | Tide data shall be fetched via an adapter port (ADR-0008) and cached in PostgreSQL with a TTL.                                   |
| FR-TID-003 | P0       | When the external tide API is unreachable, system shall serve cached data with a `stale` flag.                                   |
| FR-TID-004 | P1       | System shall expose tide data freshness status (last fetched, valid until).                                                      |
| FR-TID-005 | P1       | Admin shall configure tide data provider settings (API endpoint, API key) via Settings.                                          |
| FR-TID-006 | P1       | Admin with `settings.write` may trigger a manual tide refresh via `/api/v1/tide/refresh`.                                        |

### 3.6 Marine Weather (sourced, shared read)

| ID         | Priority | Requirement                                                                                |
| ---------- | -------- | ------------------------------------------------------------------------------------------ |
| FR-WEA-001 | P0       | System shall provide weather forecast data for a station and date range.                   |
| FR-WEA-002 | P0       | Weather data shall be fetched via adapter port and cached with a TTL.                      |
| FR-WEA-003 | P0       | On external weather API failure, system shall serve cached data with `stale` flag.         |
| FR-WEA-004 | P0       | Weather data shall include at minimum: temperature, conditions, visibility, precipitation. |
| FR-WEA-005 | P1       | Admin shall configure weather data provider settings.                                      |
| FR-WEA-006 | P1       | Admin may trigger a manual weather refresh.                                                |

### 3.7 Wind (sourced, shared read)

| ID         | Priority | Requirement                                                                            |
| ---------- | -------- | -------------------------------------------------------------------------------------- |
| FR-WND-001 | P0       | System shall provide wind data (speed, direction, gusts) for a station and date range. |
| FR-WND-002 | P0       | Wind data shall be fetched via adapter port and cached with a TTL.                     |
| FR-WND-003 | P0       | On external wind API failure, system shall serve cached data with `stale` flag.        |
| FR-WND-004 | P1       | Public Portal shall display wind speed and direction graphically.                      |

### 3.8 Wave Height (sourced, shared read)

| ID         | Priority | Requirement                                                                     |
| ---------- | -------- | ------------------------------------------------------------------------------- |
| FR-WAV-001 | P0       | System shall provide wave height data for a station and date range.             |
| FR-WAV-002 | P0       | Wave data shall be fetched via adapter port and cached with a TTL.              |
| FR-WAV-003 | P0       | On external wave API failure, system shall serve cached data with `stale` flag. |
| FR-WAV-004 | P1       | Public Portal shall display wave height graphically.                            |

### 3.9 Moon Phase (computable, shared read)

| ID         | Priority | Requirement                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------- |
| FR-MON-001 | P0       | System shall compute moon phase for any given date.                               |
| FR-MON-002 | P0       | Moon phase computation shall be local (no external API) per ADR-0008.             |
| FR-MON-003 | P0       | Moon phase shall include: phase name, illumination percentage, moonrise, moonset. |
| FR-MON-004 | P1       | Public Portal shall display moon phase icon and illumination for each date.       |

### 3.10 Sunrise / Sunset (computable, shared read)

| ID         | Priority | Requirement                                                                      |
| ---------- | -------- | -------------------------------------------------------------------------------- |
| FR-SUN-001 | P0       | System shall compute sunrise and sunset times for a station (lat/long) and date. |
| FR-SUN-002 | P0       | Sunrise/sunset computation shall be local (no external API).                     |
| FR-SUN-003 | P0       | Public Portal shall display sunrise and sunset times for each date.              |
| FR-SUN-004 | P1       | System shall compute civil/nautical/astronomical twilight times.                 |

### 3.11 Hijri Calendar (computable, shared read)

| ID         | Priority | Requirement                                                      |
| ---------- | -------- | ---------------------------------------------------------------- |
| FR-HIJ-001 | P0       | System shall convert Gregorian dates to Hijri dates.             |
| FR-HIJ-002 | P0       | Hijri conversion shall be local (no external API).               |
| FR-HIJ-003 | P0       | Public Portal shall display Hijri date alongside Gregorian date. |

### 3.12 Marine Calendar (shared read projection)

| ID         | Priority | Requirement                                                                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-CAL-001 | P0       | System shall provide a unified calendar view for a selected date range and station via `/api/public/calendar`.                                    |
| FR-CAL-002 | P0       | Calendar shall display: tide, sunrise/sunset, moon phase, Hijri date, weather summary, wind, wave height for the selected station and date range. |
| FR-CAL-003 | P0       | Calendar shall support day, week, and month views.                                                                                                |
| FR-CAL-004 | P1       | Calendar shall indicate data freshness (fresh/stale) for each sourced data type per ADR-0008.                                                     |
| FR-CAL-005 | P1       | Calendar shall support filtering by data type (show/hide tide, weather, etc.).                                                                    |

### 3.13 Calendar Admin (admin CRUD)

| ID         | Priority | Requirement                                                                                     |
| ---------- | -------- | ----------------------------------------------------------------------------------------------- |
| FR-CAD-001 | P0       | Admins with `calendar.write` shall create, update, delete calendar entries linked to a station. |
| FR-CAD-002 | P0       | Calendar entry shall store: stationId, date, title, payload, status, timestamps.                |
| FR-CAD-003 | P0       | Calendar entry changes shall emit audit events.                                                 |
| FR-CAD-004 | P1       | Admins shall list/filter calendar entries by station, date range, status.                       |

### 3.14 Marine Alerts (shared: admin write + public read)

| ID         | Priority | Requirement                                                                                     |
| ---------- | -------- | ----------------------------------------------------------------------------------------------- |
| FR-ALR-001 | P0       | Admins with `alert.write` shall create, update, publish, and unpublish alerts.                  |
| FR-ALR-002 | P0       | Alert shall store: stationId?, severity, title, body, status, publishAt, expiresAt, timestamps. |
| FR-ALR-003 | P0       | Public Portal shall list only `published` and non-expired alerts via `/api/public/alerts`.      |
| FR-ALR-004 | P0       | Alert state changes shall emit audit events.                                                    |
| FR-ALR-005 | P1       | Admins shall filter alerts by station, severity, status.                                        |
| FR-ALR-006 | P1       | Public alert responses shall exclude internal workflow fields.                                  |

### 3.15 Dashboard (admin read projection)

| ID         | Priority | Requirement                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------- |
| FR-DSH-001 | P0       | Dashboard shall show a summary of today's key conditions for configured stations. |
| FR-DSH-002 | P0       | Dashboard shall show counts of active alerts and data freshness alerts.           |
| FR-DSH-003 | P1       | Dashboard shall support filtering by station.                                     |
| FR-DSH-004 | P1       | Dashboard shall show quick links to calendar and stations management.             |

### 3.16 Audit (admin)

| ID         | Priority | Requirement                                                                                                         |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| FR-AUD-001 | P0       | Persist audit events for create/update/delete/status on stations, calendar entries, alerts, users, roles, settings. |
| FR-AUD-002 | P0       | Audit entries: actor, action, entity, timestamp, before/after or diff summary.                                      |
| FR-AUD-003 | P0       | Audit is append-only — no update or delete in application paths.                                                    |
| FR-AUD-004 | P1       | Admins with `audit.read` shall query audit by entity, actor, date range.                                            |

### 3.17 Settings (admin)

| ID         | Priority | Requirement                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------- |
| FR-SET-001 | P0       | Admin shall manage organization profile (name, timezone, locale).                                 |
| FR-SET-002 | P0       | Admin shall manage external data provider settings (API endpoints, API keys — stored as secrets). |
| FR-SET-003 | P1       | Admin shall manage reference data (alert severities, station types).                              |
| FR-SET-004 | P2       | Feature flags per module.                                                                         |

### 3.18 About (public, static)

| ID         | Priority | Requirement                                                                                        |
| ---------- | -------- | -------------------------------------------------------------------------------------------------- |
| FR-ABT-001 | P0       | Public Portal shall expose an About page with static platform information via `/api/public/about`. |
| FR-ABT-002 | P1       | About content shall be configurable by admins via Settings.                                        |

### 3.19 Health (platform)

| ID         | Priority | Requirement                                                             |
| ---------- | -------- | ----------------------------------------------------------------------- |
| FR-HLT-001 | P0       | System shall expose `/health/live` and `/health/ready` unauthenticated. |

### 3.20 Future modules (deferred — each requires its own ADR)

| ID       | Priority | Requirement                                                       |
| -------- | -------- | ----------------------------------------------------------------- |
| FR-PAT-* | P2       | Patrol Planner — patrol plan CRUD, lifecycle, condition snapshot. |
| FR-AIS-* | P2       | AIS feed ingestion and read.                                      |
| FR-VMS-* | P2       | VMS feed ingestion and read.                                      |
| FR-VES-* | P2       | Vessel monitoring aggregation across AIS/VMS.                     |

---

## 4. Non-functional requirements

| ID           | Category        | Requirement                                                                                           |
| ------------ | --------------- | ----------------------------------------------------------------------------------------------------- |
| NFR-SEC-001  | Security        | All `/api/v1` endpoints authenticated except the four auth routes; `/api/public` never authenticated. |
| NFR-SEC-002  | Security        | Authorization checked per action at the use-case layer (not only UI hide).                            |
| NFR-SEC-003  | Security        | Passwords hashed with argon2id; secrets in env/secret store.                                          |
| NFR-SEC-004  | Security        | HTTPS in all non-local environments.                                                                  |
| NFR-SEC-005  | Security        | Input validation on all write APIs (Zod).                                                             |
| NFR-SEC-006  | Security        | External API keys never exposed to client, domain layer, or public responses.                         |
| NFR-SEC-007  | Security        | Public responses contain no PII and no admin-only fields.                                             |
| NFR-PRV-001  | Privacy         | Personal data minimized; retention policy documented.                                                 |
| NFR-REL-001  | Reliability     | Target API availability 99.5% for production.                                                         |
| NFR-REL-002  | Reliability     | Graceful degradation: external API failure serves cached data with `stale` flag.                      |
| NFR-PERF-001 | Performance     | p95 list APIs < 500ms for typical dataset sizes.                                                      |
| NFR-PERF-002 | Performance     | Pagination required on all list endpoints (both surfaces).                                            |
| NFR-PERF-003 | Performance     | Computable data (moon/sun/Hijri) response < 100ms.                                                    |
| NFR-SCL-001  | Scalability     | Design for modular growth; avoid cross-module DB joins as default.                                    |
| NFR-USA-001  | Usability       | Primary flows completable without training manual.                                                    |
| NFR-I18N-001 | i18n            | UI strings externalizable; English first; Hijri calendar native.                                      |
| NFR-OBS-001  | Observability   | Structured logs, correlation IDs, health endpoints.                                                   |
| NFR-OBS-002  | Observability   | Error tracking in non-dev environments.                                                               |
| NFR-OBS-003  | Observability   | External API call monitoring (latency, error rate, cache hit rate).                                   |
| NFR-OBS-004  | Observability   | Public vs admin traffic tagged separately for alerting.                                               |
| NFR-MNT-001  | Maintainability | Domain modules isolatable; public APIs versioned when breaking.                                       |
| NFR-DAT-001  | Data            | External data cache TTL configurable per data type.                                                   |
| NFR-RATE-001 | Rate-limiting   | `/api/public` rate-limited per IP at the edge.                                                        |

---

## 5. Data requirements (logical)

Core entities (logical; physical schema in `docs/data/ERD.md`):

- User, Role, RolePermission, UserRole
- Station
- CalendarEntry
- Alert
- RefreshToken
- AuditEvent
- Setting
- TideCache, WeatherCache, WindCache, WaveCache
- (MoonPhaseData, SunriseSunsetData, HijriDateData — computed, no table)

Physical schema is owned by Prisma schema and `docs/data/ERD.md`. Ownership rules in `docs/architecture/DATABASE_OWNERSHIP.md`.

---

## 6. External interfaces

### 6.1 User interfaces

- **Public Portal** (`apps/web-public`): tide, weather, moon, sun, calendar, alerts, stations, about.
- **Admin Portal** (`apps/web-admin`): login, dashboard, users, roles, calendar CRUD, stations CRUD, alerts CRUD, audit, settings.

### 6.2 Software interfaces

- `/api/public` — read-only HTTP JSON, no auth.
- `/api/v1` — HTTP JSON, JWT + RBAC.
- External data provider APIs (tide, weather, wind, wave) — via adapter ports.
- Future: email provider, OIDC IdP, webhooks.

### 6.3 Hardware interfaces

- None (standard compute and storage only).

---

## 7. Requirements traceability (MVP)

MVP = all **P0** FRs + **NFR-SEC-***, **NFR-PERF-002**, **NFR-OBS-001**, pagination and RBAC end-to-end.

| Epic                | P0 requirement IDs |
| ------------------- | ------------------ |
| Authentication      | FR-AUTH-001..006   |
| Users               | FR-USR-001..003    |
| Roles & Permissions | FR-ROL-001..003    |
| Stations            | FR-STN-001..005    |
| Tide                | FR-TID-001..003    |
| Marine Weather      | FR-WEA-001..004    |
| Wind                | FR-WND-001..003    |
| Wave                | FR-WAV-001..003    |
| Moon Phase          | FR-MON-001..003    |
| Sunrise/Sunset      | FR-SUN-001..003    |
| Hijri Calendar      | FR-HIJ-001..003    |
| Marine Calendar     | FR-CAL-001..003    |
| Calendar Admin      | FR-CAD-001..003    |
| Marine Alerts       | FR-ALR-001..004    |
| Dashboard           | FR-DSH-001..002    |
| Audit               | FR-AUD-001..003    |
| Settings            | FR-SET-001..002    |
| About               | FR-ABT-001         |
| Health              | FR-HLT-001         |

---

## 8. Acceptance criteria (global)

A requirement is accepted when:

1. Behavior matches this SRS (or approved revision).
2. Covered by automated tests at appropriate level (see Definition of Done).
3. Documented if it introduces a new public API or domain rule.
4. Security and audit obligations met for that feature.
5. Data freshness status is visible to users for all sourced data.
6. **Public-facing features verified to return no PII / no admin fields.**

---

## 9. Change log

| Version | Date       | Notes                                         |
| ------- | ---------- | --------------------------------------------- |
| 2.0.0   | 2026-07-31 | Initial Hub SRS — two-portal scope (ADR-0011) |
