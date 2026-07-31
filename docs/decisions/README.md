# Architecture Decision Records (ADRs)

ADRs capture **significant** decisions that affect structure, stack, security, or cross-module design.

## Rules

1. One decision per file.  
2. Number sequentially: `ADR-0001`, `ADR-0002`, …  
3. Status: `Proposed` → `Accepted` | `Rejected` | `Superseded by ADR-XXXX`.  
4. Never delete Accepted ADRs; supersede instead.  
5. Link ADRs from architecture docs when they lock a choice.  

## Template

Copy `ADR-0000-template.md`.

## Index

### MarineOps Enforcement (archived — historical reference)

ADRs 0001–0005 were created for the archived MarineOps Enforcement project. They are preserved unmodified under `archive/enforcement/`. They remain valid as historical record only.

| ADR | Title | Status |
|-----|-------|--------|
| 0001 | Record architecture decisions | Archived |
| 0002 | Modular monolith first | Archived |
| 0003 | Docs-first delivery | Archived |
| 0004 | Technology stack selection | Archived (stack re-confirmed for Calendar via ADR-0009) |
| 0005 | Product assumptions for Phase 1 | Archived (superseded for active scope) |

### MarineOps Calendar (active)

| ADR | Title | Status |
|-----|-------|--------|
| [0006](ADR-0006-project-direction-change.md) | Project direction change — Enforcement archived, Calendar active | Accepted |
| [0007](ADR-0007-modular-monolith-for-calendar.md) | Modular monolith for MarineOps Calendar | Accepted |
| [0008](ADR-0008-calendar-data-source-strategy.md) | External data source strategy (tide, weather, sun/moon) | Accepted |
| [0009](ADR-0009-technology-stack-reconfirmation.md) | Technology stack re-confirmation for MarineOps Calendar | Accepted |
| [0010](ADR-0010-authentication-jwt-strategy.md) | Authentication strategy — JWT with refresh rotation | Accepted |