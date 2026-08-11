# GFW AIS Integration — MarineOps Hub

**Version:** 1.0.0  
**Date:** 2026-08-07  
**Provider:** Global Fishing Watch (GFW) API v3

---

## 1. What GFW Provides

Global Fishing Watch provides AIS-derived vessel data:

- **Vessel Search** — Search vessels by name, MMSI, IMO, or vessel ID
- **Vessel Profile** — Vessel identity, registry info, last known position, activity summary
- **Vessel Events** — Fishing events, encounters, port visits
- **4Wings / Vessel Presence** — Spatial vessel presence (future integration)

## 2. What MarineOps Consumes

| GFW Capability | MarineOps Endpoint | Cache TTL |
|---------------|-------------------|-----------|
| Vessel Search | `GET /api/public/ais/vessels/search?q=...` | 30 min |
| Vessel Profile | `GET /api/public/ais/vessels/:id` | 30 min |
| Vessel Events | `GET /api/public/ais/vessels/:id/events` | 15 min |

## 3. Authentication

- **Method:** Bearer token
- **Token:** `GFW_API_TOKEN` environment variable
- **Storage:** `.env` only (never committed)
- **Config:** Centralised via `ProviderConfig` → `apiKeyEnvVar: 'GFW_API_TOKEN'`

## 4. Data Freshness

GFW AIS data has processing delay (not true real-time). Typical delay is 24-72 hours for processed AIS data. Vessel positions may not reflect current location. The `freshness` envelope communicates cache age to consumers.

## 5. Caching

- All endpoints use `CacheService.getOrFetch()` with `buildCacheKey('gfw', type, id, date)`
- TTL: 30 minutes for search/profile, 15 minutes for events
- Stale TTL: 120 minutes for search/profile, 60 minutes for events
- Cache keys never contain API tokens

## 6. Rate Limiting

GFW rate limits are configurable via provider policy. Current defaults:
- Max retries: 3
- Retry delay: 1s base (exponential: 1s → 2s → 4s)

## 7. Architecture

```
PublicAisController (@Public)
       │
       ▼
AisService (cache-first)
       │
       ▼
AISProviderPort (interface)
       │
       ▼
GfwAisProvider (infrastructure)
       │
  ┌────┴────┐
  │         │
  ▼         ▼
ProviderHttpClient  GfwMapper
  │
  ▼
GFW API v3
```

## 8. Known Limitations

- AIS data has processing delay (24-72h) — not real-time
- No 4Wings/vessel presence integration (future sprint)
- No map UI (future GIS sprint)
- No VMS integration
- Vessel search limited to GFW-supported query fields

## 9. Future

- 4Wings spatial vessel presence
- GIS/Map frontend integration
- VMS provider
- National AIS provider
- Real-time AIS feed
