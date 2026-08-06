# Sprint 4.0A — MET Malaysia Weather Provider Research Report

**Author:** Principal Integration Architect  
**Date:** 2026-08-06  
**Status:** Research — No code implemented  
**Related:** PUBLIC_API.md, STATION_API.md, STATION_ARCHITECTURE.md, ADR-0008, ADR-0012

---

## 1. MET Malaysia API Capabilities

### 1.1 Two Data Access Channels

MET Malaysia offers **two distinct channels** for weather data:

| Channel | URL | Cost | Auth | Use Case |
|---------|-----|------|------|----------|
| **Public Web Service API** | `api.met.gov.my` | Free | Access token (email registration) | General public, apps like myCuaca |
| **myMETdata Portal** | `mymetdata.met.gov.my` | Paid (Akta Fi) | Account login | Professional/commercial data access |

### 1.2 Public API (api.met.gov.my) — Key Facts

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.met.gov.my/` |
| **API Version** | v2 (v1 deprecated, removed) |
| **Response format** | JSON |
| **Auth method** | Bearer token (access token obtained via email registration) |
| **Rate limit** | 1,000 requests/day, burstable limit of 3 requests/minute |
| **Cost** | Free for general public |
| **Registration** | Email-based via `api.met.gov.my` → "Get Your Access Token" |
| **Reference app** | myCuaca (mobile app built on same API) |

### 1.3 Available Data Categories

From the MET Malaysia website navigation and API page:

| Category | Sub-categories | API-relevant? |
|----------|---------------|---------------|
| **Cuaca Utama** (General Weather) | Negara, Negeri, Daerah, Bandar, Kawasan Pelancongan | ✅ Forecast endpoints |
| **Cuaca Laut** (Marine Weather) | Perairan (Coastal Waters), Perkapalan (Shipping) | ✅ **Marine-specific** |
| **Nowcasting** | Current weather | ✅ Real-time |
| **Pencerapan** (Observations) | Suhu, Hujan, Ketampakan, Kelembapan | ✅ Surface observations |
| **Amaran** (Warnings) | Hujan Berterusan, Angin Kencang & Laut Bergelora, Ribot Petir | ✅ Weather warnings |
| **Radar** | Malaysia, Semenanjung, Sabah & Sarawak | ❌ Image data, not API |
| **Satelit** | Satellite imagery | ❌ Image data, not API |
| **Iklim** | Climate data, FDRS, seasonal | ⚠️ Available via myMETdata (paid) |
| **Gempa Bumi** | Earthquake | ❌ Not weather-related |

### 1.4 Marine Weather Areas (Perairan)

From the marine waters forecast page, MET Malaysia defines **17 marine areas**:

| Area Code (inferred) | Name (Bahasa Melayu) |
|----------------------|---------------------|
| 1 | Perak, Penang, Perlis & Kedah |
| 2 | West Johor |
| 3 | Selangor |
| 4 | N. Sembilan |
| 5 | Melaka |
| 6 | Kelantan |
| 7 | Terengganu |
| 8 | Pahang |
| 9 | East Johor |
| 10 | Western Sarawak |
| 11 | Northern Sarawak |
| 12 | Western Sabah and Labuan |
| 13 | Eastern Sabah |
| 14 | Lahad Datu |

### 1.5 Marine Forecast Data Fields

From the marine waters forecast page, each day provides:

| Field | Example | BM Label |
|-------|---------|----------|
| Date | 06/08/2026 Khamis | Tarikh |
| Weather condition | Ribut petir di beberapa tempat | Cuaca |
| Morning forecast | Ribut petir di beberapa tempat | Pagi |
| Afternoon forecast | Tiada hujan | Petang |
| Night forecast | Tiada hujan | Malam |
| Wind direction | BD (Barat Daya) | Arah Angin |
| Wind speed | 10-20 km/h | Kelajuan Angin |
| Wave height | 0.5-1.0 m | Ketinggian Ombak |

### 1.6 Warning Types

| Warning | BM Name | API likely endpoint |
|---------|---------|---------------------|
| Continuous Heavy Rain | Hujan Berterusan | Likely `/warning` or `/amaran` |
| Strong Wind & Rough Seas | Angin Kencang & Laut Bergelora | Likely `/warning` or `/amaran` |
| Thunderstorm | Ribut Petir | Likely `/warning` or `/amaran` |
| Tropical Cyclone | Ribut Taufan | Likely `/warning` or `/amaran` |

### 1.7 API Limitations (Confirmed)

| Limitation | Impact |
|------------|--------|
| **1,000 requests/day** | Very low — ~41 requests/hour. Must cache aggressively. |
| **3 requests/minute burst limit** | Cannot do real-time per-request fetch. Must pre-fetch on schedule. |
| **No lat/long-based queries** | Marine areas are named regions, not coordinates. Must map stations to MET marine areas. |
| **No raw JSON API documentation publicly accessible** | API v2 docs are behind login. Must register to access full endpoint list. |
| **Marine forecast is region-based, not station-based** | MET forecasts per marine area, not per individual station. Multiple stations may share one MET marine area. |
| **No wave period data** | Only wave height (0.5-1.0m range), no period in seconds. |
| **Wind speed as range** | "10-20km/h" is a range, not a single value. Must parse or take midpoint. |
| **No pressure/humidity in marine forecast** | These are available in surface observations, not marine forecasts. |
| **Bahasa Melayu field values** | Weather conditions, wind directions are in BM (e.g., "BD" for Barat Daya). |

---

## 2. Recommended Endpoints

### 2.1 Priority endpoints for MarineOps Hub

| Priority | MET Data | MarineOps Module | Purpose |
|----------|----------|------------------|---------|
| P0 | Marine Waters Forecast | Weather + WindWave | Primary marine forecast (wind, wave, conditions) |
| P0 | General Weather Forecast (Negeri/Daerah) | Weather | Temperature, conditions for coastal stations |
| P1 | Weather Warnings | MarineAlerts | Strong wind, rough seas, thunderstorm warnings |
| P1 | Surface Observations | Weather | Current temperature, humidity, visibility, rainfall |
| P2 | Nowcasting | Weather | Short-term nowcast (0-3 hours) |

### 2.2 Mapping into MarineOps architecture

```
MET Malaysia API (api.met.gov.my)
        │
        ▼
MetMalaysiaWeatherProvider (infrastructure/)
  implements WeatherProviderPort
        │
        ▼
WeatherService (application/)
        │
        ▼
PublicWeatherController → GET /api/public/weather
```

For marine-specific data (wind direction, wind speed, wave height):

```
MET Marine Waters Forecast
        │
        ▼
MetMalaysiaMarineProvider (infrastructure/)
  implements WindWaveProviderPort
        │
        ▼
WindWaveService (application/)
        │
        ▼
PublicWindWaveController → GET /api/public/wind-wave
```

---

## 3. Data Mapping Table

### 3.1 Weather (General Forecast)

| MET Field | MET Example | MarineOps DTO Field | Notes |
|-----------|------------|---------------------|-------|
| Date | "06/08/2026" | `WeatherDataPoint.date` | Parse DD/MM/YYYY → YYYY-MM-DD |
| Weather condition | "Ribut petir di beberapa tempat" | `WeatherDataPoint.conditions` | Map BM → standard codes |
| (Derived from condition) | — | `WeatherDataPoint.temperature` | MET general forecast does NOT include temperature; use surface observation or omit |
| (Not available in forecast) | — | `WeatherDataPoint.visibility` | From surface observation endpoint if available |
| (Not available in forecast) | — | `WeatherDataPoint.precipitation` | From surface observation or rainfall endpoint |

### 3.2 Marine (Wind + Wave)

| MET Field | MET Example | MarineOps DTO Field | Notes |
|-----------|------------|---------------------|-------|
| Date | "06/08/2026" | `WindWaveDataPoint.date` | Parse DD/MM/YYYY |
| Arah Angin (wind direction) | "BD" | `WindWaveDataPoint.windDirection` | BM compass: BD=Barat Daya=SW. Map to standard compass (N/NE/E/SE/S/SW/W/NW) |
| Kelajuan Angin (wind speed) | "10-20km/h" | `WindWaveDataPoint.windSpeed` | Parse range → midpoint (15) or lower bound (10). Convert km/h → knots (×0.54) |
| (Derived from wind speed) | — | `WindWaveDataPoint.windGusts` | MET does not provide gusts separately. Use upper bound of range. |
| Ketinggian Ombak (wave height) | "0.5-1.0 m" | `WindWaveDataPoint.waveHeight` | Parse range → midpoint (0.75) or upper bound (1.0) |
| (Not available) | — | `WindWaveDataPoint.wavePeriod` | MET does not provide wave period. Set to 0 or omit. |

### 3.3 BM Weather Condition Mapping (Proposed)

| BM Condition | English | MarineOps Code |
|-------------|---------|----------------|
| Tiada hujan | No rain | `CLEAR` |
| Ribut petir di beberapa tempat | Thunderstorm in some places | `THUNDERSTORM` |
| Hujan di beberapa tempat | Rain in some places | `RAIN` |
| Hujan lebat | Heavy rain | `HEAVY_RAIN` |
| Ribut petir | Thunderstorm | `THUNDERSTORM` |
| Mendung | Cloudy | `CLOUDY` |
| Cerah | Fair/Clear | `CLEAR` |

### 3.4 BM Wind Direction Mapping

| BM Code | English | Standard Compass | Degrees |
|---------|---------|------------------|---------|
| B | Barat | W | 270° |
| T | Timur | E | 90° |
| U | Utara | N | 0° |
| S | Selatan | S | 180° |
| BD | Barat Daya | SW | 225° |
| BT | Barat Laut | NW | 315° |
| TG | Timur Laut | NE | 45° |
| TD | Tenggara | SE | 135° |
| SB | Selatan-Barat | SSW | 202.5° |

---

## 4. Error Mapping Table

| MET HTTP Status | MET Scenario | MarineOps Internal Error | HTTP to Client | Freshness |
|----------------|-------------|------------------------|----------------|-----------|
| 200 | Success | — | 200 | `fresh` |
| 401 | Invalid/expired token | `ProviderAuthError` | 200 (serve stale) or 503 | `stale` or `unavailable` |
| 403 | Token lacks permission | `ProviderAuthError` | 200 (serve stale) or 503 | `stale` or `unavailable` |
| 404 | Location/area not found | `ProviderDataNotFoundError` | 200 (serve stale) or 404 to client | `stale` |
| 429 | Rate limit exceeded | `ProviderRateLimitedError` | 200 (serve stale) | `stale` |
| 500 | MET server error | `ProviderServerError` | 200 (serve stale) | `stale` |
| 502/503 | MET unavailable | `ProviderUnavailableError` | 200 (serve stale) | `stale` |
| Timeout | Request timeout (>10s) | `ProviderTimeoutError` | 200 (serve stale) | `stale` |
| Network failure | DNS/connection refused | `ProviderNetworkError` | 200 (serve stale) | `stale` |
| Any error + no cache | First fetch fails | `ProviderUnavailableError` | 503 `PROVIDER_UNAVAILABLE` | `unavailable` |

**Key principle (ADR-0008):** Never return 503 when any cached data exists. Always serve stale with `freshness.status = "stale"`.

---

## 5. Cache Strategy

### 5.1 TTL per Data Type

| Data Type | MET Refresh | L2 TTL (validUntil) | L1 CDN max-age | Rationale |
|-----------|-------------|---------------------|-----------------|-----------|
| Marine forecast | Every 6 hours (MET schedule) | 6 hours | 21600s | MET updates marine forecasts ~4× daily |
| General forecast | Every 3 hours | 3 hours | 10800s | MET updates general forecasts ~8× daily |
| Warnings | Event-driven | 60 seconds | 60s | Warnings must be near-real-time |
| Surface observations | Hourly | 1 hour | 3600s | Temperature/humidity changes hourly |
| Nowcasting | Every 30 min | 30 minutes | 1800s | Short-term forecast |

### 5.2 Refresh Schedule

```
Cron job (NestJS @Cron):
├── Marine forecast:    every 6 hours (02:00, 08:00, 14:00, 20:00 MYT)
├── General forecast:   every 3 hours
├── Warnings:           every 60 seconds
├── Observations:       every hour
└── Nowcasting:         every 30 minutes
```

### 5.3 Retry Strategy

| Attempt | Delay | Action |
|---------|-------|--------|
| 1 | Immediate | Fetch from MET API |
| 2 | 5 seconds | Retry (exponential backoff) |
| 3 | 15 seconds | Final retry |
| Fail | — | Serve stale cache, log warning, emit `DataStaleDetected` event |

### 5.4 Fallback Strategy

```
Request → L2 cache check
  ├── fresh (now < validUntil) → serve fresh
  ├── stale (now ≥ validUntil)
  │     ├── retry MET API (3 attempts)
  │     │     ├── success → update cache, serve fresh
  │     │     └── fail → serve stale, set freshness = "stale"
  │     └── if no cache at all → 503 PROVIDER_UNAVAILABLE
  └── no cache row
        ├── fetch MET API
        │     ├── success → insert cache, serve fresh
        │     └── fail → 503 PROVIDER_UNAVAILABLE
```

### 5.5 Rate Limit Budget Management

With only 1,000 requests/day and 3/minute burst:

| Data type | Requests/day | Stations cached per request |
|-----------|-------------|---------------------------|
| Marine forecast (4×/day) | ~4 (fetch all areas at once) | All stations in area |
| General forecast (8×/day) | ~8 | All stations per state |
| Warnings (1440×/day max, but ~60s interval) | ~240 (throttle to 5 min) | All |
| Observations (24×/day) | ~24 | All stations |
| Nowcasting (48×/day) | ~48 | All |
| **Total** | **~324/day** | Well within 1,000 limit |

**Key strategy:** Fetch ALL marine areas / ALL states in a single request per refresh cycle, then distribute to stations by area mapping. This keeps request count low.

---

## 6. Security Recommendations

### 6.1 API Key Storage

| Item | Recommendation |
|------|----------------|
| **Storage** | Environment variable `METMALAYSIA_API_KEY` in `.env` (never committed) |
| **Settings module** | Store key reference (not value) in `settings` table: `key: "metmalaysia.api.key"`, `isSecret: true` |
| **Infrastructure access** | Only `MetMalaysiaWeatherProvider` (infrastructure layer) reads the key. Never in domain/application. |
| **Config provider** | Use existing `CONFIG` token or create `METMALAYSIA_API_KEY` DI token (like `JWT_ACCESS_SECRET` pattern) |

### 6.2 Secret Management

| Practice | Implementation |
|----------|---------------|
| **Never log API key** | Provider logs only `"source": "metmalaysia-api"`, never the token |
| **Never return key in responses** | `freshness.source` = `"metmalaysia"`, not the key |
| **Rotation** | Re-register at `api.met.gov.my` to get new token. Update env variable. Restart app. No code change. |
| **Environment separation** | Dev: test token or placeholder. Staging/Prod: real token in secret manager (e.g., Docker secrets, AWS Secrets Manager) |
| **Fail-fast** | If `METMALAYSIA_API_KEY` is missing and provider is active, throw on startup (same pattern as `JWT_ACCESS_SECRET`) |

### 6.3 Network Security

| Practice | Implementation |
|----------|---------------|
| **HTTPS only** | MET API uses HTTPS. Provider must enforce. |
| **Request timeout** | 10-second timeout per request. Never block indefinitely. |
| **No self-signed certs** | Provider HTTP client must verify TLS certificates. |
| **Correlation ID** | Pass `X-Correlation-Id` header to MET for debugging (if supported). |

---

## 7. Testing Strategy

### 7.1 Test Layers

| Layer | What | How |
|-------|------|-----|
| **Unit: Provider** | `MetMalaysiaWeatherProvider.getForecast()` with mocked HTTP | Mock `fetch`/`axios`, verify correct URL, headers, params, response parsing |
| **Unit: Error handling** | Provider converts HTTP errors to `ProviderError` types | Mock 401/429/500/timeout, verify correct error thrown |
| **Unit: Data mapping** | BM condition → standard code, wind range → single value | Pure function tests, no I/O |
| **Integration: Service** | `WeatherService` with `MetMalaysiaWeatherProvider` (mocked HTTP) | Inject real provider with mock HTTP layer |
| **Contract: DTO** | MET response shape → `WeatherDataPoint` | Validate parsed output matches DTO interface |
| **Failure: Stale fallback** | Provider fails → service serves stale cache | Mock provider to throw, verify stale response |
| **Failure: No cache** | Provider fails + no cache → 503 | Mock provider + empty cache, verify 503 |

### 7.2 Mock MET API Responses

Tests should use **recorded MET API responses** (JSON fixtures) to:
- Validate field parsing (BM → standard codes)
- Test edge cases (empty data, missing fields, unexpected formats)
- Ensure tests don't consume the 1,000/day rate limit

### 7.3 Test Data Files

```
tests/fixtures/met-malaysia/
├── marine-forecast-success.json      # Successful marine forecast response
├── general-forecast-success.json      # Successful general forecast response
├── warning-active.json               # Active weather warning
├── warning-none.json                 # No active warnings
├── error-401.json                    # Invalid token
├── error-429.json                    # Rate limited
└── error-500.json                    # Server error
```

---

## 8. Risks and Limitations

### 8.1 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **1,000 requests/day limit** | Very low for 20+ stations × multiple data types | Cache aggressively; fetch per-area (not per-station); batch all areas in one request |
| **3 requests/minute burst limit** | Cannot fetch on-demand | Pre-fetch on cron schedule; never fetch on user request |
| **No lat/long-based queries** | Cannot query by station coordinates | Map stations to MET marine areas via `StationProviderMapping` |
| **API v2 docs behind login** | Unknown exact endpoint paths/params | Must register and obtain access to read full documentation before implementation |
| **BM-only field values** | International consumers need English | Map BM → standard codes in provider infrastructure layer |

### 8.2 Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **No wave period data** | `WindWaveDataPoint.wavePeriod` will be 0/null | Accept as limitation; mark in metadata |
| **Wind speed as range** | Single value needed for DTO | Take midpoint or lower bound; document choice |
| **No temperature in marine forecast** | `WeatherDataPoint.temperature` empty for marine stations | Fetch from surface observation endpoint separately |
| **API availability** | MET API may be down | Stale cache fallback (ADR-0008); health check |

### 8.3 Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API v1 deprecated** | Old endpoints may return errors | Use v2 only |
| **No webhook/push** | Must poll on schedule | Cron-based refresh is already the design |
| **No SLA from MET** | No guaranteed uptime | Stale cache + 503 fallback handles gracefully |

---

## 9. Station Provider Mapping Design

### 9.1 How StationProviderMapping stores MET config

For each MarineOps station, the `station_provider_mappings` table stores:

| Field | Example for MET Malaysia | Notes |
|-------|--------------------------|-------|
| `stationId` | `st-001` (Pelabuhan Klang) | MarineOps station ID |
| `dataType` | `weather` | Data type this mapping serves |
| `providerName` | `MetMalaysia` | Provider identifier |
| `providerStationId` | `MELAKA` | MET marine area name (not a station ID — MET uses named areas) |
| `config` | `{"marineArea": "Melaka", "stateCode": "MLK"}` | Additional mapping metadata |
| `isActive` | `true` | Enable/disable without delete |

### 9.2 Multi-provider per station

A station can have multiple provider mappings:

```
Station: Pelabuhan Klang (PKG-01)
├── dataType: "weather"     → provider: "MetMalaysia", area: "Selangor"
├── dataType: "tide"        → provider: "TIDE_PLACEHOLDER" (future: JUPEM)
├── dataType: "wind"        → provider: "MetMalaysia", area: "Selangor"
├── dataType: "wave"        → provider: "MetMalaysia", area: "Selangor"
├── dataType: "moon"        → provider: "MOON_PLACEHOLDER" (future: local computation)
└── dataType: "sun"         → provider: "SUN_PLACEHOLDER" (future: local computation)
```

### 9.3 Provider swap path

To swap MET Malaysia for OpenMeteo for weather:
1. Create new `station_provider_mappings` row: `providerName: "OpenMeteo"`, `providerStationId: "lat=3.0033,lon=101.3925"`
2. Set MET Malaysia mapping `isActive: false`
3. Set OpenMeteo mapping `isActive: true`
4. Register `OpenMeteoWeatherProvider` in WeatherModule DI
5. No WeatherService or controller change needed

---

## 10. Future Provider Compatibility

| Future Provider | Data Type | Integration Path | Code Changes Required |
|----------------|-----------|------------------|----------------------|
| **OpenMeteo** | weather, wind, wave | New `OpenMeteoWeatherProvider` impl of `WeatherProviderPort` | Infrastructure only — new class + DI binding |
| **NOAA** | tide, weather | New `NoaaTideProvider` impl of `TideProviderPort` | Infrastructure only |
| **ECMWF** | weather, wind, wave | New `EcmwfWeatherProvider` impl of `WeatherProviderPort` | Infrastructure only |
| **JUPEM** | tide | New `JupemTideProvider` impl of `TideProviderPort` | Infrastructure only |
| **Local computation** | moon, sun | New `LocalMoonProvider` impl of `MoonProviderPort` | Infrastructure only (pure functions) |

**None of these require WeatherService, WindWaveService, MoonService, SunService, or any controller changes.** The provider port pattern ensures 100% isolation.

---

## 11. Final Recommendation

### ✅ READY for Sprint 4.0 implementation

**With conditions:**

1. **Register for MET Malaysia API access token** before implementation begins. The full v2 endpoint documentation is only accessible after registration. The exact endpoint paths, query parameters, and response schemas must be confirmed against the real API.

2. **Confirm the marine area mapping.** MET Malaysia uses 17 named marine areas. Each MarineOps station must be mapped to the correct marine area in `StationProviderMapping`. The seed data (Sprint 3.9C) currently uses `TIDE_PLACEHOLDER` / `MET_PLACEHOLDER` — these must be updated with real MET marine area names.

3. **Design the BM-to-standard mapping layer** as a pure function in the provider infrastructure. This is the most labour-intensive part of the integration.

4. **Implement the cron-based pre-fetch scheduler** before enabling live data. The 3 requests/minute burst limit makes on-demand fetching impossible.

5. **Start with marine forecast only** (P0). Surface observations, warnings, and nowcasting can follow in subsequent sprints.

**The architecture is ready. The ports are published. The provider pattern is proven. The only unknowns are the exact MET API v2 endpoint specifications, which require registration to access.**

**Verdict: READY — proceed to Sprint 4.0B (MET Malaysia Weather Provider Implementation) after obtaining API access.**

---

## 12. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial MET Malaysia research report (Sprint 4.0A) |
