# MarineOps Calendar

Marine operational planning platform — unified calendar with environmental data (tide, weather, wind, wave, sun/moon, Hijri) and patrol planning.

## Documentation (start here)

**All engineering follows `/docs`.** Architecture is frozen at v1.0.0.

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Documentation index |
| [Product vision](docs/vision/PRODUCT_VISION.md) | Why and for whom |
| [SRS](docs/requirements/SRS.md) | Requirements (17 modules) |
| [Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) | System design |
| [Domain Model](docs/architecture/DOMAIN_MODEL.md) | Aggregates, events, permissions |
| [Folder structure](docs/structure/FOLDER_STRUCTURE.md) | Repository layout |
| [Roadmap](docs/roadmap/ROADMAP.md) | Delivery phases |
| [Engineering standards](docs/governance/ENGINEERING_STANDARDS.md) | Binding rules |
| [PROJECT_STATE.md](docs/PROJECT_STATE.md) | Sprint completion certificates |

## Status

**Phase 1 — MVP: IN PROGRESS.** Sprint 1 (Platform Bootstrap) complete. Sprint 2 (Authentication) ready to start.

## Quick start

### Prerequisites

- Node.js 22 LTS
- pnpm 9+
- Docker Desktop (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
pnpm docker:up

# 3. Run database migrations
pnpm db:migrate:dev

# 4. Start development servers
pnpm dev:api     # API at http://localhost:3000
pnpm dev:web     # Web at http://localhost:5173
```

### Health check

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

### Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm dev:api` | Start API server only |
| `pnpm dev:web` | Start web dev server only |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm db:migrate:dev` | Create and apply Prisma migration |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm docker:up` | Start PostgreSQL container |
| `pnpm docker:down` | Stop PostgreSQL container |
| `pnpm format` | Format all files with Prettier |

## Previous project

The previous MarineOps Enforcement project is archived under `archive/enforcement/` as read-only historical reference (per PMD-0001).

## Roles

| Role | Responsibility |
|------|----------------|
| Chief Software Architect | Docs, architecture, SRS, roadmap, ADRs |
| Engineers | Implement per docs; update docs with behavior changes |

## License

TBD
