# Project Roadmap — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Owner:** Chief Software Architect  

Status legend: `Planned` · `In progress` · `Done` · `Blocked` · `Deferred`

---

## 1. Strategy

Deliver a **thin vertical slice** early (auth → vessels → work orders → dashboard → audit), then thicken compliance, files, and reporting. Prefer working operations over feature breadth.

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
| Engineering standards & DoD | Done | `docs/governance/` |
| ADR process | Done | `docs/decisions/` |
| Stack ADR (language, DB, UI) | Done | ADR-0004 |
| Resolve open product questions | Done | ADR-0005 |

**Exit criteria:** Stack ADR approved; repo skeleton matches folder structure; CI skeleton planned. **All met.**

---

### Phase 1 — MVP (P0 requirements)

**Goal:** Usable internal ops tool for one organization.  
**Status:** `Ready`  
**SRS scope:** All P0 FRs (see SRS §7)

| Epic | Deliverables | Status |
|------|--------------|--------|
| Platform bootstrap | apps/api, apps/web, DB, migrations, config | Planned |
| Identity | Login, users, roles, RBAC | Planned |
| Fleet | Vessel CRUD, status, archive | Planned |
| Work management | WO lifecycle, comments, filters | Planned |
| Dashboard | Open/overdue counts, vessel status summary | Planned |
| Audit | Append-only audit for core entities | Planned |
| Admin | Reference data (types, priorities, statuses) | Planned |
| Ops readiness | Health endpoints, logging, `.env.example`, deploy compose | Planned |

**Exit criteria:** Ops user can create vessel, create/assign/progress/close WO path (close without full checklist if P1 not yet done), see dashboard, admin can manage users/roles; security NFRs for authz on API.

---

### Phase 2 — Evidence & compliance thickness

**Goal:** Close-out quality suitable for HSEQ.  
**Status:** `Planned`

| Epic | Deliverables | Status |
|------|--------------|--------|
| Checklists | Templates + instances + close gates | Planned |
| Files | Object storage, attach to WO, download authz | Planned |
| Notifications | In-app assignment/status | Planned |
| Vessel certificates metadata | Expiry visibility | Planned |
| HSEQ views | History + evidence query | Planned |

**Exit criteria:** Configurable “evidence required to close”; file retention path documented.

---

### Phase 3 — Scale of use

**Goal:** Daily driver for larger fleets and more roles.  
**Status:** `Planned`

| Epic | Deliverables | Status |
|------|--------------|--------|
| Reporting exports | CSV/PDF operational reports | Planned |
| Email/webhooks | External notifications | Planned |
| Performance pass | Indexes, p95 validation | Planned |
| MFA for privileged roles | Optional enforce | Planned |
| UX vessel-optimized views | Mobile-friendly critical flows | Planned |
| Recurring WOs | Basic schedules | Planned |

---

### Phase 4 — Expansion modules (selective)

**Goal:** Add modules only with clear owner and SRS.  
**Status:** `Deferred` until Phase 2 exit

Candidates (not committed):

- Planned Maintenance (PMS)  
- Inventory / spares  
- Crewing & certificates of competency  
- Client/charterer read-only portal  
- AIS / position integration  
- Multi-tenant SaaS packaging  
- Vessel offline sync agent  

Each candidate requires: vision update, SRS, domain doc, ADR if architecture changes.

---

## 3. Milestones (target framing)

Dates are **indicative** until team capacity and stack are fixed.

| Milestone | Phase | Intent |
|-----------|-------|--------|
| M0 Docs freeze v0.1 | 0 | Architecture baseline usable |
| M1 Hello production-shaped | 1 early | Deployable empty app + CI |
| M2 Auth + vessels | 1 | Master data live |
| M3 Work orders vertical slice | 1 | Core ops loop |
| M4 MVP release | 1 exit | P0 complete |
| M5 Compliance-ready | 2 exit | Evidence + checklists |
| M6 Ops hardened | 3 | Reports + notifications + perf |

---

## 4. Dependencies

```
Stack ADR ──► Scaffolding ──► Identity ──► Fleet ──► WorkManagement ──► Dashboard
                 │                              │
                 └──────── Audit + Admin ───────┘
WorkManagement ──► Compliance/Files (Phase 2)
Events ──► Notifications/Reporting
```

---

## 5. Risk register (roadmap-level)

| Risk | Impact | Response |
|------|--------|----------|
| Stack undecided | Delays Phase 1 | Prioritize ADR in Phase 0 |
| Scope creep (ERP features) | MVP slip | Enforce non-goals in vision |
| Offline demanded early | Architecture thrash | Keep pure domain; defer sync agent |
| Single-org assumption wrong | Data model rework | Design orgId early even if unused |

---

## 6. How to update this roadmap

1. Change status only when exit criteria met or consciously deferred.  
2. Link PR/milestone when epics complete.  
3. Architect reviews phase exit.  
4. Do not delete historical phases; mark `Done` and add notes.  

---

## 7. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial roadmap |