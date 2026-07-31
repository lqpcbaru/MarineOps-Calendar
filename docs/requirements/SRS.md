# Software Requirements Specification (SRS) — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline  
**Authorised by:** PMD-0001  
**Related:** [PRODUCT_VISION](../vision/PRODUCT_VISION.md), [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md), [DOMAIN_MODEL](../architecture/DOMAIN_MODEL.md)

---

## 1. Introduction

### 1.1 Purpose

This SRS defines functional and non-functional requirements for MarineOps Calendar. Engineers implement only what is specified here or approved via change control (updated SRS + ADR when needed).

### 1.2 Scope

MarineOps Calendar covers:

- Authentication & access  
- Users & roles  
- Stations (geographic reference points)  
- Marine Calendar (unified operational calendar)  
- Tide data  
- Moon Phase data  
- Hijri Calendar data  
- Weather data  
- Wind data  
- Wave Height data  
- Sunrise / Sunset data  
- Dashboard  
- Patrol Planner  
- Notifications  
- Reports  
- Settings  

Out of scope (per PMD-0001): AIS, VMS, Vessel Tracking, Live Tracking, Geofence, Heatmap.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Station | Geographic reference point where environmental data is observed or predicted |
| Marine Calendar | Unified calendar combining environmental, astronomical, and operational data |
| Patrol Plan | Scheduled marine operational activity with environmental context |
| Sourced Data | Environmental data fetched from external APIs (tide, weather, wind, wave) |
| Computable Data | Astronomical data computed locally (sunrise, sunset, moon phase, Hijri dates) |
| Data Freshness | Status indicating whether cached data is current or stale (per ADR-0008) |
| Organization | Tenant boundary for data isolation (v1: single org) |

### 1.4 References

- `docs/vision/PRODUCT_VISION.md`  
- `docs/architecture/SYSTEM_ARCHITECTURE.md`  
- `docs/architecture/DOMAIN_MODEL.md`  
- `docs/roadmap/ROADMAP.md`  
- ADR-0006 through ADR-0010  

---

## 2. Overall description

### 2.1 Product perspective

MarineOps Calendar is a greenfield web application (API + web client). It replaces the archived MarineOps Enforcement project per PMD-0001.

### 2.2 User classes

| ID | Class | Description |
|----|-------|-------------|
| U-ADM | Admin | Configures org, users, roles, stations, settings |
| U-PLN | Operations Planner | Plans patrols, views calendar, checks conditions |
| U-CMD | Patrol Commander | Views assigned patrol plans, receives notifications |
| U-STN | Station Manager | Manages station config, monitors data freshness |
| U-AUD | Auditor (read) | Read-only access to planning history and reports |

### 2.3 Operating environment

- Modern browsers (last two major versions of Chrome, Edge, Firefox, Safari)  
- Server: container-friendly Linux or equivalent cloud runtime  
- Database: PostgreSQL 16  
- Time: store UTC; display user/org timezone  
- External APIs: tide/weather providers accessible over HTTPS  

### 2.4 Design constraints

- Follow `docs/structure/FOLDER_STRUCTURE.md`  
- Follow `docs/governance/ENGINEERING_STANDARDS.md`  
- No secrets in source control  
- API-first: UI consumes public application APIs only  
- Domain layer must have no I/O (ADR-0008 adapter pattern)  

### 2.5 Assumptions

- Single organization in Phase 0–1  
- Users have network connectivity for core workflows  
- External data APIs (tide/weather) are available with reasonable uptime  
- Computable data (sun/moon/Hijri) requires no external dependency  

---

## 3. Functional requirements

Requirements use IDs `FR-XXX`. Priority: **P0** must for MVP, **P1** near-term, **P2** later.

### 3.1 Authentication

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTH-001 | P0 | Users shall authenticate with email and password. |
| FR-AUTH-002 | P0 | System shall support role-based access control (RBAC). |
| FR-AUTH-003 | P0 | Sessions shall expire; logout shall invalidate tokens per ADR-0010. |
| FR-AUTH-004 | P0 | Access tokens (JWT) shall have short TTL; refresh tokens shall rotate on use. |
| FR-AUTH-005 | P0 | Refresh tokens shall be stored as httpOnly cookies; reuse of a revoked refresh token shall invalidate the token family. |
| FR-AUTH-006 | P1 | Password reset / invite flow for new users. |
| FR-AUTH-007 | P1 | Optional MFA for privileged roles. |

### 3.2 Users

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-USR-001 | P0 | Admins shall create, read, update, and disable users. |
| FR-USR-002 | P0 | User shall store: email, name, status, roleIds, timestamps. |
| FR-USR-003 | P0 | Disabled users cannot authenticate. |
| FR-USR-004 | P0 | Admins shall assign roles to users. |
| FR-USR-005 | P1 | Users shall update their own profile (name, timezone, locale). |
| FR-USR-006 | P1 | Users shall change their own password. |

### 3.3 Stations

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-001 | P0 | Admins shall create, read, update, and archive stations. |
| FR-STN-002 | P0 | Station shall store: name, code, latitude, longitude, timezone, status, metadata. |
| FR-STN-003 | P0 | Station code shall be unique within the organization. |
| FR-STN-004 | P0 | Soft-delete/archive stations; no hard delete if referenced by patrol plans or cached data. |
| FR-STN-005 | P1 | Search and filter stations by name, code, status. |
| FR-STN-006 | P1 | Station shall track data freshness status per connected data module (tide, weather, etc.). |

### 3.4 Marine Calendar

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-CAL-001 | P0 | System shall provide a unified calendar view for a selected date range and station. |
| FR-CAL-002 | P0 | Calendar shall display: tide data, sunrise/sunset, moon phase, Hijri date, weather summary, wind, wave height for the selected station and date range. |
| FR-CAL-003 | P0 | Calendar shall support day, week, and month views. |
| FR-CAL-004 | P0 | Calendar shall display patrol plans overlaid on environmental data. |
| FR-CAL-005 | P1 | Calendar shall indicate data freshness (fresh/stale) for each data type per ADR-0008. |
| FR-CAL-006 | P1 | Calendar shall support filtering by data type (show/hide tide, weather, etc.). |

### 3.5 Tide

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-TID-001 | P0 | System shall provide tide height/timing data for a station and date range. |
| FR-TID-002 | P0 | Tide data shall be fetched via an adapter port (ADR-0008) and cached in PostgreSQL with a TTL. |
| FR-TID-003 | P0 | When external tide API is unreachable, system shall serve cached data with a `stale` flag. |
| FR-TID-004 | P1 | System shall expose tide data freshness status (last fetched, valid until). |
| FR-TID-005 | P1 | Admin shall configure tide data provider settings (API endpoint, API key) per station or globally. |

### 3.6 Moon Phase

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-MON-001 | P0 | System shall compute moon phase for any given date. |
| FR-MON-002 | P0 | Moon phase computation shall be local (no external API) per ADR-0008. |
| FR-MON-003 | P0 | Moon phase shall include: phase name, illumination percentage, moonrise, moonset. |
| FR-MON-004 | P1 | Calendar shall display moon phase icon and illumination for each date. |

### 3.7 Hijri Calendar

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-HIJ-001 | P0 | System shall convert Gregorian dates to Hijri dates. |
| FR-HIJ-002 | P0 | Hijri date conversion shall be local (no external API) per ADR-0008. |
| FR-HIJ-003 | P0 | Calendar shall display Hijri date alongside Gregorian date. |
| FR-HIJ-004 | P1 | System shall support Hijri date-based filtering for reports. |

### 3.8 Weather

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-WEA-001 | P0 | System shall provide weather forecast data for a station and date range. |
| FR-WEA-002 | P0 | Weather data shall be fetched via adapter port (ADR-0008) and cached with a TTL. |
| FR-WEA-003 | P0 | When external weather API is unreachable, system shall serve cached data with `stale` flag. |
| FR-WEA-004 | P0 | Weather data shall include at minimum: temperature, conditions, visibility, precipitation. |
| FR-WEA-005 | P1 | Admin shall configure weather data provider settings. |

### 3.9 Wind

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-WND-001 | P0 | System shall provide wind data (speed, direction, gusts) for a station and date range. |
| FR-WND-002 | P0 | Wind data shall be fetched via adapter port (ADR-0008) and cached with a TTL. |
| FR-WND-003 | P0 | When external wind API is unreachable, system shall serve cached data with `stale` flag. |
| FR-WND-004 | P1 | Calendar shall display wind speed and direction graphically. |

### 3.10 Wave Height

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-WAV-001 | P0 | System shall provide wave height data for a station and date range. |
| FR-WAV-002 | P0 | Wave data shall be fetched via adapter port (ADR-0008) and cached with a TTL. |
| FR-WAV-003 | P0 | When external wave API is unreachable, system shall serve cached data with `stale` flag. |
| FR-WAV-004 | P1 | Calendar shall display wave height graphically. |

### 3.11 Sunrise / Sunset

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-SUN-001 | P0 | System shall compute sunrise and sunset times for a station (lat/long) and date. |
| FR-SUN-002 | P0 | Sunrise/sunset computation shall be local (no external API) per ADR-0008. |
| FR-SUN-003 | P0 | Calendar shall display sunrise and sunset times for each date. |
| FR-SUN-004 | P1 | System shall compute civil/nautical/astronomical twilight times. |

### 3.12 Dashboard

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-DSH-001 | P0 | Dashboard shall show a summary of today's key conditions for configured stations. |
| FR-DSH-002 | P0 | Dashboard shall show counts of active patrol plans, upcoming plans, and data freshness alerts. |
| FR-DSH-003 | P1 | Dashboard shall support filtering by station. |
| FR-DSH-004 | P1 | Dashboard shall show quick links to calendar and patrol planner. |

### 3.13 Patrol Planner

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-PAT-001 | P0 | Users with permission shall create patrol plans linked to a station. |
| FR-PAT-002 | P0 | Patrol plan shall include: title, description, station, start time, end time, status, assignees, creator, timestamps. |
| FR-PAT-003 | P0 | Patrol plan status lifecycle: `Draft → Scheduled → Active → Completed → Cancelled`. |
| FR-PAT-004 | P0 | Invalid status transitions shall be rejected with clear errors. |
| FR-PAT-005 | P0 | System shall record who changed status and when (audit). |
| FR-PAT-006 | P0 | Users shall list/filter patrol plans by station, status, assignee, date range. |
| FR-PAT-007 | P0 | Patrol plan shall snapshot environmental conditions at planning time (tide, weather, wind, wave, sun/moon). |
| FR-PAT-008 | P1 | Patrol plan shall support notes/comments. |
| FR-PAT-009 | P1 | System shall notify assignees on assignment and status changes. |

### 3.14 Notifications

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-NTF-001 | P1 | Notify assignee on patrol plan assignment and status changes (in-app minimum). |
| FR-NTF-002 | P1 | Notify when data freshness transitions to stale for a configured station. |
| FR-NTF-003 | P2 | Email/webhook notifications. |

### 3.15 Reports

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-RPT-001 | P1 | System shall generate patrol plan reports (list, summary) for a date range and station. |
| FR-RPT-002 | P1 | Reports shall include environmental conditions snapshot from the patrol plan. |
| FR-RPT-003 | P2 | Export reports as CSV/PDF. |
| FR-RPT-004 | P2 | Generate data freshness audit report (what was fresh vs. stale at planning time). |

### 3.16 Settings

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-SET-001 | P0 | Admin shall manage organization profile (name, timezone, locale). |
| FR-SET-002 | P0 | Admin shall manage external data provider settings (API endpoints, API keys — stored as secrets). |
| FR-SET-003 | P1 | Admin shall manage reference data (patrol types, statuses, station types). |
| FR-SET-004 | P1 | Admin shall manage notification preferences. |
| FR-SET-005 | P2 | Feature flags per module. |

### 3.17 Audit

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUD-001 | P0 | Persist audit events for create/update/status on stations, patrol plans, users, roles, settings. |
| FR-AUD-002 | P0 | Audit entries: actor, action, entity, timestamp, before/after or diff summary. |
| FR-AUD-003 | P1 | Auditor can query patrol plan history and environmental snapshots for a station over a date range. |

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-SEC-001 | Security | All API endpoints authenticated except health/login. |
| NFR-SEC-002 | Security | Authorization checked per action (not only UI hide). |
| NFR-SEC-003 | Security | Passwords hashed with argon2id; secrets in env/secret store. |
| NFR-SEC-004 | Security | HTTPS in all non-local environments. |
| NFR-SEC-005 | Security | Input validation on all write APIs (Zod). |
| NFR-SEC-006 | Security | External API keys never exposed to client or domain layer. |
| NFR-PRV-001 | Privacy | Personal data minimized; retention policy documented. |
| NFR-REL-001 | Reliability | Target API availability 99.5% for production. |
| NFR-REL-002 | Reliability | Graceful degradation: external API failure serves cached data with `stale` flag. |
| NFR-PERF-001 | Performance | p95 list APIs < 500ms for typical dataset sizes. |
| NFR-PERF-002 | Performance | Pagination required on all list endpoints. |
| NFR-PERF-003 | Performance | Computable data (sun/moon/Hijri) response < 100ms. |
| NFR-SCL-001 | Scalability | Design for modular growth; avoid cross-module DB joins as default. |
| NFR-USA-001 | Usability | Primary flows completable without training manual. |
| NFR-I18N-001 | i18n | UI strings externalizable; English first; Hijri calendar native. |
| NFR-OBS-001 | Observability | Structured logs, correlation IDs, health endpoints. |
| NFR-OBS-002 | Observability | Error tracking in non-dev environments. |
| NFR-OBS-003 | Observability | External API call monitoring (latency, error rate, cache hit rate). |
| NFR-MNT-001 | Maintainability | Domain modules isolatable; public APIs versioned when breaking. |
| NFR-DAT-001 | Data | External data cache TTL configurable per data type. |

---

## 5. Data requirements (logical)

Core entities (logical, not physical schema):

- User, Role, Permission  
- Organization  
- Station  
- PatrolPlan, PatrolPlanNote, PatrolPlanConditionSnapshot  
- MarineCalendarEntry (read projection, not a primary aggregate)  
- TideCache, WeatherCache, WindCache, WaveCache  
- MoonPhaseData (computed)  
- HijriDateData (computed)  
- SunriseSunsetData (computed)  
- AuditEvent  
- Notification  
- Setting  

Physical schema is owned by Prisma schema and domain module docs.

---

## 6. External interfaces

### 6.1 User interfaces

- Web application: auth, dashboard, calendar, patrol planner, stations, reports, settings, admin  
- Responsive layout preferred  

### 6.2 Software interfaces

- RESTful HTTP JSON API (`/api/v1`)  
- External data provider APIs (tide, weather, wind, wave) — via adapter ports  
- Future: email provider, OIDC IdP, webhooks  

### 6.3 Hardware interfaces

- None (standard compute and storage only)

---

## 7. Requirements traceability (MVP)

MVP = all **P0** FRs + **NFR-SEC-***, **NFR-PERF-002**, **NFR-OBS-001**, pagination and RBAC end-to-end.

| Epic | P0 requirement IDs |
|------|--------------------|
| Authentication | FR-AUTH-001..005 |
| Users | FR-USR-001..004 |
| Stations | FR-STN-001..004 |
| Marine Calendar | FR-CAL-001..004 |
| Tide | FR-TID-001..003 |
| Moon Phase | FR-MON-001..003 |
| Hijri Calendar | FR-HIJ-001..003 |
| Weather | FR-WEA-001..004 |
| Wind | FR-WND-001..003 |
| Wave Height | FR-WAV-001..003 |
| Sunrise/Sunset | FR-SUN-001..003 |
| Dashboard | FR-DSH-001..002 |
| Patrol Planner | FR-PAT-001..007 |
| Settings | FR-SET-001..002 |
| Audit | FR-AUD-001..002 |

---

## 8. Acceptance criteria (global)

A requirement is accepted when:

1. Behavior matches this SRS (or approved revision).  
2. Covered by automated tests at appropriate level (see Definition of Done).  
3. Documented if it introduces a new public API or domain rule.  
4. Security and audit obligations met for that feature.  
5. Data freshness status is visible to users for all sourced data.  

---

## 9. Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-31 | Initial SRS for MarineOps Calendar (PMD-0001) |