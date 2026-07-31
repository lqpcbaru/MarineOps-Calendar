# ADR-0005: Product assumptions for Phase 1 — vertical, tenancy, offline

**Date:** 2026-07-27  
**Status:** Accepted  
**Deciders:** Chief Software Architect  
**Supersedes:** Open questions in `PRODUCT_VISION.md` §9

## Context

`PRODUCT_VISION.md` §9 lists four open product questions that block Phase 1 certainty:

1. Primary vertical focus (ship management, offshore, harbor/tug, yacht, mixed?)  
2. Offline vessel client required in Phase 1?  
3. Multi-company / multi-fleet tenancy model?  
4. Preferred stack constraints (cloud, on-prem, hybrid)?  

Stakeholders are not yet available to answer these. The architecture must proceed with reasonable defaults so Phase 1 scaffolding can begin. Stakeholders may override these assumptions via a superseding ADR or SRS revision before feature implementation begins.

The architecture already documents assumptions: modular monolith, single organization, online-first, with hooks for multi-tenant and offline later. This ADR formalizes, extends, and justifies them.

## Decision

| Question | Assumption | Rationale |
|----------|------------|-----------|
| Primary vertical | **Mixed / general marine ops** — do not specialise for one sub-sector in Phase 1 | Ship management, offshore, harbor, and yacht all share the same core: vessels → WOs → evidence → audit. Specialised fields (e.g. class notation, charter party, towage) can be added via vessel metadata without forking the domain. |
| Offline vessel client in Phase 1? | **No.** Online-first only. | Adds significant architecture complexity (sync engine, conflict resolution, offline queue). Vessel users in Phase 1 can use the responsive web app from any connected device. Offline capability will be designed as a sync agent in Phase 4 with its own ADR. |
| Tenancy model | **Single organization with `organizationId` column from day one.** | Minimal cost to add the column now; zero cost in Phase 1 where only one org row exists. When multi-org is required, data is already partitioned. Multi-org business logic (cross-org visibility, RBAC scoping) is deferred to Phase 3+. |
| Deployment model | **Docker-first, cloud-agnostic.** Target AWS ECS / Fargate as default cloud, but all infrastructure defined as IaC with no hard AWS coupling where avoidable. On-prem deployment supported by design (containers + PostgreSQL + MinIO can run on-prem). | Widest addressable market for marine ops organisations (some run air-gapped or on-prem). Cloud-agnostic design costs little at this stage. |
| Stack constraints | **Open-source stack with no mandatory paid services in critical path.** Object storage and email are the only potential paid services and both follow standard protocols (S3, SMTP) swappable with local equivalents. | Lowers barrier to dev setup and small-fleet adoption. |
| API style | **RESTful JSON over HTTP.** Confirm the architecture default from `SYSTEM_ARCHITECTURE.md` §8. | Standard, well-understood, fits audit/CRUD workflows. GraphQL or tRPC can be evaluated in Phase 3. |
| Multi-language / i18n scope | **English-only UI in Phase 1.** Strings are externalized from day one (i18n keys) but only English translations are provided. | Reduces translation coordination cost during MVP. The infrastructure for i18n costs little to build early. |
| Vessel identifier uniqueness | **Vessel name + organization is the business key.** IMO/MMSI are optional secondary identifiers, not required. | Many smaller vessels (yachts, barges, workboats) have no IMO number. |

## Consequences

### Positive

- No blocking ambiguity — scaffolds can be built immediately  
- Architecture hooks (orgId, i18n keys, cloud-agnostic) cost little now and prevent big rewrites later  
- General vertical keeps the domain model clean; specialists can subclass via metadata and configuration  
- Explicit defaults give stakeholders a concrete baseline to challenge, rather than a void  

### Negative / trade-offs

- If stakeholders later mandate day-1 offline or multi-tenancy, scaffolding rework will be moderate (data model is ready; sync agent is not)  
- "Mixed vertical" may delay some sector-specific features (e.g. yacht guest management) — but those are Phase 4 expansion modules anyway  
- If Microsoft/.NET stack is mandated by a parent company, this entire stack ADR is superseded — but the domain model, SRS, and folder patterns survive regardless  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Wait for stakeholders | Block Phase 1 indefinitely; cannot scaffold anything |
| Hard-specialise for one vertical | Limits market; architecture would need unwind if wrong |
| Design multi-tenant day 1 | Adds RBAC and isolation complexity without a customer asking for it |
| Build offline from day 1 | At least doubles engineering scope for MVP; premature |

## References

- `docs/vision/PRODUCT_VISION.md` §9  
- `docs/architecture/SYSTEM_ARCHITECTURE.md`  
- `docs/roadmap/ROADMAP.md` Phase 0  
- ADR-0002 (modular monolith first)  
- ADR-0004 (technology stack)