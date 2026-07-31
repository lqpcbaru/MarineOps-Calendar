# apps/api

Backend modular monolith. NestJS + TypeScript + Prisma + PostgreSQL.

## Structure

```
src/
├── main.ts                    # Composition root / bootstrap
├── config/                    # Configuration loading
├── modules/
│   ├── authentication/        # Login, JWT, refresh rotation
│   ├── users/                 # Users, roles, permissions
│   ├── stations/              # Station CRUD, status, archive
│   ├── marine-calendar/       # Unified calendar read projection
│   ├── tide/                  # Tide data (sourced)
│   ├── moon-phase/            # Moon phase computation (computable)
│   ├── hijri-calendar/        # Hijri calendar conversion (computable)
│   ├── weather/               # Weather data (sourced)
│   ├── wind/                  # Wind data (sourced)
│   ├── wave/                  # Wave data (sourced)
│   ├── sunrise-sunset/        # Sunrise/sunset computation (computable)
│   ├── dashboard/             # Operational summary
│   ├── patrol-planner/        # Patrol plan CRUD, lifecycle
│   ├── notifications/         # In-app/email dispatch
│   ├── reports/               # Report generation, export
│   ├── settings/              # Org config, provider config
│   └── audit/                 # Append-only audit stream
├── shared-kernel/             # IDs, errors, auth context, time
└── platform/                  # Middleware, logging, error mapping
```

## Layer rules (per module)

| Folder | Purpose |
|--------|---------|
| `domain/` | Entities, value objects, domain services, domain events — **no I/O** |
| `application/` | Use-cases, DTOs/commands, ports (interfaces) |
| `infrastructure/` | DB repos, external clients, port implementations |
| `api/` | HTTP controllers/routes, request/response mapping |

See `docs/structure/FOLDER_STRUCTURE.md` for full rules.
