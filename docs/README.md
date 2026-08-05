# MarineOps Hub Documentation

**Status:** Frozen v2.0.0 (ADR-0011 ratified 2026-07-31)  
**Owner:** Lead Software Architect  
**Audience:** All engineers, product, QA, DevOps

This directory is the **single source of truth** for MarineOps Hub. Application code must follow these documents. If code and docs disagree, **update docs first**, then code.

> **Direction change.** MarineOps Hub supersedes the MarineOps Calendar v1.0.0 baseline per [ADR-0011](decisions/ADR-0011-project-direction-change-to-hub.md) (Accepted). The Calendar v1.0.0 docs are preserved unmodified under `archive/calendar/` as read-only historical reference. Governance (`governance/`) and ADR-0009 (stack) carry forward unchanged.

---

## What is MarineOps Hub?

A modern marine information platform with **two applications sharing one backend**:

1. **Public Portal** — no login. Tide, Marine Weather, Moon Phase, Sunrise/Sunset, Marine Calendar, Marine Alerts, Stations, About.
2. **Admin Portal** — login required (administrators & fisheries officers). Dashboard, User Management, Role & Permission, Calendar CRUD, Station CRUD, Alerts CRUD, Audit Log, Settings. Future: Patrol Planner, AIS, VMS, Vessel Monitoring.

---

## Document map

| Path                                                                       | Purpose                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [requirements/SRS.md](requirements/SRS.md)                                 | Software Requirements Specification (Hub)                                      |
| [architecture/SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md) | §1 Overall architecture — two-portal topology, shared backend, layers, runtime |
| [architecture/MODULE_DEPENDENCY.md](architecture/MODULE_DEPENDENCY.md)     | §3 Module dependency diagram + §4 domain boundaries                            |
| [structure/FOLDER_STRUCTURE.md](structure/FOLDER_STRUCTURE.md)             | §2 Repository layout all code must follow                                      |
| [architecture/API_VERSIONING.md](architecture/API_VERSIONING.md)           | §5 API versioning strategy (`/api/public`, `/api/v1`)                          |
| [architecture/AUTHENTICATION.md](architecture/AUTHENTICATION.md)           | §6 Authentication strategy (admin-only JWT)                                    |
| [architecture/AUTHORIZATION.md](architecture/AUTHORIZATION.md)             | §7 Authorization strategy (RBAC, public vs admin)                              |
| [architecture/ROUTES.md](architecture/ROUTES.md)                           | §8 Public vs private routes                                                    |
| [architecture/DATABASE_OWNERSHIP.md](architecture/DATABASE_OWNERSHIP.md)   | §9 Database ownership rules                                                    |
| [data/ERD.md](data/ERD.md)                                                 | Entity Relationship Diagram + table specs                                      |
| [api/OPENAPI.md](api/OPENAPI.md)                                           | API Contract (OpenAPI 3.1, both surfaces)                                      |
| [api/SEQUENCE_DIAGRAMS.md](api/SEQUENCE_DIAGRAMS.md)                       | Sequence diagrams (critical flows)                                             |
| [architecture/DEPLOYMENT.md](architecture/DEPLOYMENT.md)                   | Deployment diagram + environments                                              |
| [governance/ENGINEERING_STANDARDS.md](governance/ENGINEERING_STANDARDS.md) | §10 Development rules (binding)                                                |
| [governance/DEFINITION_OF_DONE.md](governance/DEFINITION_OF_DONE.md)       | When work is complete                                                          |
| [decisions/](decisions/)                                                   | Architecture Decision Records (0006–0011 active for Hub)                       |
| [domains/](domains/)                                                       | Per-domain deep dives (expand as modules land)                                 |
| [PROJECT_STATE.md](PROJECT_STATE.md)                                       | Baseline state & sprint log                                                    |

---

## How to use this docs set

1. **Before coding** — read SYSTEM_ARCHITECTURE, FOLDER_STRUCTURE, the relevant strategy doc, and the domain boundaries for your module.
2. **During design** — record non-trivial choices as ADRs under `decisions/`.
3. **During implementation** — keep structure and standards; update docs when scope changes.
4. **After delivery** — update PROJECT_STATE and domain docs.

---

## Change control

- Docs changes require Architect review for architecture, SRS, structure, and strategy docs.
- Feature PRs that change behavior **must** update the relevant docs in the same PR.
- ADRs are append-only: supersede, do not delete.
- The Hub baseline is **Proposed** until ADR-0011 is ratified. After ratification it freezes at v2.0.0. Breaking changes thereafter require a new ADR.

---

## Project identity

| Field                | Value                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| Product name         | MarineOps Hub                                                                         |
| Topology             | Two portals (Public no-login + Admin login) over one shared backend                   |
| Repo root            | `MarineOps/`                                                                          |
| Docs root            | `MarineOps/docs/`                                                                     |
| Archive              | `MarineOps/archive/enforcement/` · `MarineOps/archive/calendar/` (previous baselines) |
| Architecture version | 2.0.0 (Frozen — ADR-0011 ratified 2026-07-31)                                         |
