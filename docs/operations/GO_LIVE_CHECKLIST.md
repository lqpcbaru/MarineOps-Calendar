# Go-live checklist

Everything still standing between the merged codebase and a live
MarineOps, in dependency order. Each item says who can do it and what it
unblocks.

Status vocabulary, used consistently:

| Status                       | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **READY**                    | Done and verified in this repository. Nothing to do.                          |
| **CONFIG REQUIRED**          | The mechanism exists and is tested; a value has to be supplied.               |
| **EXTERNAL ACTION REQUIRED** | Needs an account, a domain, money, or a decision this repository cannot make. |
| **BLOCKED**                  | Waiting on something above it.                                                |

---

## 1. Code

| Item                                                   | Status    |
| ------------------------------------------------------ | --------- |
| API, both portals, audit, RBAC, provider error mapping | **READY** |
| Astronomy validated against PyEphem (worst 1.6 min)    | **READY** |
| Docker images build, smoke-test and publish on release | **READY** |
| Production compose, TLS overlay, backup timer units    | **READY** |
| 711 tests, lint, typecheck, build                      | **READY** |

No code work is outstanding. Everything below is configuration or
infrastructure.

`docker-compose.prod.yml` has now been **executed**, not just parsed:
the published-image stack was brought up against a PostgreSQL 16
stand-in, `prisma migrate deploy` and the seed were run from the image
itself, and all three containers reported healthy. Verified on that
running stack: both portals and `/api/public/stations` serve 200;
`/health/ready` returns 503 while `/health/live` stays 200 during a
database outage, and recovers without a restart; the API port is not
published to the host; the refresh cookie is issued
`HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`; refresh rotation,
replay rejection and token-family revocation all behave; an admin
mutation is audited without recording the password; oversized bodies are
refused with 413; no secret value appears in any log line. With a Caddy
hop in front and `TRUSTED_PROXY_HOPS=2`, two different client addresses
still get two independent rate-limit buckets and a forged
`X-Forwarded-For` is ignored. The database TLS caveat in §9 was found
during this run. What has **not** been exercised is Let's Encrypt
issuance, which needs a real domain (§3).

---

## 2. Hosting — EXTERNAL ACTION REQUIRED

Blocks everything after it.

- A Linux host with Docker, reachable from the internet.
- A **managed PostgreSQL 16** database. Deliberately not a container: it
  is the only state that matters, and it should not share a disk or a
  lifecycle with the stateless tier.
- Outbound HTTPS from the host to MET Malaysia, JUPEM and Global Fishing
  Watch.

Sizing is modest — the API is capped at 512 MB and the web tier at
128 MB in `docker-compose.prod.yml`, and both are stateless.

---

## 3. Domain and TLS — EXTERNAL ACTION REQUIRED

- A domain, with an A/AAAA record pointing at the host.
- Ports 80 and 443 reaching the host. Let's Encrypt validates over 80
  even though the site only serves 443.

**TLS is not optional.** The refresh cookie is issued with `Secure`
whenever `NODE_ENV` is not `development`, and browsers discard `Secure`
cookies delivered over plain HTTP. Without HTTPS the site loads and
sign-in appears to succeed, but the session never persists.

Once the domain exists, `docker-compose.tls.yml` obtains and renews the
certificate automatically. No certificate handling is required by hand.

---

## 4. Secrets — CONFIG REQUIRED

Copy `infrastructure/environments/production.env` to the host, fill it
in, `chmod 600`. Never commit it.

| Variable                      | Source              | Notes                                                         |
| ----------------------------- | ------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`                | Managed Postgres    | **Must include `?sslmode=require`** — encrypts, but see §9    |
| `JWT_ACCESS_SECRET`           | Generate            | `openssl rand -base64 48`                                     |
| `JWT_REFRESH_SECRET`          | Generate            | Generate separately — never reuse the access secret           |
| `APP_URL`                     | Your domain         | Must match the browser's origin exactly, including `https://` |
| `PUBLIC_DOMAIN`, `ACME_EMAIL` | Your domain         | TLS overlay only                                              |
| `MARINEOPS_TAG`               | A published release | Pin to `sha-<commit>` for rollbacks                           |

The API refuses to start without `DATABASE_URL`, `JWT_ACCESS_SECRET` or
`JWT_REFRESH_SECRET`, and compose aborts the deployment before any
container starts if one is missing — both verified.

Rotating either JWT secret invalidates every issued token, signing all
users out. That is the intended emergency response to a suspected leak.

---

## 5. First deploy — BLOCKED on 2–4

```bash
# migrations, from the same image about to run
docker run --rm -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/lqpcbaru/marineops-api:$MARINEOPS_TAG \
  ./node_modules/.bin/prisma migrate deploy

# seed — first deploy only, from a source checkout
NODE_ENV=production DATABASE_URL="$DATABASE_URL" \
  SEED_ADMIN_PASSWORD='<choose a strong one>' pnpm db:seed

MARINEOPS_TAG=$MARINEOPS_TAG docker compose \
  -f infrastructure/docker/docker-compose.prod.yml \
  -f infrastructure/docker/docker-compose.tls.yml \
  --env-file ./production.env up -d
```

**Change the seeded admin password on first sign-in.**
`SEED_ADMIN_PASSWORD` is chosen by whoever runs the seed and appears in
that shell's history.

Then verify:

```bash
curl -sf https://$PUBLIC_DOMAIN/health/live
curl -sf https://$PUBLIC_DOMAIN/health/ready      # 200 = database reachable
curl -sI https://$PUBLIC_DOMAIN/ | grep -i strict-transport-security
```

The startup log reports the effective configuration — cache backend,
CORS origin, trusted proxy hops, and which provider credentials are
present as booleans, never values. Check `trustedProxyHops` matches your
topology: 2 with the TLS overlay, 1 with the web container alone.

---

## 6. Provider data — CONFIG REQUIRED, needs external values

Sourced data needs **two** things per provider. A key alone does nothing.

| Provider             | Credential            | Per-station code     | Serves                  |
| -------------------- | --------------------- | -------------------- | ----------------------- |
| MET Malaysia         | `METMALAYSIA_API_KEY` | `config.marineArea`  | `/api/public/weather`   |
| JUPEM                | `JUPEM_API_KEY`       | `config.stationCode` | `/api/public/tide`      |
| Marine forecast      | —                     | `config.marineArea`  | `/api/public/wind-wave` |
| Global Fishing Watch | `GFW_API_TOKEN`       | —                    | `/api/public/vessels/*` |

Until both are supplied those endpoints return **503
`PROVIDER_CONFIG_ERROR`**. That is a supported state, not a fault:
`/stations`, `/moon`, `/sun`, `/calendar`, `/dashboard` and
`/recommendation` need no provider and serve normally, and both portals
show "Tidak Tersedia" rather than failing.

Codes are applied with the validated tooling, never hand-written SQL:

```bash
cp infrastructure/provider-mappings/example.json ./production-mappings.json
editor ./production-mappings.json                        # fill in real codes

MAPPINGS_FILE=./production-mappings.json pnpm db:mappings:plan   # dry run
MAPPINGS_FILE=./production-mappings.json pnpm db:mappings:apply
pnpm db:mappings:status
```

The tool writes the correct `config` key per data type and refuses
unknown or archived station codes, internal UUIDs, unedited placeholders
and duplicates. See `infrastructure/provider-mappings/README.md`.

> Provider codes are external data. Guessing one does not fail — it
> yields plausible forecasts for the wrong stretch of water.

---

## 7. Backups — CONFIG REQUIRED, then EXTERNAL ACTION REQUIRED

Install the timer (`infrastructure/systemd/README.md`), then:

- **Offsite copies — EXTERNAL ACTION REQUIRED.** The dumps sit on the
  application host. Losing the host loses both.
- **Rehearse a restore.** A dump nobody has restored is a hypothesis.
  The full cycle has now been run once: `db-backup.sh` inside the
  `postgres:16-alpine` image produced a dump, `pg_restore` loaded it into
  a fresh database, and every table matched the source row for row, with
  all three migrations and the admin credential intact. Do it once more
  against production-shaped data, on the real host.

---

## 8. Monitoring — CONFIG REQUIRED, then EXTERNAL ACTION REQUIRED

Two pieces now exist and need pointing at something:

- `infrastructure/scripts/health-check.sh` probes a deployment from
  outside and exits 0 healthy / 1 degraded / 2 down / 3 misconfigured,
  including certificate expiry. **Something still has to run it and act
  on the exit code** — ideally from a different host, since a check on
  the failed host cannot report that the host is gone.
- `marineops-alert@.service` fires on a failed backup and runs
  `/etc/marineops/alert.sh`. **As shipped it only writes to the
  journal** and logs a warning saying so; add your delivery command.

**No alert reaches a human until both are wired.** The application emits
everything a monitor needs — structured JSON logs, `/health/live`,
`/health/ready`, and distinct error codes per failure mode — and the two
scripts above turn that into severities and notifications. What is still
missing is a destination.

Minimum worth having, in order:

1. **`/health/ready` from outside the host.** Catches a dead API, a lost
   database and an expired certificate in one check.
2. **Alert on `INTERNAL_ERROR` and `DATABASE_UNAVAILABLE`.** These mean
   a bug and an outage respectively, and page different people.
3. **Do not alert on `PROVIDER_CONFIG_ERROR`.** It is the normal state
   until §6 is finished, and paging on it teaches everyone to ignore the
   channel.
4. **Certificate expiry.** Caddy renews automatically; alert if it
   stops, because it fails silently until the site breaks.
5. **Backup timer failures.** systemd records them; nothing reads that.

The failure-mode table in the runbook maps every status and code to who
should care. Alert on the **code**, not the status class — three
different conditions all return 503 and want three different responses.

---

## 9. Known limitations

- **No background refresh.** Provider data is fetched on demand and
  cached; `src/shared/scheduler` is unwired and nothing registers a
  cron. The cache is the only thing bounding provider traffic.
- **Single-host compose.** Fine for one node. Multiple API instances
  need a shared Redis rather than the container here, and a load
  balancer in front — at which point `TRUSTED_PROXY_HOPS` rises again.
- **Astronomy is a low-precision series**, accurate to a couple of
  minutes and bounded by tests. Good for operational planning; not for
  navigation.
- **The database connection is encrypted but not authenticated.**
  Prisma 6.19.3 ignores `sslmode=verify-full` and `sslrootcert`;
  measured against a TLS PostgreSQL with a self-signed certificate it
  accepted an unknown CA, a mismatched certificate name and an unrelated
  root CA, all of which `psql` refuses. `sslmode=require` genuinely
  encrypts — confirmed via `pg_stat_ssl` — so keep it, but rely on
  private networking and inbound rules restricted to the application
  host for protection against an impostor database, not on the URL
  parameter. Details in the runbook.
