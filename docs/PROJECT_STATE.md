# MarineOps Hub — Architecture Baseline (Frozen v2.0.0)

**Project:** MarineOps Hub  
**Date:** 2026-07-31  
**Author:** Lead Software Architect  
**Baseline status:** **FROZEN v2.0.0**  
**Authorised by:** ADR-0011 (Accepted 2026-07-31)

---

## Scope of this baseline

Establish the MarineOps Hub architecture and specification documentation: a **two-portal** platform (Public Portal no-login + Admin Portal login) over a **shared NestJS backend**, replacing the MarineOps Calendar v1.0.0 single-app baseline. Documentation only — no implementation in this baseline.

## Decisions

| Decision                                                         | Vehicle                        | Status   |
| ---------------------------------------------------------------- | ------------------------------ | -------- |
| Calendar v1.0.0 archived; Hub active                             | ADR-0011                       | Accepted |
| Two-portal topology over shared backend                          | ADR-0011 §4                    | Accepted |
| Dedicated public API surface (`/api/public`) + admin (`/api/v1`) | ADR-0011 §5, §5 API Versioning | Accepted |
| Authentication is admin-only (public has no auth)                | ADR-0011 §6, §6 Authentication | Accepted |
| ADR-0009 stack re-confirmed (no stack change)                    | ADR-0009                       | Retained |
| ADR-0010 JWT mechanics retained for admin surface                | ADR-0011 §6                    | Accepted |
| Governance carried forward unchanged                             | ADR-0011 §2                    | Retained |

## Deliverables (documentation only)

| File                                       | Section                                     | Status          |
| ------------------------------------------ | ------------------------------------------- | --------------- |
| `docs/README.md`                           | Hub index                                   | Done            |
| `docs/decisions/ADR-0011-...md`            | Direction change ADR                        | Done (Accepted) |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | §1 Overall Architecture                     | Done            |
| `docs/structure/FOLDER_STRUCTURE.md`       | §2 Folder Structure                         | Done            |
| `docs/architecture/MODULE_DEPENDENCY.md`   | §3 Module Dependency + §4 Domain Boundaries | Done            |
| `docs/architecture/API_VERSIONING.md`      | §5 API Versioning                           | Done            |
| `docs/architecture/AUTHENTICATION.md`      | §6 Authentication                           | Done            |
| `docs/architecture/AUTHORIZATION.md`       | §7 Authorization                            | Done            |
| `docs/architecture/ROUTES.md`              | §8 Public vs Private Routes                 | Done            |
| `docs/architecture/DATABASE_OWNERSHIP.md`  | §9 Database Ownership                       | Done            |
| `docs/governance/DEVELOPMENT_RULES.md`     | §10 Development Rules (Hub-specific)        | Done            |
| `docs/requirements/SRS.md`                 | Software Requirements Specification         | Done            |
| `docs/data/ERD.md`                         | Entity Relationship Diagram + table specs   | Done            |
| `docs/api/OPENAPI.md`                      | API Contract (OpenAPI 3.1)                  | Done            |
| `docs/api/SEQUENCE_DIAGRAMS.md`            | Sequence diagrams (critical flows)          | Done            |
| `docs/architecture/DEPLOYMENT.md`          | Deployment diagram + environments           | Done            |

## What was NOT produced (by design)

- No application code (documentation-only task).
- No archive move of `docs/` → `archive/calendar/` (mechanical step to run at implementation kickoff).
- No ADRs for future modules (Patrol Planner, AIS, VMS, Vessel Monitoring) — each gated by its own future ADR.

## Next steps (implementation kickoff)

1. Mechanically move current Calendar v1.0.0 `docs/` content into `archive/calendar/`.
2. Author the Hub SRS (module-level functional requirements) — included in this baseline.
3. Re-map any in-flight Calendar implementation work to Hub modules.
4. Begin Phase 1 implementation against the frozen Hub v2.0.0 baseline.

---

# Sprint 0 — Completion Certificate

**Project:** MarineOps Calendar  
**Date:** 2026-07-31  
**Author:** Chief Software Architect  
**Sprint status:** **COMPLETE**  
**Authorised by:** PMD-0001 (Project Direction Change)

---

## Scope

Establish a new Sprint 0 baseline for MarineOps Calendar per PMD-0001. Archive the previous MarineOps Enforcement project. Create all engineering documentation, architectural decisions, and repository skeleton so Phase 1 implementation can begin with zero ambiguity.

---

## Deliverables

### Documentation (18 files in `docs/`)

| File                                                         | Status                                   |
| ------------------------------------------------------------ | ---------------------------------------- |
| `docs/README.md`                                             | Done — new index for Calendar            |
| `docs/vision/PRODUCT_VISION.md`                              | Done — new vision (v1.0.0)               |
| `docs/requirements/SRS.md`                                   | Done — new SRS, 17 modules (v1.0.0)      |
| `docs/architecture/SYSTEM_ARCHITECTURE.md`                   | Done — new architecture (v1.0.0)         |
| `docs/architecture/DOMAIN_MODEL.md`                          | Done — new domain model (v1.0.0)         |
| `docs/structure/FOLDER_STRUCTURE.md`                         | Done — new layout (v1.0.0)               |
| `docs/roadmap/ROADMAP.md`                                    | Done — new roadmap (v1.0.0)              |
| `docs/governance/ENGINEERING_STANDARDS.md`                   | Done — carried forward unchanged         |
| `docs/governance/DEFINITION_OF_DONE.md`                      | Done — carried forward unchanged         |
| `docs/domains/README.md`                                     | Done — new index for 17 Calendar modules |
| `docs/decisions/README.md`                                   | Done — new ADR index                     |
| `docs/decisions/ADR-0000-template.md`                        | Done — carried forward                   |
| `docs/decisions/ADR-0006-project-direction-change.md`        | Done — PMD-0001 recorded                 |
| `docs/decisions/ADR-0007-modular-monolith-for-calendar.md`   | Done                                     |
| `docs/decisions/ADR-0008-calendar-data-source-strategy.md`   | Done — external data adapter pattern     |
| `docs/decisions/ADR-0009-technology-stack-reconfirmation.md` | Done — stack re-confirmed                |
| `docs/decisions/ADR-0010-authentication-jwt-strategy.md`     | Done — JWT + refresh rotation            |
| `docs/PROJECT_STATE.md`                                      | Done — this file                         |

### Archive

| Path                   | Status                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `archive/enforcement/` | Done — previous MarineOps Enforcement docs preserved unmodified |

### Architecture Decisions (5 new ADRs)

| ADR  | Decision                                   | Impact                                           |
| ---- | ------------------------------------------ | ------------------------------------------------ |
| 0006 | Project direction change (PMD-0001)        | Authorises new baseline; archives Enforcement    |
| 0007 | Modular monolith for Calendar              | Architecture style                               |
| 0008 | External data source strategy              | Adapter pattern + caching + stale fallback       |
| 0009 | Technology stack re-confirmation           | NestJS/Prisma/PostgreSQL/React/Tailwind/JWT/pnpm |
| 0010 | Authentication — JWT with refresh rotation | Security architecture                            |

---

## Phase 0 exit criteria — verified

| Criterion                                               | Status |
| ------------------------------------------------------- | ------ |
| Product vision complete                                 | Met    |
| SRS complete (17 modules, P0/P1/P2 + NFRs)              | Met    |
| System architecture complete (layers, modules, flows)   | Met    |
| Domain model complete (aggregates, events, permissions) | Met    |
| Folder structure complete (binding layout)              | Met    |
| Engineering standards & DoD carried forward             | Met    |
| ADRs complete (5 new: 0006–0010)                        | Met    |
| Stack re-confirmed (ADR-0009)                           | Met    |
| Data source strategy defined (ADR-0008)                 | Met    |
| Auth strategy defined (ADR-0010)                        | Met    |
| Previous project archived (PMD-0001)                    | Met    |
| Architecture frozen at v1.0.0                           | Met    |

---

## Architecture freeze status

| Artifact              | Version | State                                |
| --------------------- | ------- | ------------------------------------ |
| Product vision        | 1.0.0   | Baseline (frozen)                    |
| SRS                   | 1.0.0   | Baseline (frozen)                    |
| System architecture   | 1.0.0   | Baseline (frozen)                    |
| Domain model          | 1.0.0   | Baseline (frozen)                    |
| Folder structure      | 1.0.0   | Binding (frozen)                     |
| Engineering standards | 0.1.0   | Binding (carried forward, unchanged) |
| Definition of Done    | 0.1.0   | Binding (carried forward, unchanged) |

**Freeze declaration:** Architecture, domain model, SRS, and folder structure are **frozen at v1.0.0**. Breaking changes require a new ADR and Architect review per governance.

---

## Module list (17 modules — frozen)

| #   | Module          | Type                   | Phase |
| --- | --------------- | ---------------------- | ----- |
| 1   | Authentication  | Internal               | 1     |
| 2   | Users           | Internal               | 1     |
| 3   | Stations        | Internal               | 1     |
| 4   | Marine Calendar | Read projection        | 1     |
| 5   | Tide            | Sourced (external API) | 1     |
| 6   | Moon Phase      | Computable (local)     | 1     |
| 7   | Hijri Calendar  | Computable (local)     | 1     |
| 8   | Weather         | Sourced (external API) | 1     |
| 9   | Wind            | Sourced (external API) | 1     |
| 10  | Wave            | Sourced (external API) | 1     |
| 11  | Sunrise/Sunset  | Computable (local)     | 1     |
| 12  | Dashboard       | Read projection        | 1     |
| 13  | Patrol Planner  | Internal               | 1     |
| 14  | Notifications   | Internal               | 2     |
| 15  | Reports         | Read projection        | 2     |
| 16  | Settings        | Internal               | 1     |
| 17  | Audit           | Internal               | 1     |

**Out of scope (per PMD-0001):** AIS, VMS, Vessel Tracking, Live Tracking, Geofence, Heatmap.

---

# Sprint 1 — Platform Bootstrap Completion Certificate

**Date:** 2026-07-31  
**Author:** Lead Backend Engineer  
**Sprint status:** **COMPLETE**  
**Scope:** Platform bootstrap only — no business modules, no application logic.

---

## Deliverables

### Repository scaffolding

| Item                                                      | Status |
| --------------------------------------------------------- | ------ |
| pnpm workspace configuration                              | Done   |
| Root `package.json` with workspace scripts                | Done   |
| `apps/api` — NestJS project scaffold                      | Done   |
| `apps/web` — React + Vite + TypeScript scaffold           | Done   |
| `packages/shared-kernel` — Shared types/errors/primitives | Done   |
| `packages/api-client` — Placeholder directory             | Done   |
| `packages/ui` — Placeholder directory                     | Done   |

### Configuration & tooling

| Item                                          | Status |
| --------------------------------------------- | ------ |
| ESLint (flat config)                          | Done   |
| Prettier                                      | Done   |
| Husky + lint-staged                           | Done   |
| TypeScript base config (`tsconfig.base.json`) | Done   |
| Environment files (`.env`, `.env.example`)    | Done   |
| `.gitignore`                                  | Done   |

### API foundation (`apps/api`)

| Item                                                          | Status |
| ------------------------------------------------------------- | ------ |
| NestJS bootstrap (`main.ts`, `app.module.ts`)                 | Done   |
| Configuration module (`src/config/`)                          | Done   |
| Logging service (`src/platform/logging.service.ts`)           | Done   |
| Health endpoints (`/health/live`, `/health/ready`)            | Done   |
| Shared kernel (`src/shared-kernel/index.ts`)                  | Done   |
| Prisma schema (initial `AuditLog` table)                      | Done   |
| Prisma seed file placeholder                                  | Done   |
| Module directories (17 Calendar modules with layer structure) | Done   |
| `vitest.config.ts` + `vitest.e2e.config.ts`                   | Done   |

### Web foundation (`apps/web`)

| Item                                 | Status |
| ------------------------------------ | ------ |
| Vite + React + TypeScript scaffold   | Done   |
| Tailwind CSS v4 configuration        | Done   |
| TanStack Router + Query dependencies | Done   |
| App shell (`App.tsx`)                | Done   |
| Feature directory placeholders       | Done   |
| `vitest.config.ts`                   | Done   |

### Infrastructure

| Item                                     | Status                         |
| ---------------------------------------- | ------------------------------ |
| Docker Compose — PostgreSQL 16           | Done                           |
| Environment configs (dev/staging/prod)   | Done                           |
| DB bootstrap script                      | Done                           |
| CI workflow (`.github/workflows/ci.yml`) | Existing — verified compatible |

---

## What was NOT implemented (by design)

- Authentication (JWT, login, refresh) — Sprint 2
- Users module — Sprint 2
- Stations module — Sprint 2
- All 17 business modules — future Sprints
- Application logic, use-cases, controllers beyond health
- Mock data, sample APIs
- E2E tests, contract tests

---

## Verification checklist

- [x] `pnpm install` succeeds
- [x] `pnpm lint` passes (no source files to lint yet)
- [x] `pnpm typecheck` passes
- [x] `docker compose up` starts PostgreSQL
- [x] `pnpm db:migrate:dev` creates initial migration
- [x] `pnpm dev:api` starts NestJS on port 3000
- [x] `GET /health/live` returns `{"status":"ok"}`
- [x] `GET /health/ready` returns `{"status":"ok"}`
- [x] `pnpm dev:web` starts Vite on port 5173
- [x] Folder structure matches `docs/structure/FOLDER_STRUCTURE.md`
- [x] No business logic, no mock data, no sample APIs

---

## Handoff to Sprint 2 (Authentication)

Sprint 2 should implement per ADR-0010:

- JWT access tokens (15-min TTL, `Authorization: Bearer`)
- Refresh token rotation (7-day TTL, httpOnly cookie)
- Logout (clear cookie + blocklist)
- Argon2id password hashing
- RBAC at application layer
- `refresh_token` table in Prisma schema

### Key handoff files

| Read first                                                           | Why                      |
| -------------------------------------------------------------------- | ------------------------ |
| `docs/decisions/ADR-0010-authentication-jwt-strategy.md`             | Auth implementation spec |
| `docs/architecture/DOMAIN_MODEL.md` §7 (Authentication aggregate)    | Auth domain model        |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` §6.4 (Authorization flow) | Auth runtime flow        |
| `docs/requirements/SRS.md` FR-AUTH-*                                 | Auth requirements        |
| `apps/api/src/config/configuration.ts`                               | Config keys available    |
| `apps/api/src/shared-kernel/index.ts`                                | Shared types to use      |

---

Sprint 1 is complete. Architecture remains frozen at v1.0.0. Sprint 2 is cleared to begin.
