# System Architecture — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Status:** Foundation  
**Style:** Modular monolith first; extract services only with ADR justification  

---

## 1. Goals of the architecture

- Support maritime operations workflows with clear domain boundaries  
- Enable incremental module delivery without big-bang rewrites  
- Enforce security, audit, and data integrity at the core  
- Keep deploy simple for early phases (single deployable app + DB + object store)  
- Leave room for multi-tenant, offline vessel clients, and integrations  

---

## 2. Architectural style

### 2.1 Modular monolith (Phase 0–2)

One deployable **backend** and one **web frontend**, internally split into **domain modules** with:

- Explicit public module APIs (application services / use-cases)  
- No deep imports across module internals  
- Shared kernel only for cross-cutting primitives (IDs, errors, auth context, clock)  

### 2.2 Evolution path

```
Phase 0–1: Modular monolith
    ↓
Phase 2+: Optional extract of heavy modules (notifications, files, reporting)
    ↓
Later: Vessel sync / edge agent if offline required
```

Extraction requires ADR + interface stability.

---

## 3. High-level context

```
┌─────────────┐     HTTPS      ┌──────────────────────┐
│  Web Client │ ──────────────►│  MarineOps API       │
│  (SPA/SSR)  │◄──────────────│  (Modular Monolith)  │
└─────────────┘                └──────────┬───────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             ┌────────────┐       ┌──────────────┐      ┌─────────────┐
             │ Relational │       │ Object Store │      │  IdP / Auth │
             │ Database   │       │ (files)      │      │  (optional) │
             └────────────┘       └──────────────┘      └─────────────┘
```

Future actors: email gateway, webhook consumers, AIS/provider adapters, mobile clients.

---

## 4. Logical layers

```
┌─────────────────────────────────────────────┐
│ Presentation (Web UI)                       │
├─────────────────────────────────────────────┤
│ API / Transport (HTTP, DTOs, auth middleware)│
├─────────────────────────────────────────────┤
│ Application (use-cases / commands-queries)  │
├─────────────────────────────────────────────┤
│ Domain (entities, policies, domain events)  │
├─────────────────────────────────────────────┤
│ Infrastructure (DB, files, email, clock)    │
└─────────────────────────────────────────────┘
```

**Rules:**

- Domain has **no** framework or DB imports.  
- Application orchestrates domain + ports.  
- Infrastructure implements ports.  
- UI never talks to DB directly.  

---

## 5. Bounded contexts (modules)

See also [DOMAIN_MODEL.md](DOMAIN_MODEL.md).

| Module | Responsibility | Owns data |
|--------|----------------|-----------|
| **Identity** | Users, roles, permissions, sessions | Yes |
| **Fleet** | Vessels, vessel status, vessel master data | Yes |
| **WorkManagement** | Work orders, comments, lifecycle | Yes |
| **Compliance** | Checklists, certificates metadata, evidence rules | Yes |
| **Files** | Upload metadata, storage keys (binary in object store) | Yes |
| **Audit** | Append-only audit stream | Yes |
| **Notifications** | In-app/email dispatch | Yes |
| **Reporting** | Read models / exports | Mostly read projections |
| **SharedKernel** | IDs, Result/Error, auth principal, time | Primitives only |

### 5.1 Cross-module communication

- **Sync in-process calls** via published application interfaces for MVP  
- **Domain events** (in-process bus first) for side effects: `WorkOrderAssigned`, `WorkOrderClosed`, `VesselStatusChanged`  
- **No shared mutable tables** across modules  
- Foreign keys across modules: prefer **IDs only** + eventual consistency for projections  

---

## 6. Core runtime flows

### 6.1 Create and assign work order

1. API authenticates user, loads principal + permissions.  
2. `WorkManagement.CreateWorkOrder` validates vessel exists via Fleet query port.  
3. WO persisted; audit event written.  
4. Domain event `WorkOrderCreated` / `WorkOrderAssigned`.  
5. Notifications module handles event (in-app).  

### 6.2 Close work order with evidence (P1)

1. Compliance policy checks required checklist complete.  
2. Files module confirms required attachments present.  
3. Status transition to Closed; audit written.  
4. Reporting projections update.  

### 6.3 Authorization

- Permission checks at application layer (use-case entry).  
- Resource-level rules (e.g. vessel-scoped roles) expressed as domain/application policy.  
- UI may hide actions but **never** is the only control.  

---

## 7. Data architecture

| Store | Use |
|-------|-----|
| Relational DB | System of record for domains |
| Object storage | Evidence files, exports |
| Cache (optional) | Sessions, hot read models — not source of truth |
| Queue (optional later) | Email, heavy exports, sync |

**Conventions:**

- UTC timestamps  
- Soft delete / archive for master data with history  
- Optimistic concurrency on WO status where needed  
- Migrations versioned with app  

---

## 8. API design principles

- Resource-oriented HTTP JSON (default; confirm in ADR)  
- Versioning strategy: URL prefix `/api/v1`  
- Pagination, filtering, sorting on lists  
- Consistent error shape: `code`, `message`, `details`, `correlationId`  
- Idempotency keys for critical creates (P1)  

---

## 9. Security architecture

- TLS everywhere non-local  
- AuthN: session cookie or JWT/OIDC (ADR)  
- AuthZ: RBAC + optional resource scopes  
- Secrets outside repo  
- File upload: type/size limits, private buckets, signed download URLs  
- Audit of security-relevant actions  
- Least privilege DB and cloud roles  

---

## 10. Observability

- Structured logs (JSON) with `correlationId`, `userId` (where safe), `module`  
- Metrics: request rate, latency, error rate, WO transition counts  
- Health: `/health/live`, `/health/ready`  
- Tracing optional in Phase 1+  

---

## 11. Deployment view (target early production)

```
[ CDN / reverse proxy ]
          |
    [ Web static or SSR ]
          |
    [ API containers × N ]
          |
    [ Primary DB ] [ Object store ]
```

- 12-factor config  
- Separate env: local, staging, production  
- Blue/green or rolling deploys preferred  

---

## 12. Technology selection policy

Concrete stack (language, framework, DB, UI) is **not** locked in this document until product constraints are known.

Process:

1. Propose options in ADR  
2. Architect approves  
3. Update this doc’s “Decided stack” section  
4. Update folder structure if needed  

### Decided stack

| Layer | Choice | ADR |
|-------|--------|-----|
| Language / runtime | TypeScript 5.x, Node.js 22 LTS | ADR-0004 |
| Web framework | NestJS (modular monolith) | ADR-0004 |
| Validation | Zod | ADR-0004 |
| Database | PostgreSQL 16 | ADR-0004 |
| ORM / migrations | Prisma | ADR-0004 |
| Object storage | S3-compatible (MinIO local, AWS S3 prod) | ADR-0004 |
| Web client | React 19 + TanStack Router + TanStack Query | ADR-0004 |
| CSS | Tailwind CSS | ADR-0004 |
| Auth | JWT httpOnly cookies + bcrypt/argon2 | ADR-0004 |
| Testing | Vitest (unit/integration), Playwright (E2E) | ADR-0004 |
| Package manager | pnpm (monorepo workspaces) | ADR-0004 |

---

## 13. Quality attributes mapping

| Attribute | Approach |
|-----------|----------|
| Security | RBAC, TLS, validation, secrets management |
| Auditability | Audit module + immutable-ish event log |
| Maintainability | Module boundaries, docs-first, DoD |
| Performance | Pagination, indexes, avoid N+1 |
| Availability | Stateless API, DB backups, health checks |
| Extensibility | Ports/adapters, domain events, feature modules |

---

## 14. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| God-module monolith | Enforce module lint/boundaries; code review checklist |
| Premature microservices | Modular monolith until scale/team pain is real |
| Offline needs appear late | Keep domain pure; design sync-friendly IDs/events |
| Weak compliance evidence | Checklist + file policies before Close |
| Unclear vertical focus | Resolve open vision questions; keep core generic |

---

## 15. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial system architecture |