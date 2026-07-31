# Project Roadmap — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Owner:** Chief Software Architect  

Status legend: `Planned` · `In progress` · `Done` · `Blocked` · `Deferred`

---

## 1. Strategy

Deliver a **thin vertical slice** early (auth → stations → computable data → calendar → patrol planner), then add sourced data (tide, weather, wind, wave), then notifications and reports. Computable data (moon, sun, Hijri) is zero-cost and zero-dependency — build first.

---

## 2. Phases

### Phase 0 — Foundation (Docs & decisions)

**Goal:** Every engineer can build against a shared design.  
**Status:** `Done` — [Sprint 0 completion report](../PROJECT_STATE.md)

| Work item | Status | Notes |
|-----------|--------|-------|
| Product vision | Done | `docs/vision/` |
| SRS foundation | Done | `docs/requirements/SRS.md` |
| System architecture | Done | `docs/architecture/` |
| Domain model | Done | `docs/architecture/DOMAIN_MODEL.md` |
| Folder structure | Done | `docs/structure/` |
| Engineering standards & DoD | Done | `docs/governance/` (carried forward) |
| ADR process | Done | `docs/decisions/` |
| Stack re-confirmation | Done | ADR-0009 |
| Data source strategy | Done | ADR-0008 |
| Auth strategy | Done | ADR-0010 |
| Archive previous project | Done | `archive/enforcement/` |

**Exit criteria:** All docs complete; architecture frozen; repo skeleton ready. **All met.**

---

### Phase 1 — MVP (P0 requirements)

**Goal:** Usable marine operational planning tool for one organization.  
**Status:** `Ready`  
**SRS scope:** All P0 FRs (see SRS §7)

| Epic | Deliverables | Status |
|------|--------------|--------|
| Platform bootstrap | NestJS app, Prisma schema, PostgreSQL, Docker Compose, config | Planned |
| Authentication | Login, JWT, refresh rotation, logout (ADR-0010) | Planned |
| Users | User CRUD, roles, RBAC | Planned |
| Stations | Station CRUD, status, archive | Planned |
| Computable data | Moon phase, sunrise/sunset, Hijri calendar (local computation) | Planned |
| Sourced data | Tide, weather, wind, wave (adapter + cache + stale fallback) | Planned |
| Marine Calendar | Unified calendar view (day/week/month) | Planned |
| Patrol Planner | Patrol plan CRUD, lifecycle, condition snapshot | Planned |
| Dashboard | Today's conditions, active plans, freshness alerts | Planned |
| Settings | Org profile, provider config | Planned |
| Audit | Append-only audit for core entities | Planned |
| Ops readiness | Health endpoints, logging, cron config | Planned |

**Exit criteria:** User can log in, view calendar with environmental data for a station, create a patrol plan with condition snapshot, see dashboard.

---

### Phase 2 — Notifications & reports

**Goal:** Operational awareness and reporting.  
**Status:** `Planned`

| Epic | Deliverables | Status |
|------|--------------|--------|
| Notifications | In-app alerts for assignments, status changes, stale data | Planned |
| Reports | Patrol plan reports, data freshness audit | Planned |
| Export | CSV/PDF export | Planned |
| Data freshness UI | Visual stale indicators throughout | Planned |

---

### Phase 3 — Scale & polish

**Goal:** Daily driver for larger operations.  
**Status:** `Planned`

| Epic | Deliverables | Status |
|------|--------------|--------|
| Performance pass | Indexes, p95 validation, cache tuning | Planned |
| Email/webhooks | External notifications | Planned |
| MFA | Optional for privileged roles | Planned |
| Advanced twilight | Civil/nautical/astronomical twilight | Planned |
| Queue-based refresh | BullMQ + Redis if cron outgrown | Planned |

---

### Phase 4 — Expansion (selective)

**Goal:** Add modules only with clear owner and SRS.  
**Status:** `Deferred`

Candidates (not committed):

- Multi-tenant SaaS packaging  
- Offline vessel sync agent  
- External IdP (OIDC)  
- Advanced AIS/VMS integration (currently out of scope per PMD-0001)  

---

## 3. Milestones

| Milestone | Phase | Intent |
|-----------|-------|--------|
| M0 Docs freeze v1.0 | 0 | Architecture baseline frozen |
| M1 Hello production-shaped | 1 early | Deployable empty app + CI |
| M2 Auth + stations | 1 | Master data live |
| M3 Computable data | 1 | Moon, sun, Hijri working |
| M4 Sourced data | 1 | Tide, weather, wind, wave with cache |
| M5 Calendar + patrol | 1 | Core planning loop |
| M6 MVP release | 1 exit | P0 complete |
| M7 Notifications + reports | 2 exit | Operational awareness |

---

## 4. Dependencies

```
Stack ADR ──► Scaffolding ──► Auth ──► Users ──► Stations
                                                    │
                    ┌───────────────────────────────┤
                    ▼                               ▼
            Computable data                Sourced data
          (Moon, Sun, Hijri)           (Tide, Weather, Wind, Wave)
                    │                               │
                    └──────────┬────────────────────┘
                               ▼
                        Marine Calendar
                               │
                               ▼
                        Patrol Planner ──► Dashboard
                               │
                    Events ──► Notifications/Reports/Audit
```

---

## 5. Risk register

| Risk | Impact | Response |
|------|--------|----------|
| External API downtime | Stale data | Cache with stale fallback (ADR-0008) |
| External API rate limits | Refresh throttling | Scheduling + per-station batching |
| Provider schema change | Adapter breakage | Adapter maps to domain; swap via infrastructure only |
| Cron job lost on restart | Delayed refresh | Idempotent re-fetch on startup |
| Computation library inaccuracy | Wrong sun/moon/Hijri | Use established libraries; validate against known tables |

---

## 6. Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-31 | Initial roadmap for MarineOps Calendar |