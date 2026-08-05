# §5 — API Versioning Strategy: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Proposed baseline  
**Authorised by:** ADR-0011

---

## 1. Two API surfaces, both versioned

MarineOps Hub exposes **two independent HTTP surfaces** from one backend. Both are versioned, but they version **independently** because their audiences and stability contracts differ.

| Surface | Prefix        | Audience                           | Auth       | Stability contract                        |
| ------- | ------------- | ---------------------------------- | ---------- | ----------------------------------------- |
| Public  | `/api/public` | Anonymous browsers (Public Portal) | None       | Long-lived; changes are rare and additive |
| Admin   | `/api/v1`     | Admin Portal (admins + officers)   | JWT + RBAC | Iterative; changes more often             |

### 1.1 Why version them independently

- The **public surface** is a de-facto public API consumed by our own Public Portal but also potentially by partner sites/embeds. Breaking changes carry external cost. It must be extremely stable.
- The **admin surface** is an internal API consumed only by our Admin Portal. It can evolve at sprint cadence; breaking changes only need to coordinate with our own frontend release.
- Coupling their version numbers would force the public surface to bump on admin-only changes — undesirable.

---

## 2. URL prefix versioning

Both surfaces use **URL prefix versioning**. It is the simplest, most cache-friendly, and most explicit option for a browser-consumed REST API.

- `/api/public` — the public surface. Currently unversioned beyond the `public` prefix; if it ever needs a second incompatible shape, a `/api/public/v2` prefix will be introduced. The first shape is treated as `v1` implicitly.
- `/api/v1` — the admin surface. The `v1` segment is explicit from day one because admin changes are expected to be more frequent.

### 2.1 What lives under each prefix

```
/api/public
├── /tide
├── /weather
├── /wind
├── /wave
├── /moon
├── /sun
├── /hijri
├── /calendar
├── /alerts
├── /stations
└── /about

/api/v1
├── /auth          (login, refresh, logout, me)
├── /users
├── /roles
├── /dashboard
├── /calendar      (CRUD — admin writes)
├── /stations      (CRUD — admin writes)
├── /alerts        (CRUD — admin writes)
├── /audit
├── /settings
└── /tide|weather|wind|wave   (refresh/config endpoints only — NOT data read)
```

> Note: data _reads_ for tide/weather/wind/wave are served to both surfaces via the **same** module query port, but the public surface exposes them under `/api/public/<x>` and the admin surface exposes refresh/config under `/api/v1/<x>`. The admin portal reads data via `/api/public/<x>` too when it needs the read shape — there is no `/api/v1/<x>` data-read endpoint to avoid duplication.

### 2.2 Health endpoints

`/health/live` and `/health/ready` live at the **root** (not under either prefix) per SYSTEM_ARCHITECTURE §8. They are platform-level and unauthenticated.

---

## 3. Semver policy per surface

Each surface follows **semantic versioning at the API contract level**, not at the package level:

| Change type                                                             | Bump                                               | Example                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Backward-incompatible (removed field, changed shape, changed semantics) | major → new prefix (`/api/public/v2` or `/api/v2`) | Renaming `tide.height` to `tide.meters`   |
| Backward-compatible additive (new optional field, new endpoint)         | minor → no prefix change, documented               | Adding `wave.period` to the wave response |
| Bug fix / no contract change                                            | patch → no prefix change                           | Fixing a stale-cache edge case            |

URL prefix only changes on a **major** bump. Minor and patch changes happen in place.

---

## 4. Deprecation policy

### 4.1 Public surface

- A deprecated endpoint/field must remain functional for **at least 6 months** after deprecation is announced.
- Deprecation announced via: a `Deprecation` response header (RFC draft 9722 style: `Deprecation: true` or a timestamp), a `Sunset` header with the removal date, and a notice in the API changelog (`docs/architecture/API_VERSIONING.md` changelog).
- Removal requires a new ADR + Architect approval because the public surface is externally visible.

### 4.2 Admin surface

- Deprecation window: **at least 2 weeks** (one admin portal release cycle).
- Same header conventions.
- Removal does not require an ADR (internal surface) but must be coordinated with the Admin Portal release.

---

## 5. Response envelope (consistent across both surfaces)

```json
{
  "data": { ... },
  "freshness": {
    "status": "fresh" | "stale" | "unavailable",
    "fetchedAt": "2026-07-31T08:00:00Z",
    "validUntil": "2026-07-31T10:00:00Z",
    "source": "noaa-tide-api"
  }
}
```

- Sourced data responses (tide/weather/wind/wave) **always** include the `freshness` envelope (ADR-0008 retained).
- Computable responses (moon/sun/hijri) omit `freshness` (instant, no cache).
- Error shape (consistent across both surfaces):

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "details": { ... },
  "correlationId": "uuid"
}
```

---

## 6. CORS & credentials

| Surface       | CORS                                                                | Credentials                                                        |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/api/public` | `Access-Control-Allow-Origin: *` (or allow-list of partner domains) | **No** credentials, no cookies. Anonymous.                         |
| `/api/v1`     | `Access-Control-Allow-Origin: <admin portal origin>` only           | `Access-Control-Allow-Credentials: true` (httpOnly refresh cookie) |

The Public Portal **never** sends cookies or Authorization headers. The Admin Portal always sends `Authorization: Bearer <access>` and relies on the httpOnly refresh cookie.

---

## 7. Rate limiting & caching

| Surface       | Strategy                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/public` | Edge rate-limit per IP; aggressive CDN caching of read responses (tide/weather/moon/sun are time-bounded and cacheable until `validUntil`); `Cache-Control: public, max-age=<seconds-to-validUntil>`. |
| `/api/v1`     | No edge caching (per-user data); API-level rate limit on login (brute-force protection); normal request throttling.                                                                                   |

Public responses must never include PII, so they are safely cacheable at shared CDNs.

---

## 8. Versioning lifecycle

1. **Propose** a version-affecting change → update this doc's changelog + open an ADR if major.
2. **Deprecate** the old shape in place (add header, keep working).
3. **Release** the new shape under a new prefix (major) or in place (minor).
4. **Support both** shapes during the deprecation window.
5. **Remove** the deprecated shape after the window, with a final changelog entry.

---

## 9. Change log

| Surface | Version | Date       | Notes                                                                                                             |
| ------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| public  | v1      | 2026-07-31 | Initial public surface (tide, weather, wind, wave, moon, sun, hijri, calendar, alerts, stations, about)           |
| admin   | v1      | 2026-07-31 | Initial admin surface (auth, users, roles, dashboard, calendar CRUD, stations CRUD, alerts CRUD, audit, settings) |
