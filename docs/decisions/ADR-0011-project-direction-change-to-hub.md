# ADR-0011: Project direction change — MarineOps Calendar archived, MarineOps Hub active

**Date:** 2026-07-31  
**Status:** Accepted  
**Deciders:** Chief Software Architect (ratified 2026-07-31)  
**Supersedes (for active scope):** ADR-0006 (project direction change to Calendar), ADR-0007 (modular monolith for Calendar), ADR-0008 (Calendar data source strategy), ADR-0010 (Calendar authentication strategy). These remain valid historical reference for the Calendar baseline and are preserved unmodified under `archive/calendar/`.

## Context

The MarineOps Calendar baseline (frozen v1.0.0, 2026-07-31) described a single marine operational planning application in which **every operational user authenticated** against a unified SPA, and Patrol Planner was the Phase 1 core. AIS, VMS, Vessel Tracking, Live Tracking, Geofence, and Heatmap were declared out of scope per PMD-0001.

Stakeholder direction has shifted again. The product is now **MarineOps Hub** — a modern marine information platform with **two distinct front-ends sharing one backend**:

1. **Public Portal** — no login. Tide, Marine Weather, Moon Phase, Sunrise/Sunset, Marine Calendar, Marine Alerts, Stations, About. Anyone can access.
2. **Admin Portal** — login required. Restricted to administrators and fisheries officers. Dashboard, User Management, Role & Permission, Calendar CRUD, Station CRUD, Alerts CRUD, Audit Log, Settings. Future: Patrol Planner, AIS, VMS, Vessel Monitoring.

This is a structural change to the product topology (one app → two portals over a shared backend), the authentication audience (all users → admins/officers only), and the module roadmap (Patrol Planner demoted to future; AIS/VMS/Vessel Monitoring explicitly re-introduced as future scope). It is not a technology change.

## Decision

1. **Archive** the MarineOps Calendar v1.0.0 documentation under `archive/calendar/` — unmodified, read-only, historical reference. The existing `docs/` tree is rebuilt as the active MarineOps Hub documentation.
2. **Carry forward unchanged:** `ENGINEERING_STANDARDS.md`, `DEFINITION_OF_DONE.md`, the ADR process, and governance rules. Process survives scope changes.
3. **Re-confirm the technology stack** (ADR-0009): NestJS, PostgreSQL, Prisma, JWT, React, Vite, TypeScript, Tailwind, pnpm. Clean Architecture + DDD remain the design philosophy. No stack change.
4. **Adopt the two-portal topology:** one backend (NestJS modular monolith) serving two independent front-ends (`apps/web-public`, `apps/web-admin`). See §1 Overall Architecture.
5. **Split the API surface:**
   - `/api/public` — versioned read-only surface for the Public Portal. No authentication. Explicit public capability.
   - `/api/v1` — versioned admin surface for the Admin Portal. JWT required on every route except login.
     See §5 API Versioning Strategy.
6. **Authentication is admin-only.** The Public Portal never authenticates and never receives a JWT. The Admin Portal uses JWT access + refresh rotation (ADR-0010 mechanics retained) restricted to admin/officer roles. See §6 Authentication Strategy.
7. **Authorization is split by audience:** anonymous callers receive only the `public.read` capability against `/api/public`; admin callers carry role-based permission codes against `/api/v1`. UI hiding is never the sole control. See §7 Authorization Strategy.
8. **Module list — active (Hub):**
   - Public-facing: Tide, Marine Weather, Moon Phase, Sunrise/Sunset, Marine Calendar, Marine Alerts, Stations (read), About (static).
   - Admin-facing: Authentication, Users, Roles & Permissions, Dashboard, Calendar (CRUD), Stations (CRUD), Alerts (CRUD), Audit, Settings.
9. **Module list — future (Hub):** Patrol Planner, AIS, VMS, Vessel Monitoring. Each requires its own ADR before implementation begins.
10. **Database ownership rules retained** (per-module tables, FK-by-ID across modules, no cross-module joins as default). The `users`, `roles`, `permissions` tables remain owned by the Users module and read by Authentication. See §9.
11. **Issue a new PROJECT_STATE entry** — done; Hub baseline frozen at v2.0.0.
12. This ADR supersedes the active scope of ADR-0006, ADR-0007, ADR-0008, and ADR-0010. It does **not** supersede ADR-0009 (stack) or the governance documents.

## Consequences

### Positive

- Clear separation of public vs administrative concerns; the Public Portal can scale and change independently of admin workflows.
- Public Portal carries zero auth complexity (no login, no token storage, no XSS token surface).
- Admin Portal remains a hardened, authenticated surface with a small trusted audience.
- Future operational modules (Patrol Planner, AIS, VMS) slot into the admin surface without disturbing the public read surface.
- Backend stays a single deployable (modular monolith); no operational overhead from splitting services.

### Negative / trade-offs

- Two front-end codebases to maintain (mitigated by a shared `packages/ui` + `packages/shared-kernel`).
- A read model duplication concern: some public data (e.g. station list, calendar) is also administered via the admin surface. We accept read-through from the same tables rather than duplicating stores, with strict ownership rules (§9).
- Re-introducing AIS/VMS (previously out of scope) reopens integration complexity; deferred to future ADRs.
- Archiving the Calendar baseline invalidates any in-flight Calendar-specific implementation work; must be re-mapped to Hub modules.

## Alternatives considered

| Option                                                 | Why not                                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extend the frozen Calendar docs in place               | Creates contradictions (single-app vs two-portal) inside a "frozen" tree; violates docs-first governance                                          |
| Single SPA with public + admin areas behind one router | Couples public release cadence to admin auth changes; larger XSS/attack surface for the public app                                                |
| BFF per portal (two backend-for-frontends)             | Premature distribution; the modular monolith already separates public vs admin API surfaces cleanly                                               |
| Public Portal reuses `/api/v1` with anonymous role     | Blurs the public/admin boundary and risks accidental exposure of admin-adjacent endpoints; a dedicated `/api/public` surface is safer and clearer |

## References

- PMD-0002 (Project Management Directive — MarineOps Hub direction) — pending ratification alongside this ADR
- `archive/calendar/` (to be created — archived MarineOps Calendar v1.0.0 documentation)
- ADR-0009 (technology stack — re-confirmed, not superseded)
- ADR-0010 (JWT mechanics — retained for the Admin Portal; superseded only for the public-scope narrative)
- `docs/governance/ENGINEERING_STANDARDS.md` (unchanged)
- `docs/governance/DEFINITION_OF_DONE.md` (unchanged)
