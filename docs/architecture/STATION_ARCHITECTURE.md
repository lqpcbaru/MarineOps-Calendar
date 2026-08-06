# Station Module — Architecture Validation

**Version:** 1.0.0  
**Date:** 2026-08-06  
**Status:** Proposed  
**Authorised by:** ADR-0012

---

## 1. DDD Compliance

| DDD Principle | Station Module Compliance |
|---------------|--------------------------|
| **Bounded Context** | Station is a self-contained bounded context — owns its tables, domain rules, and ports. No other module knows about station internals. |
| **Aggregate Root** | `Station` is the aggregate root. `OperationRegion` and `StationProviderMapping` are entities within the Station aggregate boundary (same module, internal FKs allowed). |
| **Ubiquitous Language** | Terms: Station, Operation Region, Provider Mapping, Archive. Consistent across SRS, ERD, API, and code. |
| **Domain Events** | `StationCreated`, `StationArchived`, `StationStatusChanged`, `RegionCreated` — emitted for Audit consumption. |
| **Repositories** | `StationRepository`, `OperationRegionRepository`, `StationProviderMappingRepository` — ports in application, Prisma implementations in infrastructure. |
| **Value Objects** | `Coordinates` (lat + long), `Timezone` (IANA string) — validated in domain. |

## 2. Clean Architecture Compliance

| Layer | Responsibility | Station Module |
|-------|---------------|----------------|
| **Domain** | Entities, value objects, domain events, ports — no I/O | `Station` aggregate, `StationState`, validation rules, `StationsQueryPort`, `StationProviderMappingPort` |
| **Application** | Use-cases, DTOs, Zod schemas, DI tokens | `CreateStationUseCase`, `UpdateStationUseCase`, `ArchiveStationUseCase`, `GetStationsUseCase`, `GetPublicStationsUseCase` |
| **Infrastructure** | Prisma repositories, external adapters | `PrismaStationRepository`, `PrismaOperationRegionRepository`, `PrismaProviderMappingRepository` |
| **API** | Controllers (in `src/api/admin/` and `src/api/public/`) | `StationsController` (admin), `PublicStationsController` (public) |

**Dependency direction:** Controller → Service/UseCase → Port → Infrastructure. Domain depends on nothing. Infrastructure depends on domain ports. ✅

## 3. SOLID Compliance

| Principle | Compliance |
|-----------|------------|
| **S** — Single Responsibility | Each use-case does one thing (create, update, archive, list). Station validation is in the domain, not the controller. |
| **O** — Open/Closed | Provider mapping is extensible — new providers added via data (mapping rows), not code changes. New data types added by extending the `dataType` enum. |
| **L** — Liskov Substitution | `PlaceholderProvider` pattern (already proven in Weather/Tide modules) applies: any provider implementation can replace another via DI. |
| **I** — Interface Segregation | `StationsQueryPort` (read) is separate from `StationRepository` (write). Data modules depend on `StationProviderMappingPort`, not on the full Stations module. |
| **D** — Dependency Inversion | All dependencies point to ports (interfaces), not concrete classes. Infrastructure implements ports. ✅ |

## 4. Existing Architecture Alignment

| Existing Rule | Station Module Compliance |
|---------------|--------------------------|
| Per-module table ownership (DATABASE_OWNERSHIP Rule 1) | ✅ Stations owns `stations`, `operation_regions`, `station_provider_mappings` |
| No cross-module writes (Rule 2) | ✅ Only Stations admin use-cases write |
| Foreign references by ID (Rule 3) | ✅ Other modules store `stationId` as plain text |
| No cross-module joins (Rule 4) | ✅ Modules call `StationsQueryPort` and compose DTOs |
| Public/admin read-sharing (Rule 5) | ✅ Same table, public DTO subset, admin DTO full |
| Soft delete (Rule 7) | ✅ `status = ARCHIVED` |
| UTC timestamps (Rule 8) | ✅ |
| Migrations via Prisma (Rule 9) | ✅ |
| Controller location (FOLDER_STRUCTURE §2.2) | ✅ Public in `src/api/public/`, admin in `src/api/admin/` |
| Provider adapter pattern (ADR-0008) | ✅ Provider mapping extends the adapter pattern — station → provider → external API |

---

## 5. Future Compatibility

### 5.1 Maps

Station lat/long powers map markers. Region hierarchy powers map overlays (zoom: region → sub-region → stations). The `StationsQueryPort.findByRegion()` enables rendering all stations in a region on a map.

### 5.2 Patrol Planner

Patrol plans reference `stationId` as origin/destination. Region hierarchy groups patrol zones — a patrol plan can be assigned to a region, automatically covering all stations within. The Station module provides the location source of truth; the Patrol Planner module adds patrol-specific logic (routes, schedules, vessel assignments).

### 5.3 Marine Intelligence

Risk assessment per station uses station context (location, region, provider data quality). The provider mapping enables per-station data quality scoring — if a station's tide provider is frequently stale, intelligence can factor that into risk calculations.

### 5.4 Notifications

Station-scoped alert subscriptions — users subscribe to alerts for specific stations or regions. The region hierarchy enables broadcast notifications (alert all stations in "Pantai Barat Selangor").

### 5.5 Reports

Filter by region → sub-region → station. Aggregate data per region for operational summaries. The 3-level hierarchy enables drill-down reporting without additional data structures.

---

## 6. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial Station architecture validation (ADR-0012) |
