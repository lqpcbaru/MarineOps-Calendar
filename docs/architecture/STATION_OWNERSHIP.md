# Station Module — Database Ownership

**Version:** 1.0.0  
**Date:** 2026-08-06  
**Status:** Proposed  
**Authorised by:** ADR-0012  
**Related:** [DATABASE_OWNERSHIP](DATABASE_OWNERSHIP.md) §9, [STATION_ERD](../data/STATION_ERD.md)

---

## 1. Module Ownership

The **Stations module** owns three tables:

| Table | Owner | Written by | Read by |
|-------|-------|------------|---------|
| `stations` | Stations | Stations (admin use-cases only) | Stations (public+admin), Tide, Weather, WindWave, Moon, Sun, Dashboard, MarineAlerts, CalendarAdmin, MarineCalendar, Audit |
| `operation_regions` | Stations | Stations (admin use-cases only) | Stations (public+admin), Dashboard, Reports (future) |
| `station_provider_mappings` | Stations | Stations (admin use-cases only) | Stations (admin), Tide/Weather/Wind/Wave (via port) |

---

## 2. Rules (binding)

### Rule 1 — Stations module is the sole writer

No module other than Stations may `INSERT`, `UPDATE`, or `DELETE` rows in `stations`, `operation_regions`, or `station_provider_mappings`. All station data changes go through the Stations module's admin use-cases.

### Rule 2 — Other modules read via StationsQueryPort

Modules that need station details call `StationsQueryPort.findById(id)` — they do not query the `stations` table directly. This preserves module isolation and keeps the Stations module's internal schema free to evolve.

### Rule 3 — Foreign references by stationId (ID only)

Other modules store `stationId` as a plain text column (e.g., `calendar_entries.station_id`, `alerts.station_id`, `tide_cache.station_id`). There is **no enforced foreign key** across module boundaries — the reference is a logical ID, not a relational dependency.

### Rule 4 — No cross-module joins

List endpoints must not `JOIN` `stations` with tables owned by other modules. To compose station data with module data, call `StationsQueryPort` in the application layer and merge the DTOs.

### Rule 5 — Public and admin read-sharing

The same `stations` table backs both `/api/public/stations` and `/api/v1/stations`. The public query port returns a **public DTO** (no metadata, no timestamps, no provider mappings). The admin query port returns the **full DTO**. Writes come only from admin use-cases.

### Rule 6 — Provider mappings are station-owned

`station_provider_mappings` is owned by the Stations module, not by the data modules (Tide, Weather, etc.). Data modules read the mapping via a port (`StationProviderMappingPort`) to determine which provider and config to use for a given station. Data modules never write to this table.

### Rule 7 — Soft delete only

Stations use `status = ARCHIVED` for soft delete. No hard delete when the station is referenced by other modules. Regions follow the same pattern.

### Rule 8 — Internal FKs allowed

Within the Stations module, enforced FKs are allowed:
- `stations.region_id → operation_regions.id` (nullable, cascade on region archive: set NULL)
- `station_provider_mappings.station_id → stations.id` (cascade on station delete — but stations are soft-deleted, so this FK is for cleanup only)

---

## 3. Read-Sharing Diagram

```
                    ┌─────────────────────────────────┐
                    │  stations + operation_regions   │
                    │  + station_provider_mappings    │
                    │    (owned by Stations module)   │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
  │ StationsQueryPort│  │ StationAdmin     │  │ StationProviderMapping│
  │ (read: public    │  │ use-cases        │  │ Port (read: data     │
  │  + admin DTO)    │  │ (commands +      │  │  modules only)       │
  │                  │  │  queries)        │  │                      │
  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘
           │                     │                        │
  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌───────────┴──────────┐
  │ public-stations  │  │ stations.ctrl    │  │ Tide/Weather/Wind/   │
  │ .controller      │  │ (admin)          │  │ Wave modules read    │
  │ /api/public/     │  │ /api/v1/stations │  │ provider mapping     │
  │   stations       │  │                  │  │ via port              │
  └──────────────────┘  └──────────────────┘  └──────────────────────┘
```

---

## 4. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial Station ownership rules (ADR-0012) |
