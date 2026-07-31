# ADR-0006: Project direction change — MarineOps Enforcement archived, MarineOps Calendar active

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Project Manager (PMD-0001), Chief Software Architect  
**Supersedes:** ADR-0005 (product assumptions for MarineOps Enforcement Phase 1) — superseded for active scope only; ADR-0005 remains valid for the archived Enforcement project.

## Context

Project Management Directive PMD-0001 (2026-07-31) changes the active project direction:

- The previous project, **MarineOps Enforcement** (Enforcement Operations Management: vessels, work orders, compliance evidence, audit), is **archived** as historical reference.
- The active project is now **MarineOps Calendar** (Marine Operational Planning: stations, marine calendar, tide, moon phase, Hijri calendar, weather, wind, wave height, sunrise, sunset, dashboard, patrol planner, notifications, reports, settings).
- Reason: project scope shifted from enforcement operations management to marine operational planning.

PMD-0001 directives:

1. Previous Sprint 0 documentation shall NOT be modified — it is archived.  
2. A new Sprint 0 baseline shall be created for MarineOps Calendar.  
3. Engineering standards, coding standards, review process, and governance process remain unchanged.  
4. Chief Software Architect is authorised to establish new Sprint 0 documentation: Product Vision, SRS, Domain Model, System Architecture, new ADRs.  
5. A new Sprint 0 Completion Certificate shall be issued.  
6. This decision supersedes all previous scope assumptions.

## Decision

1. **Archive** all previous MarineOps Enforcement documentation under `archive/enforcement/` — unmodified, read-only, historical reference.  
2. **Rebuild** `docs/` as the active documentation tree for MarineOps Calendar.  
3. **Carry forward unchanged:** `ENGINEERING_STANDARDS.md`, `DEFINITION_OF_DONE.md`, ADR process rules, folder-structure conventions. Governance is process, not product — it survives the scope change.  
4. **Create new** artifacts: Product Vision, SRS, Domain Model, System Architecture, Folder Structure, Roadmap, ADRs — scoped to MarineOps Calendar.  
5. **Technology stack (ADR-0004) is re-confirmed** for MarineOps Calendar: NestJS, Prisma, PostgreSQL, React, TypeScript, TailwindCSS, JWT, pnpm. The stack decision is product-agnostic.  
6. **Module list** for MarineOps Calendar (17 modules): Authentication, Users, Stations, Marine Calendar, Tide, Moon Phase, Hijri Calendar, Weather, Wind, Wave Height, Sunrise, Sunset, Dashboard, Patrol Planner, Notifications, Reports, Settings.  
7. **Out of scope:** AIS, VMS, Vessel Tracking, Live Tracking, Geofence, Heatmap.  
8. **Issue** a new Sprint 0 Completion Certificate upon completion.  
9. The `AI-Command-Center/` tree predating this ADR is out of governance scope; it is not part of the approved architecture and must be re-evaluated or removed separately.

## Consequences

### Positive

- Clean architectural baseline for MarineOps Calendar with no ambiguity  
- Governance continuity — engineers follow the same standards and review gates  
- Historical Enforcement docs preserved for audit and reference  
- Stack reuse avoids re-litigating technology decisions  

### Negative / trade-offs

- Previous module implementations (if any) for Enforcement are obsolete  
- Domain model is entirely new — aggregate design work restarts  
- ADR-0005 assumptions (vessel identifier, vertical focus, etc.) no longer apply to active scope  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Modify Enforcement docs in place | PMD-0001 explicitly forbids modifying previous documentation |
| Merge Enforcement + Calendar into one scope | Two distinct products; merging violates single-source-of-truth |
| Choose a new technology stack | No technical reason; ADR-0004 stack is product-agnostic and still optimal |

## References

- PMD-0001 (Project Management Directive — Project Direction Change)  
- `archive/enforcement/` (archived Sprint 0 documentation)  
- ADR-0004 (technology stack — re-confirmed)  
- ADR-0005 (superseded for active scope; retained in archive)  
- `docs/governance/ENGINEERING_STANDARDS.md` (unchanged)  
- `docs/governance/DEFINITION_OF_DONE.md` (unchanged)