# Folder Structure — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Status:** Binding for all engineers  

This is the **canonical repository layout**. Do not invent parallel top-level trees without an ADR and Architect approval.

---

## 1. Target monorepo layout

```
MarineOps/
├── archive/                        # Historical reference (read-only)
│   └── enforcement/                # Archived MarineOps Enforcement docs
│
├── docs/                           # Source of truth (this tree)
│   ├── README.md
│   ├── vision/
│   ├── requirements/
│   ├── architecture/
│   ├── structure/
│   ├── roadmap/
│   ├── governance/
│   ├── decisions/
│   └── domains/
│
├── apps/
│   ├── api/                        # Backend modular monolith (NestJS)
│   └── web/                        # Web client (React)
│
├── packages/                       # Shared libraries
│   ├── shared-kernel/              # Types, errors, auth principal contracts
│   ├── api-client/                 # Generated or hand-written API client
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
├── LICENSE                         # When chosen
└── .env.example
```

---

## 2. Backend module layout (`apps/api`)

```
apps/api/
├── src/
│   ├── main.ts                     # Composition root / bootstrap
│   ├── config/
│   ├── modules/
│   │   ├── authentication/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── api/
│   │   ├── users/
│   │   ├── stations/
│   │   ├── marine-calendar/
│   │   ├── tide/
│   │   ├── moon-phase/
│   │   ├── hijri-calendar/
│   │   ├── weather/
│   │   ├── wind/
│   │   ├── wave/
│   │   ├── sunrise-sunset/
│   │   ├── dashboard/
│   │   ├── patrol-planner/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── audit/
│   ├── shared-kernel/
│   └── platform/                   # middleware, logging, error mapping, cron config
├── prisma/
│   └── schema.prisma
├── migrations/                     # Prisma migrations
├── tests/
└── README.md
```

### 2.1 Layer rules inside a module

| Folder | Allowed |
|--------|---------|
| `domain/` | Entities, value objects, domain services, domain events — **no I/O** |
| `application/` | Use-cases, DTOs/commands, ports (interfaces) |
| `infrastructure/` | DB repos, external API adapters, port implementations |
| `api/` | HTTP controllers/routes, request/response mapping |

### 2.2 Sourced data module structure (Tide, Weather, Wind, Wave)

Per ADR-0008, each sourced data module must additionally have:

```
modules/tide/
├── domain/
│   └── tide-data.ts                # Domain value object
├── application/
│   ├── ports/
│   │   ├── tide-provider.port.ts   # External fetch interface
│   │   └── tide-query.port.ts      # Public query interface (other modules call this)
│   ├── get-tide.use-case.ts
│   └── tide-cache.service.ts
├── infrastructure/
│   ├── noaa-tide-provider.ts       # External API adapter
│   └── prisma-tide-cache.repo.ts   # Cache repository
└── api/
    └── tide.controller.ts
```

### 2.3 Computable module structure (MoonPhase, SunriseSunset, HijriCalendar)

These modules have **no infrastructure layer** — they are pure computation:

```
modules/moon-phase/
├── domain/
│   └── moon-phase.calculator.ts    # Pure function: computeMoonPhase(date)
├── application/
│   └── get-moon-phase.use-case.ts  # Thin wrapper, may cache in-memory
└── api/
    └── moon-phase.controller.ts
```

No `infrastructure/` folder. No DB table. No external API call.

---

## 3. Frontend layout (`apps/web`)

```
apps/web/
├── src/
│   ├── app/                        # Routes / app shell
│   ├── features/                   # Feature folders aligned to modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── patrol-planner/
│   │   ├── stations/
│   │   ├── tide/
│   │   ├── weather/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── admin/
│   ├── shared/                     # UI kit, hooks, utils
│   ├── api/                        # API access layer
│   └── styles/
├── public/
├── tests/
└── README.md
```

Features map to SRS module areas; do not create a single `components/` dumping ground.

---

## 4. Documentation layout (always present)

```
docs/
├── README.md
├── vision/PRODUCT_VISION.md
├── requirements/SRS.md
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md
│   └── DOMAIN_MODEL.md
├── structure/FOLDER_STRUCTURE.md
├── roadmap/ROADMAP.md
├── governance/
│   ├── ENGINEERING_STANDARDS.md
│   └── DEFINITION_OF_DONE.md
├── decisions/
│   ├── README.md
│   ├── ADR-0000-template.md
│   └── ADR-0006 through ADR-0010
├── domains/
│   └── README.md
└── PROJECT_STATE.md
```

---

## 5. Naming conventions

| Kind | Convention |
|------|------------|
| Folders | `kebab-case` |
| Domain module ids | match architecture names: `authentication`, `users`, `stations`, `tide`, … |
| Docs files | `SCREAMING_SNAKE` or clear `Title_Case` markdown |
| ADRs | `ADR-NNNN-short-kebab-title.md` |
| Env files | `.env.example` committed; `.env` never committed |

---

## 6. What must not be committed

- Secrets, API keys, production dumps  
- `node_modules/`, build artifacts, local IDE state  
- Personal notes outside `docs/` unless team agrees  
- Parallel top-level trees (e.g. `AI-Command-Center/`) without ADR + Architect approval  

---

## 7. Creating a new module

1. Add/update SRS requirements.  
2. Add domain section under `docs/domains/<module>.md`.  
3. Create module folder with appropriate layers (see §2.1–2.3).  
4. Register in composition root.  
5. Expose only published ports to other modules.  
6. Add audit for state-changing use-cases.  

---

## 8. Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-31 | Initial folder structure for MarineOps Calendar |