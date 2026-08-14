# MarineOps Hub — Production Runbook

**Version:** 2.1.0  
**Date:** 2026-08-07

---

## Deployment

### Docker Compose (Quick Start)

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Services:

- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379)
- MarineOps API (port 3000)

### Environment Variables

| Variable                 | Required   | Default                  | Description                                       |
| ------------------------ | ---------- | ------------------------ | ------------------------------------------------- |
| `NODE_ENV`               | Yes        | `production`             | Environment: development/test/staging/production  |
| `PORT`                   | No         | `3000`                   | API port                                          |
| `APP_NAME`               | No         | `MarineOps`              | Application name                                  |
| `APP_URL`                | Yes (prod) | —                        | Public web origin used for CORS (see below)       |
| `DATABASE_URL`           | Yes        | —                        | PostgreSQL connection string                      |
| `REDIS_URL`              | No         | `redis://localhost:6379` | Redis connection string                           |
| `REDIS_ENABLED`          | No         | `false`                  | Enable Redis cache                                |
| `JWT_ACCESS_SECRET`      | Yes        | —                        | HS256 signing secret (min 32 chars)               |
| `JWT_REFRESH_SECRET`     | Yes        | —                        | Refresh token secret                              |
| `JWT_ACCESS_TTL_MINUTES` | No         | `15`                     | Access token TTL                                  |
| `JWT_REFRESH_TTL_DAYS`   | No         | `7`                      | Refresh token TTL                                 |
| `LOG_LEVEL`              | No         | `info`                   | Log level (debug/info/warn/error)                 |
| `LOG_FORMAT`             | No         | `json`                   | Log format                                        |
| `RATE_LIMIT_MAX`         | No         | `100`                    | Max requests per minute                           |
| `METMALAYSIA_API_KEY`    | No         | —                        | MET Malaysia API key (server-side only)           |
| `GFW_API_TOKEN`          | No         | —                        | Global Fishing Watch API token (server-side only) |
| `JUPEM_API_KEY`          | No         | —                        | JUPEM API key                                     |

> **Secret handling:** All secrets (`JWT_*`, `DATABASE_URL`, `GFW_API_TOKEN`, `METMALAYSIA_API_KEY`) must be supplied through the deployment secret manager / environment. Never commit real secrets to the repository. No default production credentials exist.

> **CORS / `APP_URL`:** `APP_URL` is the authoritative CORS origin. In `NODE_ENV=production` the API **fails to start** if `APP_URL` is unset (it will not silently fall back to a development origin). In development, a `localhost` fallback is permitted.

### Build & Start (API)

```bash
# 1. Generate Prisma client
pnpm --filter @marineops/api exec prisma generate

# 2. Build
pnpm --filter @marineops/api build

# 3. Apply migrations
pnpm db:migrate

# 4. Start in production
node apps/api/dist/main.js
```

### Frontend / API Deployment

The public web portal (`apps/web-public`) is a static SPA. In production:

```
Browser → web host / reverse proxy → /api → NestJS API
```

- Build the static site: `pnpm --filter @marineops/web-public build` (output: `apps/web-public/dist`).
- Serve `dist/` as static content.
- The browser calls **relative `/api` paths**; the reverse proxy must route `/api/*` to the API server (same origin or a proxied path). No `VITE_API_URL` is used in production builds.
- Set the API `APP_URL` to the public web origin for CORS.

### Health Checks

```
GET /health/live  → {"status":"ok","uptime":3600,"version":"2.1.0"}
GET /health/ready → {"status":"ok","checks":{"database":"ok"}}   (503 with {"status":"error","checks":{"database":"error"}} if DB is unreachable)
```

### Database Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
psql $DATABASE_URL < backup_20260807.sql
pnpm run db:migrate
```

### Release Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Lint clean (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Database migrated (`pnpm db:migrate`)
- [ ] Seed data applied (`pnpm db:seed`)
- [ ] Docker image builds
- [ ] Health endpoints respond
- [ ] API responds on `/api/public/dashboard`
- [ ] No secrets in logs
- [ ] Rate limiting active
- [ ] Graceful shutdown working
