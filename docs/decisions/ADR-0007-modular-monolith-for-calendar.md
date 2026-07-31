# ADR-0007: Modular monolith for MarineOps Calendar

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Chief Software Architect

## Context

MarineOps Calendar has 17 modules ranging from authentication and users to environmental data (tide, weather, wind, wave, sun/moon) and planning (patrol planner, calendar). The system is online-first, single-organization, and serves marine operational planning.

The same forces that drove ADR-0002 (archived) apply: unknown team size and traffic, need for clear domain boundaries, and no justification for distributed-systems complexity on day one.

## Decision

Implement MarineOps Calendar as a **modular monolith**: one backend deployable (NestJS) and one web frontend (React), internally split into domain modules with `domain / application / infrastructure / api` layers, in-process ports, and domain events.

Extract a module to a separate service only with a new ADR proving need (scale, team ownership, isolation).

## Consequences

### Positive

- Faster delivery, simpler transactions, single deploy  
- Forces real module boundaries without network complexity  
- Domain events enable loose coupling for notifications and reporting  

### Negative / trade-offs

- Discipline required to avoid a "ball of mud"  
- Single runtime scaling unit initially  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Microservices from day one | Premature distribution; 17 small modules would create ops overhead |
| Classic unstructured monolith | Hard to evolve domains; violates governance standards |

## References

- `docs/architecture/SYSTEM_ARCHITECTURE.md`  
- `docs/structure/FOLDER_STRUCTURE.md`  
- ADR-0006 (project direction change)