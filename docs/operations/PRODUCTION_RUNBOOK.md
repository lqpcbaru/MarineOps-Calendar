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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Environment: development/test/staging/production |
| `PORT` | No | `3000` | API port |
| `APP_NAME` | No | `MarineOps` | Application name |
| `APP_URL` | No | `http://localhost:3000` | Public URL |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `REDIS_ENABLED` | No | `false` | Enable Redis cache |
| `JWT_ACCESS_SECRET` | Yes | — | HS256 signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token secret |
| `JWT_ACCESS_TTL_MINUTES` | No | `15` | Access token TTL |
| `JWT_REFRESH_TTL_DAYS` | No | `7` | Refresh token TTL |
| `LOG_LEVEL` | No | `info` | Log level (debug/info/warn/error) |
| `LOG_FORMAT` | No | `json` | Log format |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per minute |
| `METMALAYSIA_API_KEY` | No | — | MET Malaysia API key |
| `JUPEM_API_KEY` | No | — | JUPEM API key |

### Health Checks

```
GET /health/live  → {"status":"ok","uptime":3600,"version":"2.1.0"}
GET /health/ready → {"status":"ok","checks":{"database":"ok","cache":"ok","scheduler":"ok"}}
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
