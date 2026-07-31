# ADR-0002: Modular monolith first

**Date:** 2026-07-27  
**Status:** Accepted  
**Deciders:** Chief Software Architect  

## Context

Team and traffic size are unknown. Microservices early increase ops cost and obscure domain design errors.

## Decision

Implement MarineOps as a **modular monolith**: one API deployable, internal modules with domain/application/infrastructure boundaries, in-process ports and domain events. Extract a module to a separate service only with a new ADR proving need (scale, team ownership, isolation).

## Consequences

### Positive

- Faster delivery, simpler transactions, single deploy  
- Forces real module boundaries without network complexity  

### Negative / trade-offs

- Discipline required to avoid a “ball of mud”  
- Single runtime scaling unit initially  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Microservices from day one | Premature distribution |
| Classic unstructured monolith | Hard to evolve domains |