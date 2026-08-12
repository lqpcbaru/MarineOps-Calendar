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

| GFW Capability | MarineOps Endpoint                         | Cache TTL |
| -------------- | ------------------------------------------ | --------- |
| Vessel Search  | `GET /api/public/ais/vessels/search?q=...` | 30 min    |
| Vessel Profile | `GET /api/public/ais/vessels/:id`          | 30 min    |
| Vessel Events  | `GET /api/public/ais/vessels/:id/events`   | 15 min    |

## 3. Authentication

- **Method:** Bearer token
- **Token:** `GFW_API_TOKEN` environment variable
- **Storage:** `.env` only (never committed)
- **Config:** Centralised via `ProviderConfig` → `apiKeyEnvVar: 'GFW_API_TOKEN'`

## 4. Data Freshness

GFW-derived AIS event datasets may have processing and data availability delays depending on the dataset. Event datasets (fishing, encounters, port visits) may have delays of approximately up to 72 hours. Vessel identity and profile data may also have processing delays. This integration must not be presented as real-time AIS. The `freshness` envelope communicates cache age to consumers.

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

- GFW event datasets may have processing delays of up to 72 hours — not real-time AIS
- Vessel identity/profile data may not reflect current registry status
- No 4Wings/vessel presence integration (future sprint)
- No map UI (future GIS sprint)
- No VMS integration
- Vessel search limited to GFW-supported query fields
- LOITERING and AIS_GAP event types fully supported in domain DTO

## 9. Manual API Validation Procedure

**⚠️ DO NOT commit the token. DO NOT log the token.**

To validate the GFW integration with the real API:

```bash
export GFW_API_TOKEN="your-real-token"

# Vessel search
curl -s "https://gateway.api.globalfishingwatch.org/v3/vessels/search?datasets=public-global-vessel-identity:latest&query=fishing&limit=5&offset=0" \
  -H "Authorization: Bearer $GFW_API_TOKEN" | jq .

# Vessel profile
curl -s "https://gateway.api.globalfishingwatch.org/v3/vessels/VESSEL_ID_HERE?datasets=public-global-vessel-identity:latest" \
  -H "Authorization: Bearer $GFW_API_TOKEN" | jq .

# Vessel events
curl -s "https://gateway.api.globalfishingwatch.org/v3/events?vessels=VESSEL_ID_HERE&datasets=public-global-fishing-events:latest,public-global-encounters-events:latest,public-global-port-visits-events:latest,public-global-loitering-events:latest,public-global-gaps-events:latest&limit=50" \
  -H "Authorization: Bearer $GFW_API_TOKEN" | jq .
```

Validate that the response structure matches the raw DTOs in `gfw-raw-dto.ts`.

## 10. Future

- 4Wings spatial vessel presence
- GIS/Map frontend integration
- VMS provider
- National AIS provider
- Real-time AIS feed
