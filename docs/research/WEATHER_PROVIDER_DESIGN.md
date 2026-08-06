# Sprint 4.0B — Weather Provider Pipeline Design

**Author:** Principal Integration Architect  
**Date:** 2026-08-06  
**Status:** Design — No code implemented  
**Related:** MET_MALAYSIA_PROVIDER_RESEARCH.md, PUBLIC_API.md, OPENAPI.md, STATION_API.md, ADR-0008, ADR-0012  
**Architecture:** Frozen v2.1.0

---

## 1. Pipeline Overview

The complete provider pipeline has **7 layers**, each with a single responsibility:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC API REQUEST                          │
│  GET /api/public/weather?stationId=st-001&dateFrom&dateTo      │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Controller (presentation)                            │
│  PublicWeatherController                                        │
│  • Parses query params                                          │
│  • Delegates to WeatherService                                  │
│  • Returns HTTP response                                        │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Service (application orchestration)                  │
│  WeatherService                                                 │
│  • Validates dates                                              │
│  • Checks L2 cache (fresh/stale/miss)                          │
│  • Calls provider if stale/miss                                │
│  • Builds Freshness envelope                                   │
│  • Returns WeatherResponse                                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Provider Port (contract)                             │
│  WeatherProviderPort                                           │
│  • Interface: getForecast(stationId, dateFrom, dateTo)        │
│  • Implemented by infrastructure                               │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: Provider Implementation (infrastructure I/O)         │
│  MetMalaysiaWeatherProvider                                    │
│  • Reads StationProviderMappingPort for area mapping           │
│  • Constructs HTTP request to MET API                          │
│  • Handles auth, timeout, retry                                │
│  • Returns raw MET response                                    │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: Raw DTO (provider-specific)                         │
│  MetRawForecast / MetRawMarineForecast                         │
│  • TypeScript interfaces matching MET JSON shape               │
│  • No transformation — exact mirror of provider response       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 6: Mapper (transformation)                              │
│  MetWeatherMapper / MetMarineMapper                            │
│  • Pure functions: Raw DTO → Internal DTO                     │
│  • BM condition → standard code                               │
│  • BM wind direction → compass                                 │
│  • Wind speed range → single value (km/h → knots)             │
│  • Wave height range → single value                           │
│  • Date format → ISO 8601                                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 7: Internal DTO (domain)                                │
│  WeatherDataPoint / WindWaveDataPoint                          │
│  • Provider-agnostic — same shape regardless of source        │
│  • Returned to service → cached → served to controller        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 Controller (Layer 1)

**File:** `src/api/public/public-weather.controller.ts` (existing — no change)

**Responsibility:** Parse HTTP, delegate to service, return response.

**Does NOT:**
- Call providers directly
- Know which provider is active
- Build freshness
- Transform data

### 2.2 Service (Layer 2)

**File:** `src/modules/weather/application/weather.service.ts` (existing — minor enhancement for cache)

**Responsibility:** Orchestrate cache check, provider call, freshness envelope.

**Future state (when caching is added):**
```
getWeather(stationId, dateFrom, dateTo):
  1. Validate dates (existing)
  2. Check L2 cache (weather_cache table)
     ├── fresh → return cached + freshness(fresh)
     ├── stale → try provider (with retry)
     │     ├── success → upsert cache → return + freshness(fresh)
     │     └── fail → return cached + freshness(stale)
     └── miss → try provider
           ├── success → insert cache → return + freshness(fresh)
           └── fail → throw ProviderUnavailableError → 503
  3. Build freshness envelope
  4. Return WeatherResponse
```

**Does NOT:**
- Know about MET API
- Parse BM field values
- Know station coordinates

### 2.3 Provider Port (Layer 3)

**File:** `src/modules/weather/domain/weather-provider.port.ts` (existing — no change)

**Contract:**
```typescript
interface WeatherProviderPort {
  getCurrentWeather(stationId: string): Promise<WeatherDataPoint>;
  getForecast(stationId: string, dateFrom: string, dateTo: string): Promise<WeatherDataPoint[]>;
}
```

**Key principle:** The port returns **already-mapped internal DTOs**, not raw provider responses. The mapper runs inside the provider implementation before returning. This keeps the service layer clean.

### 2.4 Provider Implementation (Layer 4)

**File:** `src/modules/weather/infrastructure/met-malaysia-weather.provider.ts` (new)

**Responsibility:**
1. Resolve station → MET marine area via `StationProviderMappingPort`
2. Construct HTTP request to `api.met.gov.my`
3. Add Bearer token from environment
4. Execute request with 10s timeout
5. Retry on failure (3 attempts, exponential backoff)
6. On HTTP error → throw `ProviderError` subtype
7. On success → pass raw JSON to mapper
8. Return mapped `WeatherDataPoint[]`

**Dependencies:**
- `StationProviderMappingPort` (to resolve station → MET area)
- `MET_MALAYSIA_API_KEY` (environment, fail-fast)
- `MetWeatherMapper` (pure functions)

### 2.5 Raw DTO (Layer 5)

**File:** `src/modules/weather/infrastructure/met-raw-dto.ts` (new)

**Purpose:** TypeScript interfaces that exactly mirror MET API JSON responses. No transformation. Provider-specific.

```typescript
interface MetRawForecastItem {
  date: string;          // "06/08/2026"
  condition: string;     // "Ribut petir di beberapa tempat"
  morningForecast: string;
  afternoonForecast: string;
  nightForecast: string;
  windDirection: string;  // "BD"
  windSpeed: string;      // "10-20km/h"
  waveHeight: string;     // "0.5-1.0 m"
}

interface MetRawForecastResponse {
  // Structure to be confirmed after API registration
  data: MetRawForecastItem[];
  // Metadata fields as MET provides
}
```

**Rule:** Raw DTOs are **never exported** from the infrastructure layer. They are internal to the provider implementation. Only mapped internal DTOs cross the port boundary.

### 2.6 Mapper (Layer 6)

**File:** `src/modules/weather/infrastructure/met-weather-mapper.ts` (new)

**Responsibility:** Pure functions that transform `MetRawForecastItem` → `WeatherDataPoint`.

**Characteristics:**
- **Pure functions** — no I/O, no side effects, no async
- **Testable in isolation** — pass raw DTO in, get internal DTO out
- **Provider-specific** — each provider has its own mapper
- **Never imported by service or domain** — only by the provider implementation

**Mapper functions:**

```typescript
// BM condition → standard code
function mapCondition(bmCondition: string): string;
// "Ribut petir di beberapa tempat" → "THUNDERSTORM"

// BM wind direction → standard compass
function mapWindDirection(bmCode: string): string;
// "BD" → "SW"

// Wind speed range → single value in knots
function parseWindSpeedKnots(rangeStr: string): number;
// "10-20km/h" → 8.1 (midpoint 15 km/h × 0.54 = 8.1 knots)

// Wind speed range → upper bound in knots (for gusts)
function parseWindGustsKnots(rangeStr: string): number;
// "10-20km/h" → 10.8 (20 km/h × 0.54)

// Wave height range → single value in meters
function parseWaveHeight(rangeStr: string): number;
// "0.5-1.0 m" → 0.75

// Date string → ISO date
function parseMetDate(metDate: string): string;
// "06/08/2026" → "2026-08-06"

// Full raw → internal mapping
function mapForecast(raw: MetRawForecastItem): WeatherDataPoint;
```

### 2.7 Internal DTO (Layer 7)

**File:** `src/modules/weather/domain/weather-dto.ts` (existing — no change)

**Contract:**
```typescript
interface WeatherDataPoint {
  date: string;          // ISO 8601 date
  temperature: number;   // °C
  conditions: string;    // Standard code (CLEAR, THUNDERSTORM, etc.)
  visibility: number;    // km
  precipitation: number; // mm
}
```

**Key principle:** This is the **provider-agnostic** shape. Whether data comes from MET Malaysia, OpenMeteo, or NOAA, the DTO is identical. The mapper absorbs all provider-specific differences.

---

## 3. Mapper Architecture (Detailed)

### 3.1 Why mappers are separate from providers

| Concern | Provider (I/O) | Mapper (Pure) |
|---------|----------------|---------------|
| HTTP calls | ✅ | ❌ |
| Auth/tokens | ✅ | ❌ |
| Retry/timeout | ✅ | ❌ |
| Error classification | ✅ | ❌ |
| Field transformation | ❌ | ✅ |
| Unit/BM conversion | ❌ | ✅ |
| Date format parsing | ❌ | ✅ |
| Testable without HTTP | ❌ | ✅ |

Separation makes mappers **100% unit-testable** with no mocks — just input/output assertions.

### 3.2 MET Weather Mapper

| Input (Raw) | Transform | Output (Internal) |
|------------|-----------|-------------------|
| `"06/08/2026"` | Parse DD/MM/YYYY → YYYY-MM-DD | `date: "2026-08-06"` |
| `"Ribut petir di beberapa tempat"` | BM condition lookup table | `conditions: "THUNDERSTORM"` |
| (Not in marine forecast) | Default 0 | `temperature: 0` |
| (Not in marine forecast) | Default 0 | `visibility: 0` |
| (Not in marine forecast) | Default 0 | `precipitation: 0` |

### 3.3 MET Marine Mapper (for WindWave)

| Input (Raw) | Transform | Output (Internal) |
|------------|-----------|-------------------|
| `"06/08/2026"` | Parse DD/MM/YYYY | `date: "2026-08-06"` |
| `"BD"` | BM compass → standard | `windDirection: "SW"` |
| `"10-20km/h"` | Range → midpoint, km/h → knots | `windSpeed: 8.1` |
| `"10-20km/h"` | Range → upper bound, km/h → knots | `windGusts: 10.8` |
| `"0.5-1.0 m"` | Range → midpoint | `waveHeight: 0.75` |
| (Not available) | Default 0 | `wavePeriod: 0` |

### 3.4 Future Provider Mapper Reuse

Each provider implements its **own mapper** because each provider's raw format differs:

```
MET Malaysia:    MetWeatherMapper    (BM conditions, DD/MM/YYYY dates, km/h ranges)
OpenMeteo:       OpenMeteoMapper     (English conditions, ISO dates, m/s single values)
NOAA:            NoaaMapper          (English codes, ISO dates, various units)
ECMWF:           EcmwfMapper         (GRIB/NetCDF → domain DTO)
```

**All mappers output the same internal DTO.** The service and controller never change.

**Mapper interface (convention, not enforced):**
```typescript
// Each provider's mapper is a set of pure functions.
// No common interface needed — mappers are called only by their own provider.
// The provider is responsible for calling its mapper.
```

---

## 4. Cache Design (Future — Not Implemented Now)

### 4.1 L2 Cache Table

Per ADR-0008 and ERD.md:

```
weather_cache
├── id (PK)
├── station_id (indexed)
├── parameter (e.g. "forecast", "marine", "observation")
├── fetched_at (timestamptz)
├── valid_until (timestamptz)
├── payload (JSONB — cached WeatherDataPoint[])
└── source (e.g. "metmalaysia")
```

Unique: `(station_id, parameter)`  
Freshness: `now < valid_until` = fresh; `now ≥ valid_until` = stale.

### 4.2 Cache Flow in WeatherService

```
getWeather(stationId, dateFrom, dateTo):
  ┌─ Check weather_cache WHERE station_id = stationId AND parameter = 'forecast'
  │
  ├─ Row exists AND now < valid_until (FRESH):
  │    └─ Return payload from cache + freshness(fresh)
  │
  ├─ Row exists AND now ≥ valid_until (STALE):
  │    └─ Try provider.getForecast() (3 retries)
  │         ├─ Success → UPSERT cache row → return fresh
  │         └─ Fail → return cached payload + freshness(stale)
  │
  └─ No row (MISS):
       └─ Try provider.getForecast() (3 retries)
            ├─ Success → INSERT cache row → return fresh
            └─ Fail → throw ProviderUnavailableError → 503
```

### 4.3 Cache TTL per Data Type

| Data type | valid_until offset | Source |
|-----------|-------------------|--------|
| Marine forecast | +6 hours | MET updates ~4× daily |
| General forecast | +3 hours | MET updates ~8× daily |
| Observations | +1 hour | Hourly updates |

### 4.4 Cache Invalidation

| Event | Action |
|-------|--------|
| Cron refresh succeeds | UPSERT cache row with new `valid_until` |
| Cron refresh fails | Leave existing row (now stale) |
| Admin manual refresh | UPSERT cache row immediately |
| Station archived | Cache row expires naturally; no active purge needed |

---

## 5. Retry Strategy

### 5.1 Retry Policy

| Attempt | Delay | Max Delay | Condition |
|---------|-------|-----------|-----------|
| 1 (initial) | 0s | — | Always |
| 2 | 5s | — | If error is retryable (429, 500, 502, 503, timeout, network) |
| 3 | 15s | — | If error is retryable |
| After 3 | — | — | Give up: serve stale or 503 |

### 5.2 Non-retryable Errors

These are **not** retried — they will always fail:

| HTTP Status | Reason |
|------------|--------|
| 401 | Invalid token (retrying won't help) |
| 403 | No permission (retrying won't help) |
| 404 | Area not found (data issue, not transient) |

### 5.3 Retryable Errors

| HTTP Status | Reason | Retry |
|------------|--------|-------|
| 429 | Rate limited | ✅ (with delay) |
| 500 | Server error | ✅ |
| 502 | Bad gateway | ✅ |
| 503 | Service unavailable | ✅ |
| Timeout | Request timed out | ✅ |
| Network error | DNS/connection refused | ✅ |

### 5.4 Retry Implementation Location

Retry logic lives in the **provider implementation** (Layer 4), not the service. The service does not know about retries — it just calls the port and either gets data or gets a `ProviderError`.

---

## 6. Logging Strategy

### 6.1 What to Log

| Event | Level | Data |
|-------|-------|------|
| Provider request sent | debug | `{ stationId, endpoint, area }` (no API key) |
| Provider response received | debug | `{ stationId, statusCode, responseSize }` |
| Provider retry | warn | `{ attempt, delay, error }` |
| Provider failed (all retries exhausted) | error | `{ stationId, error, stack }` |
| Cache hit (fresh) | debug | `{ stationId, validUntil }` |
| Cache hit (stale) | warn | `{ stationId, validUntil, servingStale: true }` |
| Cache miss + provider fail | error | `{ stationId, error }` |
| BM mapping failure (unknown condition) | warn | `{ rawValue, defaultValue }` |

### 6.2 What NOT to Log

| Item | Reason |
|------|--------|
| API key / Bearer token | Security |
| Full response payload (at info level) | Size + potential PII if MET includes location names |
| User's IP address | Not relevant to provider calls |

### 6.3 Correlation

Each provider request should include a correlation ID (UUID) in the log context, so the full request → retry → cache → response chain can be traced.

---

## 7. Provider Error Types

### 7.1 Error Hierarchy

```
ProviderError (base)
├── ProviderAuthError          (401, 403)
├── ProviderDataNotFoundError  (404)
├── ProviderRateLimitedError   (429)
├── ProviderServerError         (500, 502, 503)
├── ProviderTimeoutError        (request timeout)
└── ProviderNetworkError       (DNS, connection refused)
```

### 7.2 Error to HTTP Mapping

| Provider Error | Service Action | HTTP to Client | Freshness |
|----------------|---------------|----------------|-----------|
| `ProviderAuthError` | Serve stale if available | 200 (stale) or 503 | `stale` / `unavailable` |
| `ProviderDataNotFoundError` | Serve stale if available | 200 (stale) or 404 | `stale` |
| `ProviderRateLimitedError` | Serve stale | 200 (stale) | `stale` |
| `ProviderServerError` | Serve stale | 200 (stale) | `stale` |
| `ProviderTimeoutError` | Serve stale | 200 (stale) | `stale` |
| `ProviderNetworkError` | Serve stale | 200 (stale) | `stale` |
| Any + no cache | 503 | 503 `PROVIDER_UNAVAILABLE` | `unavailable` |

### 7.3 Error Location

Provider errors are **thrown by the provider** (Layer 4) and **caught by the service** (Layer 2). The service decides whether to serve stale or return 503.

The `DomainExceptionFilter` maps `PROVIDER_UNAVAILABLE` → HTTP 503.

---

## 8. Station Resolution Flow

### 8.1 How a stationId becomes a MET API request

```
1. WeatherService.getWeather("st-001", dateFrom, dateTo)
2. Provider.getForecast("st-001", dateFrom, dateTo)
3. Provider calls StationProviderMappingPort.getByStationAndType("st-001", "weather")
4. Returns: { providerName: "MetMalaysia", providerStationId: "Selangor", config: { marineArea: "Selangor" } }
5. Provider constructs HTTP request:
   GET https://api.met.gov.my/v2/forecast?marinearea=Selangor&...
   Authorization: Bearer <METMALAYSIA_API_KEY>
6. MET API returns raw JSON
7. Provider passes raw JSON to MetWeatherMapper
8. Mapper returns WeatherDataPoint[]
9. Provider returns WeatherDataPoint[] to service
10. Service caches + returns to controller
```

### 8.2 StationProviderMapping config shape

```json
{
  "marineArea": "Selangor",
  "stateCode": "SEL",
  "forecastEndpoint": "/forecast/marine",
  "observationEndpoint": "/observation"
}
```

The `config` JSONB field is flexible — each provider can store whatever it needs. MET needs `marineArea`; OpenMeteo would store `lat`/`lon`.

---

## 9. Future Provider Compatibility

### 9.1 Adding OpenMeteo (No Service Change)

```
1. Create: src/modules/weather/infrastructure/openmeteo-weather.provider.ts
   - Implements WeatherProviderPort
   - Uses OpenMeteo's lat/long API
   - Has its own OpenMeteoMapper (English, ISO dates, m/s)
   - Reads station lat/long from StationsQueryPort

2. Register in WeatherModule:
   { provide: WEATHER_PROVIDER, useClass: OpenMeteoWeatherProvider }
   (replaces MetMalaysiaWeatherProvider)

3. Update StationProviderMapping:
   providerStationId: "lat=3.0033,lon=101.3925"

4. No changes to:
   - WeatherProviderPort (interface unchanged)
   - WeatherService (depends on port, not provider)
   - PublicWeatherController (depends on service)
   - WeatherDataPoint (DTO unchanged)
```

### 9.2 Adding NOAA (No Service Change)

Same pattern — NOAA would have its own provider + mapper, implementing the same port. The service, controller, and DTO are untouched.

### 9.3 Multi-Provider (Future Enhancement)

Future: route different stations to different providers simultaneously:

```
Station A → MetMalaysiaWeatherProvider
Station B → OpenMeteoWeatherProvider
```

This would require a **provider router** that reads `StationProviderMapping.providerName` and selects the right provider. The service would call the router instead of a single injected provider. This is a future enhancement and does not require redesign — just a new `WeatherProviderRouter` implementing `WeatherProviderPort` that delegates to the correct provider per station.

---

## 10. File Structure (Planned)

```
src/modules/weather/
├── domain/
│   ├── weather-dto.ts                 (existing — no change)
│   ├── weather-provider.port.ts       (existing — no change)
│   └── index.ts                        (existing — no change)
├── application/
│   ├── weather.service.ts             (existing — add cache logic later)
│   ├── weather.service.spec.ts        (existing — update when cache added)
│   └── index.ts                        (existing — no change)
├── infrastructure/
│   ├── placeholder-weather.provider.ts (existing — kept for dev/test)
│   ├── met-malaysia-weather.provider.ts (NEW — provider impl)
│   ├── met-raw-dto.ts                  (NEW — raw MET response types)
│   ├── met-weather-mapper.ts           (NEW — pure mapping functions)
│   ├── met-weather-mapper.spec.ts      (NEW — mapper unit tests)
│   ├── provider-errors.ts              (NEW — error type hierarchy)
│   └── index.ts                        (existing — add new exports)
└── api/
    └── weather.module.ts               (existing — change DI binding)
```

Same structure for WindWave:

```
src/modules/wind-wave/
├── infrastructure/
│   ├── placeholder-wind-wave.provider.ts  (existing)
│   ├── met-malaysia-marine.provider.ts     (NEW)
│   ├── met-raw-marine-dto.ts               (NEW)
│   ├── met-marine-mapper.ts                (NEW)
│   ├── met-marine-mapper.spec.ts           (NEW)
│   └── provider-errors.ts                  (shared or per-module)
```

---

## 11. Design Rules (Binding)

| Rule | Enforcement |
|------|-------------|
| Raw DTOs never leave infrastructure layer | TypeScript visibility + barrel exports |
| Mappers are pure functions (no async, no I/O) | Code review + unit test pattern |
| Provider errors thrown in infrastructure, caught in application | Architecture convention |
| API key only in infrastructure, never in domain/application | Code review + lint |
| Freshness envelope built by service, not provider | Existing code convention |
| Controller never imports provider | FOLDER_STRUCTURE §2.2 + lint |
| Each provider has its own mapper | Convention — no shared mapper interface |
| Port returns mapped internal DTO, not raw | Provider implementation responsibility |

---

## 12. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial weather provider pipeline design (Sprint 4.0B) |
