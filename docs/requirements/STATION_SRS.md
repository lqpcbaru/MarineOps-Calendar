# Station Module — Software Requirements Specification

**Version:** 1.0.0  
**Date:** 2026-08-06  
**Status:** Proposed  
**Authorised by:** ADR-0012  
**Related:** [SRS](SRS.md) §3.4, [ERD](../data/STATION_ERD.md), [API](../api/STATION_API.md), [OWNERSHIP](../architecture/STATION_OWNERSHIP.md)

---

## 1. Purpose

The Station module is the single source of truth for every operational location in MarineOps Hub. It manages station master data, regional hierarchy, and external provider mappings. Every module that needs location context depends on Station.

---

## 2. Functional Requirements

### 2.1 Station CRUD (Admin)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-001 | P0 | Admins shall create stations with: code, name, latitude, longitude, timezone, regionId (optional), metadata. |
| FR-STN-002 | P0 | Station code shall be unique within the organisation. |
| FR-STN-003 | P0 | Admins shall read, update, and archive stations. |
| FR-STN-004 | P0 | Station shall use soft-delete (archive); no hard delete if referenced by other modules. |
| FR-STN-005 | P0 | Archived stations shall not appear in public listings. |
| FR-STN-006 | P1 | Admins shall search/filter stations by name, code, status, region. |
| FR-STN-007 | P0 | Station shall store: code, name, latitude, longitude, timezone, status, regionId, metadata, timestamps. |

### 2.2 Public Station Read

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-008 | P0 | Public Portal shall list active stations via `GET /api/public/stations`. |
| FR-STN-009 | P0 | Public Portal shall view a single active station via `GET /api/public/stations/{id}`. |
| FR-STN-010 | P0 | Public station responses shall exclude admin-only metadata (internal IDs, timestamps, provider mappings). |
| FR-STN-011 | P1 | Public station list shall be paginated. |

### 2.3 Operation Region Management (Admin)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-012 | P1 | Admins shall create, read, update, and archive operation regions. |
| FR-STN-013 | P1 | Operation region shall store: name, code, description, parentRegionId (optional), status. |
| FR-STN-014 | P1 | Region code shall be unique within the organisation. |
| FR-STN-015 | P1 | Regions support a 3-level hierarchy: Region → Sub-Region → (Stations assigned). |
| FR-STN-016 | P1 | Admins shall assign stations to a sub-region. |
| FR-STN-017 | P1 | Public shall view active regions with their stations via `GET /api/public/stations/regions`. |

### 2.4 Provider Mapping (Admin)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-018 | P1 | Admins shall map a station to external providers per data type. |
| FR-STN-019 | P1 | Provider mapping shall store: stationId, dataType (tide/weather/wind/wave), providerName, providerStationId, config (JSONB). |
| FR-STN-020 | P1 | A station may have multiple provider mappings (one per data type). |
| FR-STN-021 | P1 | Provider mapping is extensible — new providers added without code changes. |
| FR-STN-022 | P2 | Admins shall test a provider mapping (verify connectivity) via `POST /api/v1/stations/{id}/providers/{mappingId}/test`. |

### 2.5 Station Query Port (Internal)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STN-023 | P0 | Station module shall expose `StationsQueryPort` for other modules to resolve station details by ID. |
| FR-STN-024 | P0 | `StationsQueryPort.findById(id)` shall return station code, name, lat, long, timezone, status. |
| FR-STN-025 | P0 | `StationsQueryPort.findById()` shall return `null` for archived stations when called from public context. |
| FR-STN-026 | P1 | `StationsQueryPort.findByRegion(regionId)` shall return all active stations in a region subtree. |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-STN-001 | Security | Only admins with `station.write` permission may create/update/archive stations. |
| NFR-STN-002 | Security | Public endpoints return no admin-only fields (metadata, timestamps, provider config). |
| NFR-STN-003 | Validation | Latitude: -90 to 90, 6 decimal places. Longitude: -180 to 180, 6 decimal places. |
| NFR-STN-004 | Validation | Timezone must be a valid IANA timezone string (e.g., `Asia/Kuala_Lumpur`). |
| NFR-STN-005 | Validation | Station code: alphanumeric + hyphen, max 32 chars, uppercase. |
| NFR-STN-006 | Performance | Station query port must respond in < 50ms (indexed lookup). |
| NFR-STN-007 | Performance | Public station list must be paginated (max 100 per page). |
| NFR-STN-008 | Data | All timestamps stored as UTC. |
| NFR-STN-009 | Data | Soft delete only — no hard delete when station is referenced. |

---

## 4. Validation Rules

| Field | Rule |
|-------|------|
| `code` | Required. Alphanumeric + hyphen. Max 32 chars. Uppercase. Unique per org. |
| `name` | Required. Max 256 chars. |
| `latitude` | Required. Decimal(9,6). Range: -90.000000 to 90.000000. |
| `longitude` | Required. Decimal(9,6). Range: -180.000000 to 180.000000. |
| `timezone` | Required. Valid IANA timezone (e.g., `Asia/Kuala_Lumpur`). |
| `status` | Enum: `ACTIVE`, `ARCHIVED`. Default: `ACTIVE`. |
| `regionId` | Optional. Must reference an existing active region. |
| `metadata` | Optional. JSONB. Max 4KB. |

---

## 5. Station Lifecycle

```
[Created] → [ACTIVE] → [ARCHIVED]
                ↑            │
                └────────────┘
              (can be reactivated)
```

| State | Description |
|-------|-------------|
| `ACTIVE` | Station is operational. Visible in public and admin. Can be referenced by other modules. |
| `ARCHIVED` | Station is decommissioned. Hidden from public. Existing references remain valid (ID ref). Can be reactivated. |

**Rules:**
- Cannot archive a station if it is the only active station in a region (warn, not block).
- Archiving does not delete data — historical references remain valid.
- Reactivation sets status back to `ACTIVE` and restores public visibility.

---

## 6. Use Cases

### 6.1 Admin Use Cases

| Use Case | Permission | Description |
|----------|------------|-------------|
| `CreateStationUseCase` | `station.write` | Create a new station with validation. |
| `UpdateStationUseCase` | `station.write` | Update station fields (name, lat, long, timezone, region, metadata). |
| `ArchiveStationUseCase` | `station.write` | Soft-delete (archive) a station. |
| `GetStationsUseCase` | `station.read` | List/filter stations (admin: includes archived). |
| `CreateRegionUseCase` | `station.write` | Create an operation region. |
| `UpdateRegionUseCase` | `station.write` | Update a region. |
| `AssignStationToRegionUseCase` | `station.write` | Assign/reassign a station to a region. |
| `CreateProviderMappingUseCase` | `station.write` | Map a station to an external provider. |
| `UpdateProviderMappingUseCase` | `station.write` | Update a provider mapping. |

### 6.2 Public Use Cases

| Use Case | Description |
|----------|-------------|
| `GetPublicStationsUseCase` | List active stations (paginated, no admin fields). |
| `GetPublicStationByIdUseCase` | View a single active station. |
| `GetPublicRegionsUseCase` | List active regions with station counts. |

### 6.3 Internal Port (consumed by other modules)

| Port Method | Returns |
|-------------|---------|
| `StationsQueryPort.findById(id)` | `StationInfo \| null` (code, name, lat, long, timezone, status) |
| `StationsQueryPort.findByIdPublic(id)` | `StationPublicInfo \| null` (null if archived) |
| `StationsQueryPort.findByRegion(regionId)` | `StationInfo[]` (active stations in region subtree) |

---

## 7. Out of Scope

- Station import/export (CSV/Excel) — future sprint.
- Station bulk operations — future sprint.
- Real-time station telemetry — not a Station module concern.
- Vessel tracking per station — future AIS/VMS module.
- Station-to-station distance calculations — future Maps module.
- Automatic station discovery from provider APIs — future.

---

## 8. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial Station SRS (ADR-0012) |
