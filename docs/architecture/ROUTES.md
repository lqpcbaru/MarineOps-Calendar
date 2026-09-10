# §8 — Public vs Private Routes: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Authorised by:** ADR-0011

This document is the **canonical route table** for both portals (frontend) and both API surfaces (backend). New routes must be added here in the same change they are introduced (DoD §4).

---

## 1. Frontend routes

### 1.1 Public Portal (`apps/web-public`) — NO auth guard

| Path        | Feature          | Notes                               |
| ----------- | ---------------- | ----------------------------------- |
| `/`         | Home / landing   | Redirects to `/calendar` or `/tide` |
| `/tide`     | Tide             | Station + date selector             |
| `/weather`  | Marine Weather   |                                     |
| `/moon`     | Moon Phase       |                                     |
| `/sun`      | Sunrise / Sunset |                                     |
| `/calendar` | Marine Calendar  | Unified view (day/week/month)       |
| `/alerts`   | Marine Alerts    | Public, published alerts only       |
| `/stations` | Stations         | Public station list + detail        |
| `/about`    | About            | Static content                      |
| `*`         | 404              |                                     |

- **No `/login` route. No auth context. No token storage.**
- Build-time lint rule forbids importing `/api/v1` into any `apps/web-public` source file.

### 1.2 Admin Portal (`apps/web-admin`) — auth-gated

| Path         | Feature                        | Auth                                | Permission                                       |
| ------------ | ------------------------------ | ----------------------------------- | ------------------------------------------------ |
| `/login`     | Login                          | Public (only unauthenticated route) | —                                                |
| `/`          | Redirect to `/dashboard`       | Required                            | `dashboard.read`                                 |
| `/dashboard` | Dashboard                      | Required                            | `dashboard.read`                                 |
| `/users`     | User Management                | Required                            | `user.manage`                                    |
| `/roles`     | Role & Permission              | Required                            | `role.manage`                                    |
| `/calendar`  | Calendar CRUD                  | Required                            | `calendar.read` (view) / `calendar.write` (edit) |
| `/stations`  | Station CRUD                   | Required                            | `station.read` / `station.write`                 |
| `/alerts`    | Alerts CRUD                    | Required                            | `alert.read` / `alert.write`                     |
| `/audit`     | Audit Log                      | Required                            | `audit.read`                                     |
| `/settings`  | Settings                       | Required                            | `settings.read` / `settings.write`               |
| `*`          | 404 / redirect to `/dashboard` | Required                            | —                                                |

### 1.3 Admin Portal auth guard

- A top-level route guard checks for an in-memory access token.
- No token → redirect to `/login`.
- Token present → attach `Authorization: Bearer` to all `/api/v1` calls.
- On 401 from any `/api/v1` call, the client attempts one silent refresh (`POST /api/v1/auth/refresh` using the httpOnly cookie); on failure, redirect to `/login`.
- RBAC-driven UI: routes/actions whose permission the principal lacks are hidden, but server authorization remains authoritative (§7).

---

## 2. Backend routes

> **These tables are the v2.0.0 target, not the current surface.** The
> changelog at the foot of this page has said so since 2.0.1, which is
> easy to miss when the tables themselves read as a description of what
> exists. Verified against the running API, the following rows are **NOT
> IMPLEMENTED** and return 404:
>
> - Public: `/api/public/wind`, `/api/public/wave` (superseded by
>   `/api/public/wind-wave`), `/api/public/hijri`, `/api/public/alerts`,
>   `/api/public/about`
> - Admin: `/api/v1/dashboard`, `/api/v1/calendar`, `/api/v1/alerts`,
>   `/api/v1/settings`, and all four `/api/v1/<x>/refresh` endpoints
>
> Everything else in both tables is implemented and covered by tests. The
> `/api/v1/<x>/refresh` rows in particular describe an admin-triggered
> provider refresh that does not exist in any form — see DEPLOYMENT.md §1
> on the absence of scheduled refresh generally.

### 2.1 Public API surface — `/api/public` (no auth, read-only)

| Method | Path                   | Module         | Returns                       |
| ------ | ---------------------- | -------------- | ----------------------------- |
| GET    | `/api/public/tide`     | Tide           | Tide data + freshness         |
| GET    | `/api/public/weather`  | MarineWeather  | Weather + freshness           |
| GET    | `/api/public/wind`     | Wind           | Wind + freshness              |
| GET    | `/api/public/wave`     | Wave           | Wave + freshness              |
| GET    | `/api/public/moon`     | MoonPhase      | Moon phase (computed)         |
| GET    | `/api/public/sun`      | SunriseSunset  | Sunrise/sunset (computed)     |
| GET    | `/api/public/hijri`    | HijriCalendar  | Hijri date (computed)         |
| GET    | `/api/public/calendar` | MarineCalendar | Unified calendar projection   |
| GET    | `/api/public/alerts`   | MarineAlerts   | Published, non-expired alerts |
| GET    | `/api/public/stations` | Stations       | Public station list/detail    |
| GET    | `/api/public/about`    | About          | Static content                |

**Implemented but not originally in this table** (added per DoD §4 — these exist in `apps/api/src/api/public/` today):

| Method | Path                                   | Module              | Returns                                                                                            |
| ------ | -------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/api/public/wind-wave`                | WindWave            | Combined wind + wave data + freshness — shipped instead of the separate `/wind`/`/wave` rows above |
| GET    | `/api/public/vessels/search`           | Vessel Intelligence | GFW-derived vessel search (see [VESSEL_INTELLIGENCE_API](../api/VESSEL_INTELLIGENCE_API.md))       |
| GET    | `/api/public/vessels/:vesselId`        | Vessel Intelligence | Vessel profile                                                                                     |
| GET    | `/api/public/vessels/:vesselId/events` | Vessel Intelligence | Vessel event history                                                                               |
| GET    | `/api/public/recommendation`           | Recommendation      | Operational recommendation for a station/date                                                      |

**Rules:**

- All public controllers live under `src/api/public/` and are `@Public()`.
- All public endpoints are **GET** only. No POST/PUT/PATCH/DELETE on `/api/public`.
- Public responses are a strict DTO subset (no PII, no admin fields).
- Edge-cacheable with `Cache-Control: public`.

### 2.2 Admin API surface — `/api/v1` (JWT + RBAC)

| Method                | Path                      | Module         | Permission                                 |
| --------------------- | ------------------------- | -------------- | ------------------------------------------ |
| POST                  | `/api/v1/auth/login`      | Authentication | Public (login)                             |
| POST                  | `/api/v1/auth/refresh`    | Authentication | Public (refresh cookie)                    |
| POST                  | `/api/v1/auth/logout`     | Authentication | Authenticated                              |
| GET                   | `/api/v1/auth/me`         | Authentication | Authenticated                              |
| GET                   | `/api/v1/dashboard`       | Dashboard      | `dashboard.read`                           |
| GET/POST/PATCH        | `/api/v1/users`           | Users          | `user.manage`                              |
| GET/POST/PATCH        | `/api/v1/roles`           | Roles          | `role.manage`                              |
| GET/POST/PATCH/DELETE | `/api/v1/calendar`        | CalendarAdmin  | `calendar.read` / `calendar.write`         |
| GET/POST/PATCH        | `/api/v1/stations`        | Stations       | `station.read` / `station.write`           |
| GET/POST/PATCH/DELETE | `/api/v1/alerts`          | MarineAlerts   | `alert.read` / `alert.write`               |
| GET                   | `/api/v1/audit`           | Audit          | `audit.read`                               |
| GET/POST/PATCH        | `/api/v1/settings`        | Settings       | `settings.read` / `settings.write`         |
| POST                  | `/api/v1/tide/refresh`    | Tide           | `settings.write` (admin-triggered refresh) |
| POST                  | `/api/v1/weather/refresh` | MarineWeather  | `settings.write`                           |
| POST                  | `/api/v1/wind/refresh`    | Wind           | `settings.write`                           |
| POST                  | `/api/v1/wave/refresh`    | Wave           | `settings.write`                           |

**Rules:**

- All admin controllers live under `src/api/admin/`.
- Global `JwtAuthGuard` protects everything not `@Public()`.
- `PermissionsGuard` enforces `@RequirePermissions(...)` per route — this is
  currently the **only** enforcement layer. `AuthorizeUseCase`
  (`requireAll`/`requireAny`) exists, is unit-tested, and is registered in
  `AuthenticationModule`, but as of 2026-08-27 no write use-case actually
  calls it — none currently accept an `AuthPrincipal` parameter to check
  against. Route-level guarding is applied consistently across every admin
  controller (verified directly, and covered by
  `tests/e2e/auth-and-admin-guards.e2e-spec.ts`), so this isn't an open
  vulnerability today, but it means there's no second layer if a future
  controller ships without the right `@RequirePermissions()`. Wiring
  `AuthorizeUseCase` into the write use-cases is a real, well-scoped future
  change (each use-case's `execute()` would need an `AuthPrincipal` param
  and its controller call-site updated to pass `@CurrentPrincipal()`) —
  not done here to avoid a speculative cross-cutting refactor across ~10
  files with no corresponding controller-side driver.

### 2.3 Platform routes (root, not prefixed)

| Method | Path            | Auth | Purpose   |
| ------ | --------------- | ---- | --------- |
| GET    | `/health/live`  | None | Liveness  |
| GET    | `/health/ready` | None | Readiness |

---

## 3. Gating summary

```
                        ┌──────────────────────────────────────────────┐
                        │              HTTP request arrives            │
                        └──────────────────────┬───────────────────────┘
                                               ▼
                          ┌────────────────────────────────────┐
                          │  Path starts with /api/public ?    │
                          │  or /health ?                      │
                          └──────┬───────────────────┬─────────┘
                                 │ Yes               │ No
                                 ▼                   ▼
                       ┌─────────────────┐   ┌──────────────────────┐
                       │ Public surface  │   │ Admin surface /api/v1│
                       │ - @Public       │   │ - JwtAuthGuard       │
                       │ - GET only      │   │ - PermissionsGuard   │
                       │ - read use-case │   │ - AuthorizeUseCase   │
                       │ - public DTO    │   │ - admin DTO          │
                       └─────────────────┘   └──────────────────────┘
```

---

## 4. Open questions

- **Station-scoped roles**: should a fisheries officer be restricted to their assigned stations only? Deferred to a future ADR; v2.0.0 is organization-wide.
- **Audit on public reads**: should anonymous public reads be audited? Likely no (volume), but admin-triggered refreshes on `/api/v1/<x>/refresh` should be audited.
- **API key for partners**: if third parties want to embed public data, do we issue API keys for `/api/public` rate-limit buckets? Future decision.

---

## 5. Change log

| Version | Date       | Notes                                                                                                                                                                                                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Hub route table — public vs admin split (ADR-0011)                                                                                                                                                                                                         |
| 2.0.1   | 2026-08-27 | Added `/api/public/wind-wave`, `/api/public/vessels/*`, `/api/public/recommendation` — implemented in prior sprints but never added here (DoD §4 catch-up). No routes removed; the rest of this table remains the v2.0.0 target, most of it still unbuilt. |
| 2.0.2   | 2026-08-27 | Corrected the admin-surface rules: `AuthorizeUseCase` is implemented but not currently called by any write use-case — `PermissionsGuard` is the sole enforcement layer today, verified directly against the code.                                          |
