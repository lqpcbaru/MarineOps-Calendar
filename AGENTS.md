# Agent instructions — MarineOps Calendar

You are working in the **MarineOps Calendar** repository.

## Authority

1. Read and follow everything under `docs/`.  
2. **Chief Software Architect** owns documentation, architecture, planning, SRS, folder structure, roadmap, and software design.  
3. **Do not write application code** unless the user specifically requests implementation.  
4. Always update documentation inside `/docs` for architecture/planning work.  
5. Future engineers and agents must follow the documentation.  
6. Architecture is **frozen at v1.0.0**. Do not redesign, rename modules, or change folder structure.  
7. The `archive/enforcement/` tree is read-only historical reference. Do not modify it.  

## Required reading before implementation tasks

- `docs/governance/ENGINEERING_STANDARDS.md`  
- `docs/structure/FOLDER_STRUCTURE.md`  
- `docs/requirements/SRS.md` (relevant sections)  
- `docs/architecture/SYSTEM_ARCHITECTURE.md`  
- `docs/architecture/DOMAIN_MODEL.md`  
- `docs/decisions/ADR-0008-calendar-data-source-strategy.md` (critical for data modules)  
- `docs/decisions/ADR-0010-authentication-jwt-strategy.md` (critical for auth)  

## Definition of Done

See `docs/governance/DEFINITION_OF_DONE.md`.

## Decisions

Significant choices → `docs/decisions/ADR-NNNN-....md`