# ADR-0009: Technology stack re-confirmation for MarineOps Calendar

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Chief Software Architect

## Context

ADR-0004 (archived under `archive/enforcement/`) selected the technology stack for the MarineOps Enforcement project. PMD-0001 changes the active project to MarineOps Calendar. The technology stack decision must be re-confirmed or changed for the new scope.

MarineOps Calendar has different characteristics than Enforcement:

- Heavy reliance on external data sources (tide, weather, astronomy) — see ADR-0008  
- Read-heavy workload (users view calendar data; fewer writes than an enforcement ops system)  
- Scheduled background tasks (data refresh)  
- Real-time-ish UI updates for weather/tide may be desirable  

However, the core architectural needs are identical: modular monolith, DDD, API-first, RBAC, audit, PostgreSQL, type safety.

## Decision

**Re-confirm the ADR-0004 stack without change** for MarineOps Calendar:

| Layer | Choice |
|-------|--------|
| Language / runtime | TypeScript 5.x, Node.js 22 LTS |
| API framework | NestJS |
| Validation | Zod |
| Database | PostgreSQL 16 |
| ORM / migrations | Prisma |
| Object storage | S3-compatible (MinIO local, AWS S3 prod) |
| Web client | React 19 + TanStack Router + TanStack Query |
| CSS | Tailwind CSS |
| Auth | JWT httpOnly cookies + bcrypt/argon2 |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Package manager | pnpm |
| Linting | ESLint + Prettier |
| CI | GitHub Actions |

### Additional: scheduled tasks

For the data-refresh scheduling need (ADR-0008), use **NestJS Schedule** (`@nestjs/schedule`) with cron-based jobs. This is a NestJS-native module — no new framework or external scheduler required for Phase 1.

If scheduling complexity grows (batch refreshes, retries, backoff), a dedicated queue (BullMQ + Redis) may be introduced in a later phase via a new ADR.

## Consequences

### Positive

- No re-litigation of stack — engineers and tooling are already aligned  
- NestJS Schedule handles data-refresh cron jobs natively  
- Full-stack TypeScript type safety retained  

### Negative / trade-offs

- NestJS Schedule is in-process — if the API process restarts, a running job is lost (acceptable for Phase 1; idempotent re-fetch on startup mitigates)  
- No dedicated queue yet — heavy batch refreshes may block the event loop if not carefully written  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Switch to Go/Python | No technical reason; TypeScript stack is product-agnostic |
| Use BullMQ + Redis from day one | Adds Redis dependency for a scheduling need that cron handles in Phase 1 |
| Use a separate worker process | Premature; NestJS Schedule keeps deployment simple |

## References

- ADR-0004 (archived — original stack selection rationale)  
- ADR-0006 (project direction change)  
- ADR-0008 (external data source strategy — drives scheduling need)  
- `docs/architecture/SYSTEM_ARCHITECTURE.md` §12