# ADR-0008: External data source strategy (tide, weather, sun/moon)

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Chief Software Architect

## Context

MarineOps Calendar differs from the archived Enforcement project in a critical way: **most of its domain data originates externally**. Tide predictions, weather forecasts, wind data, wave height, sunrise/sunset times, and moon phase calculations are produced by third-party APIs or astronomical computation libraries — not entered by users.

This creates an architectural force that did not exist in the Enforcement project:

1. **Volatility** — external APIs change, rate-limit, or go offline.  
2. **Freshness** — tide and weather data must be refreshed on a schedule.  
3. **Cost** — some marine weather APIs are paid per call.  
4. **Fallback** — the system must degrade gracefully when an external source is unavailable.  
5. **Determinism** — astronomical events (sunrise, sunset, moon phase, Hijri calendar dates) are **computable** and do not require external APIs; they should be computed locally to avoid unnecessary dependencies.

## Decision

### 1. Two categories of external data

| Category | Examples | Strategy |
|----------|----------|----------|
| **Computable** | Sunrise, sunset, moon phase, Hijri calendar dates | Local computation via approved library (no external API call) |
| **Sourced** | Tide predictions, weather, wind, wave height | External API via adapter port, with local caching |

### 2. Adapter pattern for all sourced data

Each sourced data type (tide, weather, wind, wave) gets a dedicated **adapter module** that:

- Implements a published port (interface) in its module's `application/` layer.  
- Calls the external API from `infrastructure/`.  
- Caches responses in PostgreSQL with a TTL appropriate to the data type.  
- Falls back to cached data (even if stale) when the external API is unreachable, with a `stale` flag exposed to the UI.  
- Never exposes the external API's response shape directly — always maps to the domain model.

### 3. No external API keys in the domain or application layer

API keys, endpoints, and provider-specific config live in `infrastructure/` and are loaded from environment variables (`.env`). The domain layer knows nothing about which provider is used.

### 4. Cache table convention

Each sourced-data module owns a cache table: `<module>_cache` (e.g., `tide_cache`, `weather_cache`). Schema: `stationId, parameter, fetchedAt, validUntil, payload (JSONB), source`.

### 5. Provider swap without domain change

Because the adapter port is the contract, swapping NOAA tide API for a commercial provider requires only a new `infrastructure/` implementation — no domain or application change.

## Consequences

### Positive

- Domain layer stays pure — no HTTP clients or API keys in domain code  
- Providers are swappable without breaking the domain model  
- System degrades gracefully (stale cache) instead of failing  
- Computable data (sun/moon/Hijri) has zero external dependency and zero cost  
- Testability — adapters can be mocked at the port boundary  

### Negative / trade-offs

- Cache tables add storage and a refresh-scheduling concern  
- Stale data may mislead users if TTLs are too long — mitigated by `stale` flag in UI  
- External API rate limits may throttle batch refreshes — mitigated by scheduling and caching  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Call external APIs live on every request | Latency, cost, rate limits, no offline fallback |
| Compute everything locally | Tide and weather are not reliably computable; requires licensed models |
| Single generic "external data" module | Violates module boundaries; each data type has different semantics and refresh patterns |
| Store raw API responses in domain | Couples domain to provider schema; violates domain purity |

## References

- `docs/architecture/SYSTEM_ARCHITECTURE.md` §5 (bounded contexts), §7 (data architecture)  
- `docs/architecture/DOMAIN_MODEL.md` (module list, adapter ports)  
- `docs/governance/ENGINEERING_STANDARDS.md` §3 (domain purity, no I/O in domain)  
- ADR-0007 (modular monolith)