# §2 — Folder Structure: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Binding for all engineers

This is the **canonical repository layout** for MarineOps Hub. Do not invent parallel top-level trees without an ADR and Architect approval.

> Supersedes the MarineOps Calendar v1.0.0 folder structure for the active scope. Calendar version preserved at `archive/calendar/structure/FOLDER_STRUCTURE.md`.

---

## 1. Target monorepo layout

```
MarineOps/
├── archive/                        # Historical reference (read-only)
│   ├── enforcement/                # Archived MarineOps Enforcement docs
│   └── calendar/                   # Archived MarineOps Calendar v1.0.0 docs
│
├── docs/                           # Source of truth (this tree)
│   ├── README.md
│   ├── PROJECT_STATE.md
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md          # §1
│   │   ├── MODULE_DEPENDENCY.md            # §3 + §4
│   │   ├── API_VERSIONING.md               # §5
│   │   ├── AUTHENTICATION.md               # §6
│   │   ├── AUTHORIZATION.md                # §7
│   │   ├── ROUTES.md                       # §8
│   │   └── DATABASE_OWNERSHIP.md           # §9
│   ├── structure/
│   │   └── FOLDER_STRUCTURE.md             # §2 (this file)
│   ├── governance/
│   │   ├── ENGINEERING_STANDARDS.md        # §10 (binding)
│   │   └── DEFINITION_OF_DONE.md
│   ├── decisions/
│   │   ├── README.md
│   │   ├── ADR-0000-template.md
│   │   └── ADR-0006 … ADR-0011
│   └── domains/                            # Per-domain deep dives
│
├── apps/
│   ├── api/                        # Backend modular monolith (NestJS) — shared
│   ├── web-public/                 # Public Portal (React, no login)
│   └── web-admin/                  # Admin Portal (React, login required)
│
├── packages/                       # Shared libraries
│   ├── shared-kernel/              # Types, errors, auth principal contracts
│   ├── api-client/                 # Generated/typed API client (both portals)
│   └── ui/                         # Shared UI primitives
│
├── infrastructure/                 # IaC, deploy manifests, compose
│   ├── docker/
│   ├── scripts/
│   └── environments/
│
├── tools/                          # Dev tooling, codegen, lint configs
├── tests/                          # Cross-cutting e2e / contract tests
│   ├── e2e/
│   └── contract/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── README.md
└── .env.example
```

### 1.1 Key difference from Calendar v1.0.0

- `apps/web` (single SPA) → split into **`apps/web-public`** and **`apps/web-admin`**.
- Two API route prefixes inside one backend (`/api/public`, `/api/v1`) — see §2.2 below.
- Calendar v1.0.0 docs moved to `archive/calendar/`.

---

## 2. Backend module layout (`apps/api`)

```
apps/api/
├── src/
│   ├── main.ts                     # Composition root / bootstrap
│   ├── app.module.ts               # Wires public + admin module groups
│   ├── config/
│   ├── platform/                   # Cross-cutting: logging, prisma, error mapping, cron, guards
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   ├── logging.service.ts
│   │   ├── domain-exception.filter.ts
│   │   ├── health.controller.ts
│   │   └── guards/                 # JwtAuthGuard, PermissionsGuard, Public decorator
│   │
│   ├── modules/
│   │   ├── authentication/         # Admin login/JWT (§6)
│   │   ├── users/
│   │   ├── roles/
│   │   ├── dashboard/
│   │   ├── marine-calendar/        # Read projection — queried by BOTH surfaces
│   │   ├── calendar-admin/         # CRUD on calendar entries (admin only)
│   │   ├── stations/               # CRUD; exposes read port to public surface
│   │   ├── marine-alerts/          # CRUD + public read
│   │   ├── tide/
│   │   ├── marine-weather/
│   │   ├── wind/
│   │   ├── wave/
│   │   ├── moon-phase/
│   │   ├── sunrise-sunset/
│   │   ├── hijri-calendar/
│   │   ├── audit/
│   │   ├── settings/
│   │   └── about/                  # Static content config
│   │
│   ├── api/                        # HTTP entry points, split by audience
│   │   ├── public/                 # /api/public/* — @Public, read-only
│   │   │   ├── public-tide.controller.ts
│   │   │   ├── public-weather.controller.ts
│   │   │   ├── public-moon.controller.ts
│   │   │   ├── public-sun.controller.ts
│   │   │   ├── public-calendar.controller.ts
│   │   │   ├── public-alerts.controller.ts
│   │   │   ├── public-stations.controller.ts
│   │   │   └── public-about.controller.ts
│   │   └── admin/                  # /api/v1/* — JWT + RBAC
│   │       ├── auth.controller.ts
│   │       ├── users.controller.ts
│   │       ├── roles.controller.ts
│   │       ├── dashboard.controller.ts
│   │       ├── calendar.controller.ts
│   │       ├── stations.controller.ts
│   │       ├── alerts.controller.ts
│   │       ├── audit.controller.ts
│   │       └── settings.controller.ts
│   │
│   └── shared-kernel/              # Re-exports packages/shared-kernel
│
├── prisma/
│   └── schema.prisma
├── migrations/
├── tests/
└── README.md
```

### 2.1 Layer rules inside a module (unchanged from v1.0.0)

| Folder                        | Allowed                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `domain/`                     | Entities, value objects, domain services, domain events — **no I/O** |
| `application/`                | Use-cases, DTOs/commands, ports (interfaces)                         |
| `infrastructure/`             | DB repos, external API adapters, port implementations                |
| `api/` (module-local, if any) | Module-scoped controllers — but see §2.2                             |

### 2.2 The public/admin controller split

Controllers are **not** placed inside each module. Instead there are two top-level controller trees under `src/api/`:

- `src/api/public/` — every controller is mounted under `/api/public` and decorated `@Public()`. These controllers may **only** call read-side use-cases. A CI lint rule forbids importing any command/write use-case from a public controller.
- `src/api/admin/` — every controller is mounted under `/api/v1` and protected by the global `JwtAuthGuard` + per-route `@RequirePermissions(...)`. These controllers call the full command + query use-case set.

This physical separation enforces the security boundary at the file-system level, not just via decorators.

### 2.3 Sourced data module structure (Tide, MarineWeather, Wind, Wave)

Per ADR-0008 (retained):

```
modules/tide/
├── domain/
│   └── tide-data.ts                # Domain value object
├── application/
│   ├── ports/
│   │   ├── tide-provider.port.ts   # External fetch interface
│   │   └── tide-query.port.ts      # Public query interface (both surfaces call this)
│   ├── get-tide.use-case.ts
│   └── tide-cache.service.ts
├── infrastructure/
│   ├── noaa-tide-provider.ts       # External API adapter
│   └── prisma-tide-cache.repo.ts
```

No module-local `api/` folder — public/admin controllers live in `src/api/public/` and `src/api/admin/` and call the same `tide-query.port.ts`.

### 2.4 Computable module structure (MoonPhase, SunriseSunset, HijriCalendar)

Pure computation, no infrastructure, no tables:

```
modules/moon-phase/
├── domain/
│   └── moon-phase.calculator.ts    # Pure function: computeMoonPhase(date)
└── application/
    └── get-moon-phase.use-case.ts  # Thin wrapper, may cache in-memory
```

---

## 3. Public Portal layout (`apps/web-public`)

```
apps/web-public/
├── src/
│   ├── app/                        # Routes / app shell (NO auth provider)
│   ├── features/
│   │   ├── tide/
│   │   ├── weather/
│   │   ├── moon/
│   │   ├── sun/
│   │   ├── calendar/
│   │   ├── alerts/
│   │   ├── stations/
│   │   └── about/
│   ├── shared/                     # UI kit, hooks, utils
│   ├── api/                        # API access layer — /api/public ONLY
│   └── styles/
├── public/
├── tests/
└── README.md
```

### 3.1 Public Portal constraints

- The `api/` layer **may only** call `/api/public/*` endpoints. A build-time check / lint rule forbids references to `/api/v1`.
- No auth context, no token storage, no login screen.
- No admin-only UI components imported from `packages/ui` (the shared UI package tags admin-only exports).

---

## 4. Admin Portal layout (`apps/web-admin`)

```
apps/web-admin/
├── src/
│   ├── app/                        # Routes / app shell — auth-gated
│   │   ├── routes.tsx              # Route tree with auth guard
│   │   └── auth-context.tsx
│   ├── features/
│   │   ├── auth/                   # Login, session, token refresh
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── calendar/
│   │   ├── stations/
│   │   ├── alerts/
│   │   ├── audit/
│   │   └── settings/
│   ├── shared/                     # UI kit, hooks, utils
│   ├── api/                        # API access layer — /api/v1 ONLY (with Bearer token)
│   └── styles/
├── public/
├── tests/
└── README.md
```

### 4.1 Admin Portal constraints

- Every route except `/login` is wrapped in an auth guard that redirects to `/login` when no valid session exists.
- The `api/` layer attaches the in-memory access token as `Authorization: Bearer`. The refresh token lives in an httpOnly cookie set by the backend.
- RBAC-driven UI: actions are hidden when the principal lacks the permission, but the server is always authoritative (§7).

---

## 5. Shared packages

### 5.1 `packages/shared-kernel`

Cross-cutting primitives consumed by both portals and the backend:

- `DomainId`, `createId`
- `Result<T, E>`, `success`, `failure`
- `DomainError`, `NotFoundError`, `ValidationError`
- `AuthPrincipal` (admin context)
- `ErrorEnvelope`, `PaginatedResponse`, `FreshnessEnvelope`

### 5.2 `packages/api-client`

Typed API client split into two entry points:

- `public-client` — calls `/api/public/*`, no auth.
- `admin-client` — calls `/api/v1/*`, takes a token provider.

Both are generated/typed from the same backend DTO source so the portals cannot drift on shapes.

### 5.3 `packages/ui`

Shared presentational components (buttons, cards, tables, freshness badges, tide/moon visuals). Admin-only components (user management tables, audit viewer) are exported under a clearly tagged subpath and MUST NOT be imported by the Public Portal.

---

## 6. Documentation layout (always present)

```
docs/
├── README.md
├── PROJECT_STATE.md
├── architecture/   # §1, §3, §4, §5, §6, §7, §8, §9
├── structure/      # §2 (this file)
├── governance/     # §10 + DoD
├── decisions/      # ADRs 0006–0011
└── domains/        # Per-module deep dives
```

---

## 7. Naming conventions

| Kind               | Convention                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| Folders            | `kebab-case`                                                               |
| Domain module ids  | match architecture names: `authentication`, `users`, `stations`, `tide`, … |
| Public controllers | `public-<resource>.controller.ts` under `src/api/public/`                  |
| Admin controllers  | `<resource>.controller.ts` under `src/api/admin/`                          |
| Docs files         | `SCREAMING_SNAKE` or clear `Title_Case` markdown                           |
| ADRs               | `ADR-NNNN-short-kebab-title.md`                                            |
| Env files          | `.env.example` committed; `.env` never committed                           |
| Frontend features  | `kebab-case`, one folder per SRS feature area                              |

---

## 8. What must not be committed

- Secrets, API keys, production dumps.
- `node_modules/`, build artifacts, local IDE state.
- Personal notes outside `docs/` unless team agrees.
- Parallel top-level trees (e.g. `AI-Command-Center/`) without ADR + Architect approval.
- Admin-only code imported into `apps/web-public`.

---

## 9. Creating a new module

1. Add/update the relevant requirements (SRS section).
2. Add a domain section under `docs/domains/<module>.md`.
3. Create the module folder under `apps/api/src/modules/<module>/` with the appropriate layers (§2.1, §2.3, §2.4).
4. Add controller(s) under `src/api/public/` and/or `src/api/admin/` — never inside the module folder.
5. Register the module + controllers in the composition root.
6. Expose only published ports to other modules.
7. Add audit for state-changing admin use-cases.
8. If the module is future-scope (Patrol Planner, AIS, VMS, Vessel Monitoring), an ADR must be accepted first.

---

## 10. Change log

| Version | Date       | Notes                                                                         |
| ------- | ---------- | ----------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | MarineOps Hub layout — two web apps, public/admin controller split (ADR-0011) |
