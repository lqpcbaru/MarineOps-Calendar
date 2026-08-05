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
- `PermissionsGuard` enforces `@RequirePermissions(...)` per route.
- `AuthorizeUseCase` re-checks inside the use-case (authoritative).

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

| Version | Date       | Notes                                              |
| ------- | ---------- | -------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Hub route table — public vs admin split (ADR-0011) |
