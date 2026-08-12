# Vessel Intelligence — MarineOps Hub

**Version:** 1.0.0  
**Date:** 2026-08-07  

---

## 1. Architecture

```
PublicVesselsController (@Public)
       │
       ▼
VesselIntelligenceService
       │
       ▼
AisService (cache-first)
       │
       ▼
AISProviderPort (interface)
       │
       ▼
GfwAisProvider
       │
       ▼
GFW API v3
```

Vessel Intelligence is a **normalization layer** on top of AIS/GFW data. It never calls GFW directly.

## 2. Data Flow

1. User searches vessels via `GET /api/public/vessels/search?q=...`
2. `VesselIntelligenceService` delegates to `AisService.searchVessels()`
3. `AisService` checks cache → calls `GfwAisProvider` if needed
4. Raw GFW data is mapped to AIS domain DTOs
5. `VesselIntelligenceService` normalizes AIS DTOs → Vessel Intelligence DTOs
6. Response includes source, freshness, and retrieval timestamp

## 3. Vessel Data Status

| Status | Meaning |
|--------|---------|
| `KNOWN` | Vessel identity confirmed, data is fresh |
| `UNKNOWN` | No vessel name or MMSI available |
| `STALE` | Data is from cache, provider refresh failed |
| `NO_RECENT_DATA` | Vessel known but no recent position |
| `AIS_GAP` | Reserved for future AIS gap detection |

## 4. Event Types

All GFW event types are preserved:

| Event | Description |
|-------|-------------|
| `FISHING` | Fishing activity detected |
| `ENCOUNTER` | Vessel encounter detected |
| `PORT_VISIT` | Port visit detected |
| `LOITERING` | Loitering behavior detected |
| `AIS_GAP` | AIS transmission gap detected |

## 5. Provenance

Every response includes:
- `source` — data origin (e.g., "gfw", "cache")
- `retrievedAt` — when data was fetched
- `dataStatus` — quality/availability classification
- `observedAt` — when the vessel was last observed

## 6. Limitations

- GFW data has processing delay (up to 72h for events)
- Not real-time AIS
- No VMS integration
- No enforcement scoring
