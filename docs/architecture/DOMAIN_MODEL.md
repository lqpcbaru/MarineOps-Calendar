# Domain Model — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline  

---

## 1. Purpose

Defines ubiquitous language and aggregate boundaries for MarineOps Calendar. Implementation must use these names in code and APIs unless an ADR renames them.

---

## 2. Ubiquitous language

| Term | Meaning |
|------|---------|
| Organization | Legal/ops boundary owning users and stations |
| User | Authenticated person with roles |
| Role | Named set of permissions |
| Permission | Fine-grained action (e.g. `patrolplan.create`) |
| Station | Geographic reference point for environmental data |
| StationCode | Unique short identifier for a station within the org |
| Marine Calendar | Unified read projection combining environmental + astronomical + operational data |
| PatrolPlan | Scheduled marine operational activity with environmental context |
| PatrolPlanStatus | Lifecycle state of a patrol plan |
| ConditionSnapshot | Immutable record of environmental conditions captured at planning time |
| TideData | Tide height/timing for a station and time range |
| WeatherData | Weather forecast for a station and time range |
| WindData | Wind speed/direction/gusts for a station and time range |
| WaveData | Wave height for a station and time range |
| MoonPhaseData | Moon phase, illumination, moonrise, moonset (computed) |
| SunriseSunsetData | Sunrise, sunset, twilight times (computed) |
| HijriDateData | Hijri date corresponding to a Gregorian date (computed) |
| DataFreshness | Status indicating whether cached sourced data is current or stale |
| AuditEvent | Record of a significant state change |
| Setting | System configuration key-value |

---

## 3. Context map

```
[Authentication] ──provides principal──► [all modules]
[Users] ──provides user identity──► [PatrolPlanner, Notifications, Audit]
[Stations] ◄──references stationId── [Tide, Weather, Wind, Wave, Sunrise, PatrolPlanner, Calendar]
[Tide] ──adapter port──► external tide API
[Weather] ──adapter port──► external weather API
[Wind] ──adapter port──► external wind API
[Wave] ──adapter port──► external wave API
[MoonPhase] ──computes locally──► (no external dependency)
[SunriseSunset] ──computes locally──► (no external dependency)
[HijriCalendar] ──computes locally──► (no external dependency)
[MarineCalendar] ──reads projections from──► Tide, Weather, Wind, Wave, Moon, Sun, Hijri, PatrolPlanner
[PatrolPlanner] ──snapshots conditions via──► Tide, Weather, Wind, Wave, Moon, Sun
[PatrolPlanner] ──events──► Notifications
[all modules] ──emit──► Audit
[Settings] ──configures──► external data adapters, Notifications
```

---

## 4. Modules (bounded contexts)

| Module | Responsibility | Data ownership | Data source |
|--------|----------------|----------------|-------------|
| **Authentication** | Login, token issuance/refresh, logout | refresh_token table | Internal |
| **Users** | User CRUD, roles, RBAC | users, roles | Internal |
| **Stations** | Station CRUD, status, archive | stations | Internal |
| **MarineCalendar** | Unified calendar read projection | None (read model) | Projections |
| **Tide** | Tide data fetch, cache, serve | tide_cache | External API |
| **MoonPhase** | Moon phase computation | None (computed on demand) | Local computation |
| **HijriCalendar** | Gregorian→Hijri conversion | None (computed on demand) | Local computation |
| **Weather** | Weather data fetch, cache, serve | weather_cache | External API |
| **Wind** | Wind data fetch, cache, serve | wind_cache | External API |
| **Wave** | Wave data fetch, cache, serve | wave_cache | External API |
| **SunriseSunset** | Sunrise/sunset/twilight computation | None (computed on demand) | Local computation |
| **Dashboard** | Operational summary read model | None (read model) | Projections |
| **PatrolPlanner** | Patrol plan CRUD, lifecycle, condition snapshot | patrol_plans, patrol_plan_notes, condition_snapshots | Internal |
| **Notifications** | In-app/email dispatch | notifications | Internal |
| **Reports** | Report generation, export | None (read model) | Projections |
| **Settings** | Org profile, provider config, reference data | settings | Internal |
| **Audit** | Append-only audit stream | audit_events | Internal |
| **SharedKernel** | IDs, Result/Error, auth principal, time | Primitives only | — |

---

## 5. Aggregates (logical)

### 5.1 Authentication

- **RefreshToken** (root): id, userId, tokenHash, expiresAt, revokedAt, createdAt  

Invariants:

- Revoked tokens cannot be used for refresh  
- Reuse of a revoked token invalidates the entire token family (ADR-0010)  

### 5.2 Users

- **User** (root): id, email, name, status, roleIds, timestamps  
- **Role** (root): id, name, permissionCodes  

Invariants:

- Disabled users cannot authenticate  
- Roles only grant known permission codes  

### 5.3 Stations

- **Station** (root): id, organizationId, name, code, latitude, longitude, timezone, status, metadata  

Invariants:

- Station code unique per organization  
- Cannot hard-delete if patrol plans or cached data reference it  

### 5.4 PatrolPlanner

- **PatrolPlan** (root): id, stationId, title, description, startTime, endTime, status, assigneeIds, createdBy, conditionSnapshotId, timestamps  
- **PatrolPlanNote** (entity): id, patrolPlanId, body, authorId, createdAt  
- **ConditionSnapshot** (value object / entity): id, patrolPlanId, tideData, weatherData, windData, waveData, moonPhaseData, sunriseSunsetData, capturedAt  

Invariants:

- Status transitions only via allowed graph  
- Assignee must be active user  
- ConditionSnapshot is immutable once created  
- Cancelled/Completed plans cannot accept new substantive edits  

### 5.5 Tide / Weather / Wind / Wave (sourced data modules)

Each sourced data module owns a cache aggregate:

- **XCache** (root): id, stationId, parameter, fetchedAt, validUntil, payload (JSONB), source, stale  

Invariants:

- `validUntil` determines freshness; past `validUntil` = stale  
- Cache entries are replaceable (upsert by stationId + parameter + time range)  
- Domain layer never sees the raw external API response — only the mapped domain model  

### 5.6 MoonPhase / SunriseSunset / HijriCalendar (computable modules)

These modules have **no persistent aggregate**. They expose pure functions:

- `computeMoonPhase(date): MoonPhaseData`  
- `computeSunriseSunset(lat, long, date): SunriseSunsetData`  
- `convertToHijri(gregorianDate): HijriDateData`  

Invariants:

- Functions are pure (no side effects, no I/O)  
- Same input always produces same output  

### 5.7 Settings

- **Setting** (root): id, key, value, category, updatedAt  

Invariants:

- API keys stored as secrets (never returned in plaintext via API)  
- Keys are namespaced by module (e.g. `tide.provider.endpoint`)  

### 5.8 Audit

- **AuditEvent** (root, append-only): id, actorId, action, entityType, entityId, at, payload  

Invariants:

- No update/delete of audit rows in application paths  

---

## 6. Patrol plan status model (canonical)

```
Draft ──► Scheduled ──► Active ──► Completed
  │           │            │
  │           └────────────┴──► Cancelled
  └──► Cancelled
```

- `Draft → Scheduled`: plan is confirmed and assigned  
- `Scheduled → Active`: start time reached or manually activated  
- `Active → Completed`: end time reached or manually completed  
- `Draft/Scheduled/Active → Cancelled`: any time before completion  
- `Completed` and `Cancelled` are terminal  
- Reopen not allowed; create a new plan if needed  

---

## 7. Domain events (initial catalog)

| Event | Payload (conceptual) | Consumers |
|-------|----------------------|-----------|
| UserDisabled | userId | Notifications, Audit |
| StationCreated | stationId | Audit, Dashboard |
| StationStatusChanged | stationId, from, to | Audit, Dashboard, Notifications |
| PatrolPlanCreated | patrolPlanId, stationId | Audit, Calendar, Notifications |
| PatrolPlanAssigned | patrolPlanId, assigneeIds | Notifications |
| PatrolPlanStatusChanged | patrolPlanId, from, to | Audit, Notifications, Dashboard, Calendar |
| ConditionSnapshotCaptured | patrolPlanId, snapshotId | Audit |
| DataStaleDetected | stationId, module, lastFetchedAt | Notifications |
| SettingChanged | key, module | Audit, affected modules |

---

## 8. Permission catalog (seed)

| Code | Description |
|------|-------------|
| `user.manage` | Manage users |
| `role.manage` | Manage roles |
| `station.read` | View stations |
| `station.write` | Create/update stations |
| `calendar.read` | View marine calendar |
| `tide.read` | View tide data |
| `weather.read` | View weather data |
| `wind.read` | View wind data |
| `wave.read` | View wave data |
| `moon.read` | View moon phase data |
| `sun.read` | View sunrise/sunset data |
| `hijri.read` | View Hijri calendar data |
| `dashboard.read` | View dashboard |
| `patrolplan.read` | View patrol plans |
| `patrolplan.write` | Create/edit patrol plans |
| `patrolplan.assign` | Assign patrol plans |
| `patrolplan.transition` | Change patrol plan status |
| `notification.read` | View notifications |
| `report.read` | View reports |
| `report.export` | Export reports |
| `settings.read` | View settings |
| `settings.write` | Manage settings |
| `audit.read` | Read audit trail |
| `admin.reference` | Manage reference data |

Map roles (Admin, Operations Planner, Patrol Commander, Station Manager, Auditor) to subsets in Users module config.

---

## 9. Data freshness model

Every sourced data response includes a freshness envelope:

```
{
  "data": { ... },
  "freshness": {
    "status": "fresh" | "stale" | "unavailable",
    "fetchedAt": "2026-07-31T08:00:00Z",
    "validUntil": "2026-07-31T10:00:00Z",
    "source": "noaa-tide-api"
  }
}
```

- **fresh**: `now < validUntil`  
- **stale**: `now >= validUntil` but cached data exists  
- **unavailable**: no cached data and external API unreachable  

The UI must visually distinguish stale data per ADR-0008.

---

## 10. Modeling rules for engineers

1. One aggregate root per transaction boundary when possible.  
2. Reference other contexts by ID, not by embedding full aggregates.  
3. Put business rules in domain; not only in UI.  
4. Name classes and tables after ubiquitous language.  
5. Computable modules (Moon, Sun, Hijri) are pure functions — no I/O, no DB.  
6. Sourced data modules (Tide, Weather, Wind, Wave) use the adapter pattern — domain sees only the port, infrastructure sees the external API.  
7. Document new aggregates under `docs/domains/`.  

---

## 11. Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-31 | Initial domain model for MarineOps Calendar (PMD-0001) |