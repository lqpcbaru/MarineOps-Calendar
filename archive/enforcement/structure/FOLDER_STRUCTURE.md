# Folder Structure — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Status:** Binding for all engineers  

This is the **canonical repository layout**. Do not invent parallel top-level trees without an ADR and Architect approval.

---

## 1. Target monorepo layout

```
MarineOps/
├── docs/                          # Source of truth (this tree)
│   ├── README.md
│   ├── vision/
│   ├── requirements/
│   ├── architecture/
│   ├── structure/
│   ├── roadmap/
│   ├── governance/
│   ├── decisions/                 # ADRs
│   └── domains/                   # Per-module domain docs
│
├── apps/
│   ├── api/                       # Backend modular monolith
│   └── web/                       # Web client
│
├── packages/                      # Shared libraries (optional early)
│   ├── shared-kernel/             # Types, errors, auth principal contracts
│   ├── api-client/                # Generated or hand-written API client
│   └── ui/                        # Shared UI primitives (if needed)
│
├── modules/                       # OPTIONAL: if backend modules live outside apps/api
│   └── README.md                  # Prefer modules inside apps/api/src/modules
│
├── infrastructure/                # IaC, deploy manifests, compose
│   ├── docker/
│   ├── scripts/
│   └── environments/
│
├── tools/                         # Dev tooling, codegen, lint configs helpers
├── tests/                         # Cross-cutting e2e / contract tests (optional)
│   ├── e2e/
│   └── contract/
│
├── .github/                       # or equivalent CI config
│   └── workflows/
│
├── AGENTS.md                      # Engineer agent instructions (pointers to docs)
├── README.md                      # Project entry
├── LICENSE                        # When chosen
└── .env.example                   # No secrets; keys only
```

Until stack ADR is approved, `apps/`, `packages/`, etc. may be empty. **Docs exist first.**

---

## 2. Backend module layout (`apps/api`)

Preferred internal structure (adapt names to chosen language; keep **intent**):

```
apps/api/
├── src/
│   ├── main.*                     # Composition root / bootstrap
│   ├── config/
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── api/               # HTTP controllers/routes for this module
│   │   ├── fleet/
│   │   ├── work-management/
│   │   ├── compliance/
│   │   ├── files/
│   │   ├── audit/
│   │   ├── notifications/
│   │   └── reporting/
│   ├── shared-kernel/
│   └── platform/                  # middleware, logging, error mapping
├── migrations/                    # or per-module migrations — pick one via ADR
├── tests/
└── README.md
```

### 2.1 Layer rules inside a module

| Folder | Allowed |
|--------|---------|
| `domain/` | Entities, value objects, domain services, domain events — **no I/O** |
| `application/` | Use-cases, DTOs/commands, ports (interfaces) |
| `infrastructure/` | DB repos, external clients, implementing ports |
| `api/` | Transport mapping only |

**Forbidden:** `fleet/infrastructure` importing `work-management/domain` internals.  
**Allowed:** `work-management/application` depending on a **published port** from Fleet (e.g. `IVesselQuery`).

---

## 3. Frontend layout (`apps/web`)

```
apps/web/
├── src/
│   ├── app/                       # routes / app shell
│   ├── features/                  # feature folders aligned to domains
│   │   ├── auth/
│   │   ├── vessels/
│   │   ├── work-orders/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   └── audit/
│   ├── shared/                    # UI kit, hooks, utils
│   ├── api/                       # API access layer
│   └── styles/
├── public/
├── tests/
└── README.md
```

Features map to SRS areas; do not create a single `components/` dumping ground for business UI.

---

## 4. Documentation layout (always present)

```
docs/
├── README.md                      # Index
├── vision/PRODUCT_VISION.md
├── requirements/SRS.md
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md
│   └── DOMAIN_MODEL.md
├── structure/FOLDER_STRUCTURE.md  # This file
├── roadmap/ROADMAP.md
├── governance/
│   ├── ENGINEERING_STANDARDS.md
│   └── DEFINITION_OF_DONE.md
├── decisions/
│   ├── README.md
│   └── ADR-0001-record-architecture-decisions.md
└── domains/
    └── README.md                  # Index of domain deep-dives
```

---

## 5. Naming conventions

| Kind | Convention |
|------|------------|
| Folders | `kebab-case` |
| Domain module ids | match architecture names: `identity`, `fleet`, `work-management`, … |
| Docs files | `SCREAMING_SNAKE` or clear `Title_Case` markdown names as established |
| ADRs | `ADR-NNNN-short-kebab-title.md` |
| Env files | `.env.example` committed; `.env` never committed |

---

## 6. What must not be committed

- Secrets, keys, production dumps  
- `node_modules/`, build artifacts, local IDE state (use ignore files)  
- Personal notes outside `docs/` unless team agrees  

---

## 7. Creating a new module

1. Add/update SRS requirements.  
2. Add domain section under `docs/domains/<module>.md`.  
3. Create module folder with domain/application/infrastructure/api.  
4. Register in composition root.  
5. Expose only published ports to other modules.  
6. Add audit for state-changing use-cases.  

---

## 8. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial binding folder structure |