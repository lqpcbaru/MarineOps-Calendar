# ADR-0012: Station Module — Central Operational Location Architecture

**Date:** 2026-08-06  
**Status:** Accepted  
**Deciders:** Principal Solution Architect  
**Related:** ADR-0011 (Hub topology), ADR-0008 (data source strategy), DATABASE_OWNERSHIP.md (§9), MODULE_DEPENDENCY.md (§3+§4)

---

## Context

MarineOps Hub currently has 10 backend modules (Authentication, Users, Roles, Audit, Dashboard, Weather, Tide, WindWave, Moon, Sun). Every sourced-data module (Tide, Weather, Wind, Wave) accepts a `stationId` query parameter, and every computable module that needs location (Sun) accepts `stationId` too. The Dashboard aggregates all of them by `stationId`.

However, **no Station module exists yet**. The `stations` table is defined in the ERD (§2.6) and ownership is assigned to a "Stations" module in DATABASE_OWNERSHIP.md, but no code, no domain model, no validation rules, and no regional hierarchy have been designed.

Without a Station module:

1. Every module stores `stationId` as an opaque string — there is no validation that the station exists.
2. There is no way to map a station to external providers (MetMalaysia, JUPEM, Marine Department).
3. There is no regional hierarchy for organising stations by operational area.
4. Future modules (Maps, Patrol Planner, Marine Intelligence, Reports) have no location source of truth.
5. Admins cannot create, update, or archive stations.

## Decision

### 1. Station is a first-class domain module

The Station module is the **single source of truth for every operational location** in MarineOps Hub. It owns:

- `stations` table (master data)
- `operation_regions` table (regional hierarchy)
- `station_provider_mappings` table (external provider mapping)

### 2. Every module depends on Station, not on location data

No module stores location information (latitude, longitude, timezone, name) independently. Instead, every module that needs location context references a `stationId` and calls the Station module's query port (`StationsQueryPort`) to resolve station details.

| Module | Dependency on Station |
|--------|----------------------|
| Tide | `stationId` → Station query port (for lat/long if needed) |
| Weather | `stationId` → Station query port |
| WindWave | `stationId` → Station query port |
| Moon | `stationId` (optional — moon is location-independent but station provides context) |
| Sun | `stationId` → Station query port (for lat/long) |
| Dashboard | `stationId` → Station query port (for station name/code in response) |
| MarineAlerts | `stationId` → Station query port (optional station scoping) |
| CalendarAdmin | `stationId` → Station query port (entry is station-scoped) |
| MarineCalendar | `stationId` → Station query port (projection reads station) |
| Maps (future) | `stationId` → Station query port (map centre, markers) |
| Patrol Planner (future) | `stationId` → Station query port (patrol origin/destination) |
| Marine Intelligence (future) | `stationId` → Station query port (risk assessment per station) |
| Reports (future) | `stationId` → Station query port (filtering) |
| Notifications (future) | `stationId` → Station query port (station-scoped alerts) |

### 3. Ownership rules

Per DATABASE_OWNERSHIP.md:

- **Stations module owns** `stations`, `operation_regions`, `station_provider_mappings`.
- **No other module writes** to these tables.
- **Other modules read** via `StationsQueryPort` (published application port).
- **Foreign references** are by `stationId` (ID ref, no enforced FK across module boundaries — Rule 3).
- **No cross-module joins** — modules call `StationsQueryPort.findById()` and compose DTOs (Rule 4).
- **Soft delete / archive** — stations use `status = ARCHIVED`, never hard-deleted when referenced (Rule 7).

### 4. Regional hierarchy

Stations are organised into a **3-level operational hierarchy**:

```
Operation Region (e.g., "Pantai Barat Selangor")
└── Sub-Region (e.g., "Pelabuhan Klang")
    └── Station (e.g., "Stesen Pemerhatian Pelabuhan Klang")
```

This hierarchy is **operational, not administrative** — it does not mirror Malaysian state/district boundaries. It is defined by fisheries/enforcement operational areas and can be reconfigured without affecting station data.

### 5. Provider mapping

Each station may map to **multiple external providers** for different data types:

| Provider | Data Type | Example |
|----------|-----------|---------|
| MetMalaysia | Weather, Wind, Wave | API endpoint + key per station |
| JUPEM | Tide | Tide station code mapping |
| Marine Department | Station metadata | Vessel registry reference |
| Future providers | Any sourced data | Extensible via `station_provider_mappings` |

The mapping is **per-station, per-data-type, per-provider** — one station can use MetMalaysia for weather and JUPEM for tide. Swapping providers for a station requires only updating the mapping row, not changing any module code (ADR-0008 adapter pattern).

### 6. Future extensibility

The Station design supports:

- **Maps** — Station lat/long powers map markers; region hierarchy powers map overlays.
- **Patrol Planner** — Patrol plans reference `stationId` as origin/destination; region hierarchy groups patrol zones.
- **Marine Intelligence** — Risk assessment per station; provider mapping enables per-station data quality scoring.
- **Notifications** — Station-scoped alert subscriptions; region-scoped broadcast.
- **Reports** — Filter by region → sub-region → station; aggregate data per region.

## Consequences

### Positive

- Single source of truth for location — no duplicated lat/long across modules.
- Provider mapping is extensible — new providers added without code changes.
- Regional hierarchy is operational, not administrative — flexible for future reorganisation.
- All future modules have a clear dependency path: `Module → StationsQueryPort → Station`.

### Negative / trade-offs

- Station module becomes a critical dependency — if it is unavailable, modules that need lat/long cannot resolve station details. Mitigated by caching station data in the application layer.
- Regional hierarchy adds complexity (3-level tree). Mitigated by keeping it optional — stations can exist without a region assignment.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Each module stores its own lat/long | Duplicates data; station updates require N module updates; no single source of truth |
| Flat station list without regions | Cannot group stations operationally; reports and maps lack hierarchy |
| Hardcoded provider per data type | Cannot mix providers per station; JUPEM tide + MetMalaysia weather requires per-station mapping |
| Administrative boundaries (state/district) | Fisheries operations don't follow state borders; forces incorrect grouping |

## References

- ADR-0011 (Hub topology, module list)
- ADR-0008 (adapter pattern for sourced data)
- DATABASE_OWNERSHIP.md (§9 — ownership rules)
- MODULE_DEPENDENCY.md (§3 — StationsQuery port)
- ERD.md (§2.6 — stations table)
- SRS.md (§3.4 — FR-STN-001..007)
