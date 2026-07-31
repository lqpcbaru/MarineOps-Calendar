# ADR-0003: Docs-first delivery

**Date:** 2026-07-27  
**Status:** Accepted  
**Deciders:** Chief Software Architect  

## Context

Greenfield repos often accumulate code without shared requirements, causing rework. MarineOps requires multi-role ops semantics (RBAC, audit, WO lifecycle) that must stay consistent.

## Decision

1. Maintain binding documentation under `/docs`.  
2. Architect role owns vision, SRS, architecture, structure, roadmap, governance.  
3. Application code is written only against documented requirements and structure.  
4. Behavior changes update docs in the same delivery unit.  

## Consequences

### Positive

- Shared language; safer parallel work; better agent/engineer onboarding  

### Negative / trade-offs

- Upfront writing cost; docs can lag if discipline slips (mitigate via DoD)  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Code-first, docs later | High rework risk for compliance/ops domains |
| External Confluence only | Diverges from repository |