# MarineOps Hub — Production Runbook

**Version:** 2.2.0  
**Date:** 2026-08-28

> Every command, path and default in this document has been checked against
> the repository. Where a documented procedure does **not** work (image-based
> seeding) or has **not** been executed (`nginx -t`, a live Redis run), that
> is stated explicitly rather than implied to work.

---

## Deployment

### Docker Compose (Quick Start)

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Services:

- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379) — started, but the API is configured with
  `REDIS_ENABLED: 'false'`, so it caches in-process and does not connect.
  Set `REDIS_ENABLED=true` to exercise the Redis path.
- MarineOps API (port 3000)

> This compose file is **local development only** — it says so at the top of
> the file, and it publishes Postgres/Redis on host ports with no
> authentication in front of them. Do not use it as a production topology;
> use the published image plus `infrastructure/docker/nginx.conf`.

### Environment Variables

This table is cross-checked against every `process.env` read in the code.
"Default" is the value the **code** falls back to, not what a template file
happens to set.

| Variable                 | Required            | Code default             | Description                                                              |
| ------------------------ | ------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `NODE_ENV`               | **Yes** (see below) | `development`            | `development` \| `test` \| `staging` \| `production`                     |
| `PORT`                   | No                  | `3000`                   | API port                                                                 |
| `APP_NAME`               | No                  | `MarineOps`              | Application name                                                         |
| `APP_URL`                | Yes (prod)          | —                        | Public web origin used for CORS (see below)                              |
| `DATABASE_URL`           | Yes                 | —                        | PostgreSQL connection string. Absent ⇒ **fails at startup**              |
| `REDIS_URL`              | No                  | `redis://localhost:6379` | Only read when `REDIS_ENABLED=true`                                      |
| `REDIS_ENABLED`          | No                  | `false`                  | `true` ⇒ shared Redis cache; otherwise per-process in-memory             |
| `JWT_ACCESS_SECRET`      | Yes                 | —                        | HS256 signing secret. Absent ⇒ **fails at startup**                      |
| `JWT_REFRESH_SECRET`     | Yes                 | —                        | Refresh token secret. Absent ⇒ **fails at startup**                      |
| `JWT_ACCESS_TTL_MINUTES` | No                  | `15`                     | Access token TTL                                                         |
| `JWT_REFRESH_TTL_DAYS`   | No                  | `7`                      | Refresh token TTL                                                        |
| `LOG_LEVEL`              | No                  | `info`                   | Log level (debug/info/warn/error)                                        |
| `LOG_FORMAT`             | No                  | `json`                   | Log format                                                               |
| `RATE_LIMIT_MAX`         | No                  | `100`                    | Max requests per minute (general API)                                    |
| `LOGIN_RATE_LIMIT_MAX`   | No                  | `10`                     | Max `POST /api/v1/auth/login` attempts per IP per 15 min                 |
| `SEED_ADMIN_PASSWORD`    | Yes (to seed)       | dev-only fallback        | `pnpm db:seed` **refuses to run** without it when `NODE_ENV≠development` |
| `METMALAYSIA_API_KEY`    | Per feature         | —                        | Weather **and** wind/wave. Absent ⇒ those endpoints error per request    |
| `JUPEM_API_KEY`          | Per feature         | —                        | Tide. Absent ⇒ tide endpoints error per request                          |
| `GFW_API_TOKEN`          | Per feature         | —                        | Vessels/AIS. Absent ⇒ vessel endpoints error per request                 |
| `GFW_API_BASE_URL`       | No                  | GFW production gateway   | Override only to target a non-default GFW environment                    |

> **`S3_*` variables are NOT implemented.** `.env.example` still lists them
> because object storage appears in the DEPLOYMENT.md topology as planned
> capability, but no application code reads any `S3_*` variable. Do not
> provision a bucket or credentials for this release.

> **`NODE_ENV` — read this.** The code defaults it to `development`, **not**
> `production`. An API started without it boots successfully but issues the
> refresh cookie **without the `Secure` flag** and silently falls back to a
> `http://localhost:5173` CORS origin — an insecure deployment that looks
> healthy. The Dockerfile sets `NODE_ENV=production` so image-based deploys
> are safe by default; a bare `node dist/main.js` deploy is not. Since
> `a6b75fe` the API logs its effective configuration and warns explicitly on
> startup when it detects this state — check the first lines of the log
> after any deploy.

> **Secret handling:** All secrets (`JWT_*`, `DATABASE_URL`, `SEED_ADMIN_PASSWORD`, `GFW_API_TOKEN`, `METMALAYSIA_API_KEY`, `JUPEM_API_KEY`) must be supplied through the deployment secret manager / environment. Never commit real secrets to the repository. No default production credentials exist. Note the code does **not** enforce a minimum secret length — generate at least 32 random bytes yourself.

> **CORS / `APP_URL`:** `APP_URL` is the authoritative CORS origin. In `NODE_ENV=production` the API **fails to start** if `APP_URL` is unset (it will not silently fall back to a development origin). Note this check keys on `production` exactly — `NODE_ENV=staging` does **not** enforce it, so set `APP_URL` explicitly in staging or CORS will point at localhost.

### Deploying the published images (recommended)

Publishing a GitHub **release** runs the `docker` CI job, which builds **two**
images, smoke-tests both, and only then pushes to GHCR:

| Image           | Contents                                                 |
| --------------- | -------------------------------------------------------- |
| `marineops-api` | NestJS API + Prisma CLI + migrations                     |
| `marineops-web` | Public portal, Admin portal, and the nginx reverse proxy |

The smoke tests run before any push, so a container that fails to start,
cannot reach the database, or serves a broken `/admin` route is never
published. Both images are tagged identically so a rollback moves them
together.

> **Startup ordering matters.** nginx resolves the `api` upstream hostname
> when it starts and **refuses to start if it cannot be resolved**. The API
> service must therefore exist before the web container starts (compose
> `depends_on`, or an orchestrator that creates the Service before the Pod).
> It does not need to be _ready_ — nginx retries the upstream per request —
> only resolvable.

Three tags are published per release:

| Tag                  | Use                                       |
| -------------------- | ----------------------------------------- |
| `<release-tag>`      | Human-facing, e.g. `v1.0.0`               |
| `sha-<short-commit>` | **Immutable — pin rollbacks to this**     |
| `latest`             | Moving pointer to the most recent release |

```bash
# Image reference (owner is lowercased — GHCR rejects uppercase paths)
IMAGE=ghcr.io/lqpcbaru/marineops-api:v1.0.0

docker pull "$IMAGE"

# 1. Apply migrations USING THE SAME IMAGE you are about to run.
#    The image ships both the migration files and the Prisma CLI, so the
#    schema can never drift from the code in this tag.
docker run --rm -e DATABASE_URL="$DATABASE_URL" "$IMAGE" \
  ./node_modules/.bin/prisma migrate deploy

# 2. Seed — FIRST DEPLOY ONLY. NOT runnable from the image; see Seeding below.

# 3. Run the API (must be resolvable as `api` to the web container)
docker network create marineops 2>/dev/null || true
docker run -d --name api --network marineops \
  --env-file ./production.env "$IMAGE"

# 4. Run the web tier. It terminates nothing itself — put TLS in front of
#    port 80, or terminate at your load balancer (DEPLOYMENT.md §2).
docker run -d --name marineops-web --network marineops -p 80:80 \
  ghcr.io/lqpcbaru/marineops-web:v1.0.0
```

> Run migrations from the **image**, not from a source checkout. Migrating
> from a checkout of `main` while running a pinned older image tag puts the
> schema ahead of the code that reads it.

### Seeding (first deploy only)

**`prisma db seed` cannot run from the published image.** The seed is
declared as `tsx prisma/seed.ts` and `tsx` is a devDependency, so it is
stripped from the production build. Verified by inspecting the output of
`pnpm --filter @marineops/api deploy --prod` — `prisma/seed.ts` is present,
`node_modules/tsx` is not.

This is deliberate rather than an oversight: seeding is a one-time
bootstrap that sets the initial admin password, which is a hands-on
operation, and shipping a TypeScript transpiler into the runtime image
permanently — to run a script executed once — is a poor trade. Seed from a
source checkout at the **same git tag as the deployed image**:

```bash
git checkout v1.0.0            # match the deployed image tag
pnpm install --frozen-lockfile
pnpm --filter @marineops/api exec prisma generate

NODE_ENV=production \
DATABASE_URL="$DATABASE_URL" \
SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  pnpm db:seed
```

The seed is idempotent (every write is an `upsert`) and refuses to run
without `SEED_ADMIN_PASSWORD` when `NODE_ENV≠development`. It creates the
`Admin`/`FisheriesOfficer`/`Auditor` roles, the `admin@marineops.local`
user, 16 operation regions, 21 stations, and their provider-mapping rows.

> If image-based seeding is ever required, the fix is to compile
> `prisma/seed.ts` to JavaScript during the build and point the
> `prisma.seed` script at the compiled output — not to add `tsx` to
> production dependencies.

**What a re-run does and does not touch:**

| Data                                  | On re-run                                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| `Admin` role `permissionCodes`        | **Overwritten** — hand-edited permissions on that role revert |
| `FisheriesOfficer` / `Auditor` roles  | Untouched after creation                                      |
| `admin@marineops.local` user          | Untouched — the admin password is **not** reset               |
| Regions & stations (name, coords, tz) | **Refreshed** from the seed — hand edits to these revert      |
| Station provider mappings             | Untouched — operator-configured external codes are preserved  |

### Build & Start from source (alternative)

Use only when deploying without containers. Note step 0 — the code defaults
`NODE_ENV` to `development`, which is not a safe production default.

```bash
export NODE_ENV=production   # 0. REQUIRED — see the NODE_ENV note above

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
- **SPA fallback is required.** This is a client-side-routed single-page app —
  `apps/web-public/dist` contains one `index.html` plus hashed assets under
  `/assets/`; every route (`/cuaca`, `/stesen`, etc.) is resolved by
  TanStack Router in the browser, not by separate files on disk. The static
  host/reverse proxy **must** serve `index.html` for any request path that
  doesn't match a real file, or a direct page load / refresh / bookmark on
  any route other than `/` will 404 at the server before React ever runs
  (clicking links from `/` works regardless, since that's client-side
  navigation — this only breaks fresh loads of a deep path). Verified
  locally with `vite preview` (which has this fallback built in); confirm
  the actual production host has the equivalent configured — e.g. nginx
  `try_files $uri /index.html;`, or the SPA-fallback/rewrite option most
  static hosts (Netlify, Vercel, S3+CloudFront, etc.) expose under a
  different name.

> **A ready-made config implementing all of the above ships in the repo:**
> `infrastructure/docker/nginx.conf` (+ `marineops_proxy_headers.conf`).
> It covers SPA fallback, the DEPLOYMENT.md §2 routing table, immutable
> caching for `/assets/` with `no-cache` on `index.html`, and the
> `X-Forwarded-For` headers the rate limiters depend on. It has **not**
> been validated with `nginx -t` (no nginx/Docker available in the
> authoring environment) — run that once before first use. If you deploy
> on a managed static host instead, mirror its behaviour rather than
> ignoring it.

### Admin Portal (`apps/web-admin`)

The Admin Portal is a **second, independent SPA** served from the same origin
at `/admin/`, per DEPLOYMENT.md §2. Same origin is a requirement, not a
convenience: the refresh token is an httpOnly cookie scoped to
`path=/api/v1/auth`, so the browser only sends it when the portal and the API
share an origin.

**You normally do not build this by hand.** A release publishes a
`marineops-web` image containing both portals plus the nginx config
(`infrastructure/docker/Dockerfile.web`) — see "Deploying the published
images" above. Building bundles manually is only needed for a static host
that is not running that container:

```bash
pnpm --filter @marineops/web-public build   # output: apps/web-public/dist
pnpm --filter @marineops/web-admin build    # output: apps/web-admin/dist
```

Both bundles share one document root, with the admin bundle **underneath**
it so the URI path and the filesystem path line up. nginx.conf serves it via
the inherited `root`, deliberately not `alias` (combining `alias` with
`try_files` misresolves the SPA fallback):

| Bundle                 | Served at | Filesystem path                |
| ---------------------- | --------- | ------------------------------ |
| `apps/web-public/dist` | `/`       | `/usr/share/nginx/html/`       |
| `apps/web-admin/dist`  | `/admin/` | `/usr/share/nginx/html/admin/` |

> **Three things must agree** or the portal breaks in ways that are easy to
> misdiagnose: `base: '/admin/'` in `apps/web-admin/vite.config.ts`, the
> router's `basepath: '/admin'`, and the `/admin/` location block in
> `infrastructure/docker/nginx.conf`. Change one, change all three. A
> mismatch shows up as assets 404ing under `/admin/assets/`, or a deep link
> resolving against the **public** SPA instead of the admin one.

Admin documents are served `Cache-Control: no-store` (they are per-user);
only the content-hashed `/admin/assets/` are cached immutably.

**Routes** (ROUTES.md §1.2): `/admin/login`, `/admin/dashboard`,
`/admin/users`, `/admin/roles`, `/admin/stations`, `/admin/audit`.
`/calendar`, `/alerts` and `/settings` from that table are **not built** —
no corresponding admin controller exists in the API, so those screens would
have nothing to call.

**Access:** an operator needs a role holding the relevant permission codes.
The seeded `Admin` role holds all of them; `FisheriesOfficer` lacks
`user.manage` and `role.manage` and will see a 403 page on those routes,
which is correct — the server rejects those requests regardless of the UI.

### External provider configuration (required for sourced data)

Weather, tide and wind/wave endpoints need **two** things. An API key alone
is not sufficient.

| Requirement                    | Where                                   | Supplied by           |
| ------------------------------ | --------------------------------------- | --------------------- |
| API credential                 | `METMALAYSIA_API_KEY` / `JUPEM_API_KEY` | Secret manager        |
| Per-station external area code | `station_provider_mappings` row         | Operator, per station |

The seed creates one mapping row per station per data type with
`providerStationId = NULL`, `config = NULL` and **`isActive = false`** —
scaffolding, not working configuration. Until real codes are supplied:

- `/api/public/weather`, `/tide`, `/wind-wave` return a provider error.
- `/api/public/moon`, `/sun`, `/stations` work normally (computed locally
  or served from the database).
- The API starts, stays healthy, and `/health/ready` passes. Absence of
  provider data is **not** a startup failure.

To activate a station, set the external code and flip `isActive`:

| Data type | Field the provider reads                                 |
| --------- | -------------------------------------------------------- |
| `weather` | `config.marineArea` (falls back to `providerStationId`)  |
| `wind`    | `config.marineArea` (falls back to `providerStationId`)  |
| `tide`    | `config.stationCode` (falls back to `providerStationId`) |

The providers **refuse** to fall back to the internal station UUID: an
active mapping with no real code fails loudly rather than sending a
meaningless identifier to the upstream API.

> These codes are external data. They are **not** in this repository and
> must not be guessed — an incorrect area code yields plausible-looking
> weather for the wrong location.

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

### Rollback

Prisma's `migrate deploy` is forward-only — it does not generate or apply
down-migrations. Plan releases accordingly:

**Application rollback (no schema change involved):**

1. Redeploy the previous known-good image from GHCR. **Pin the immutable
   `sha-<short-commit>` tag, not `latest`** — `latest` moves with every
   release and a release tag can in principle be re-pushed:

   ```bash
   docker pull ghcr.io/lqpcbaru/marineops-api:sha-1a2b3c4
   ```

2. No database action needed if the previous release's schema is still
   compatible with the current database (true whenever the bad release
   didn't ship a migration).

**Rollback involving a bad migration:**

1. Stop routing traffic to the new release (or scale it to zero) first —
   don't leave the old and new API versions both writing against a schema
   only one of them understands.
2. Restore the database from the pre-deploy backup (`pg_dump` above,
   taken _before_ applying migrations for the release), then redeploy
   the previous API image (`sha-` tag). This loses any writes made between
   the backup and the rollback — acceptable for the rollback window, not
   for routine operation.
3. There is no automated "undo" for an already-applied migration; treat
   forward migrations as effectively permanent once deployed to a shared
   environment, and prefer additive/backward-compatible schema changes
   (add columns nullable/with defaults, avoid renaming/dropping columns
   still read by the previous release) to make rollback-without-DB-restore
   possible whenever feasible.
4. Verify with `GET /health/ready` and a smoke check against
   `/api/public/dashboard` before restoring traffic.

### Release Checklist

CI (`.github/workflows/ci.yml`) already enforces lint, typecheck, unit
tests, e2e tests and the build on every push, and on a **release** it also
builds the image, smoke-tests that it starts and reaches the database, and
only then publishes to GHCR. The items below are what CI cannot check.

**Before the release**

- [ ] Previous release's `sha-` image tag recorded and reachable for rollback
- [ ] Database backed up (`pg_dump`) — taken **before** migrating
- [ ] Migration reviewed for backward compatibility (additive preferred; see Rollback)

**Deploy**

- [ ] `NODE_ENV=production` set in the target environment (**not** defaulted — see the NODE_ENV note)
- [ ] `APP_URL` set to the real public web origin (CORS)
- [ ] `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` supplied from the secret manager
- [ ] Migrations applied **from the deployed image tag** (`prisma migrate deploy`)
- [ ] First deploy only: `SEED_ADMIN_PASSWORD` set and seed run from a checkout at the same tag
- [ ] Reverse proxy serves SPA fallback and forwards `X-Forwarded-For`

**Verify after deploy**

- [ ] Startup log shows the expected effective config — `nodeEnv: production`, `secureCookies: true`, correct `corsOrigin`, and no startup warnings
- [ ] `GET /health/live` and `GET /health/ready` both 200
- [ ] `GET /api/public/dashboard` responds
- [ ] A deep link (e.g. `/stesen`) loads on **hard refresh**, not just via in-app navigation
- [ ] `/admin/` loads the Admin Portal (not the public portal) and its assets resolve under `/admin/assets/`
- [ ] Admin login works and sets the `mops_rt` cookie with `Secure` + `HttpOnly`
- [ ] An admin deep link (e.g. `/admin/stations`) survives a hard refresh — proves the session is restored from the refresh cookie, since the access token is memory-only by design
- [ ] A role lacking a permission (e.g. `FisheriesOfficer` on `/admin/users`) sees the 403 page, and the API independently returns 403 for the same request
- [ ] Rate limiting keys on the **client** IP, not the proxy's (hit the login limit from one client and confirm others are unaffected)
- [ ] No secrets in logs
- [ ] Graceful shutdown working (`SIGTERM` drains rather than killing in-flight requests)
- [ ] Sourced-data endpoints: either configured and returning data, or knowingly left disabled (see External provider configuration)
