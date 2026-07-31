# Software Requirements Specification (SRS) — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Status:** Foundation draft  
**Related:** [PRODUCT_VISION](../vision/PRODUCT_VISION.md), [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md)

---

## 1. Introduction

### 1.1 Purpose

This SRS defines functional and non-functional requirements for MarineOps. Engineers implement only what is specified here or approved via change control (updated SRS + ADR when needed).

### 1.2 Scope

MarineOps covers:

- Identity & access  
- Fleet / vessel (asset) registry  
- Work order / job lifecycle  
- Checklists & evidence  
- Notifications & operational dashboards (baseline)  
- Audit logging  

Out of scope for foundation (tracked on roadmap): inventory, full planned maintenance (PMS), crewing/payroll, client portal, AIS, finance.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Vessel | Primary operational asset (ship, boat, barge, etc.) |
| Work Order (WO) | Unit of planned or reactive work |
| Shore user | User operating primarily from office/shore systems |
| Vessel user | User operating in vessel context |
| Evidence | Attachment, checklist result, or structured log supporting WO close-out |
| Organization | Tenant boundary for data isolation (v1: single org assumed) |

### 1.4 References

- `docs/vision/PRODUCT_VISION.md`  
- `docs/architecture/SYSTEM_ARCHITECTURE.md`  
- `docs/architecture/DOMAIN_MODEL.md`  
- `docs/roadmap/ROADMAP.md`  

---

## 2. Overall description

### 2.1 Product perspective

MarineOps is a greenfield web application (API + web client). Optional mobile/PWA and vessel offline clients are future phases.

### 2.2 User classes

| ID | Class | Description |
|----|-------|-------------|
| U-ADM | Admin | Configures org, roles, master data |
| U-OPS | Operations | Creates/assigns WOs, monitors progress |
| U-SUP | Superintendent | Fleet readiness, priorities, compliance view |
| U-VES | Vessel operator | Executes WOs, submits evidence |
| U-HSEQ | Compliance | Reviews evidence, certificates, audits |
| U-AUD | Auditor (read) | Read-only historical access |

### 2.3 Operating environment

- Modern browsers (last two major versions of Chrome, Edge, Firefox, Safari)  
- Server: container-friendly Linux or equivalent cloud runtime  
- Database: relational primary store  
- Time: store UTC; display user/org timezone  

### 2.4 Design constraints

- Follow `docs/structure/FOLDER_STRUCTURE.md`  
- Follow `docs/governance/ENGINEERING_STANDARDS.md`  
- No secrets in source control  
- API-first: UI consumes public application APIs only  

### 2.5 Assumptions

- Single organization in Phase 0–1  
- Users have network connectivity for core workflows  
- Stack concrete choices will be fixed via ADR (language, framework, DB)  

---

## 3. Functional requirements

Requirements use IDs `FR-XXX`. Priority: **P0** must for MVP, **P1** near-term, **P2** later.

### 3.1 Identity & access

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTH-001 | P0 | Users shall authenticate with email/password or approved IdP (final mechanism via ADR). |
| FR-AUTH-002 | P0 | System shall support role-based access control (RBAC). |
| FR-AUTH-003 | P0 | Sessions shall expire; logout shall invalidate session/token per security policy. |
| FR-AUTH-004 | P0 | Admins shall create, disable, and assign roles to users. |
| FR-AUTH-005 | P1 | Password reset / invite flow for new users. |
| FR-AUTH-006 | P1 | Optional MFA for privileged roles. |

### 3.2 Vessel / asset registry

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-VES-001 | P0 | System shall create, read, update vessels with unique identifier within organization. |
| FR-VES-002 | P0 | Vessel shall store at minimum: name, IMO/MMSI or local ID, type, status, flag/class fields as configured. |
| FR-VES-003 | P0 | Vessel status shall include operational states (e.g. Active, In yard, Laid up) configurable by admin. |
| FR-VES-004 | P0 | Soft-delete or archive vessels; no hard delete of vessels with historical WOs. |
| FR-VES-005 | P1 | Vessel documents/certificates metadata with expiry dates. |
| FR-VES-006 | P1 | Search and filter vessels by name, status, type. |

### 3.3 Work orders

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-WO-001 | P0 | Users with permission shall create work orders linked to a vessel (or org-level if allowed). |
| FR-WO-002 | P0 | WO shall include: title, description, priority, type, status, due date, assignee(s), creator, timestamps. |
| FR-WO-003 | P0 | WO status lifecycle: `Draft` → `Open` → `InProgress` → `Blocked` → `Completed` → `Closed` (exact names may be refined; transitions controlled). |
| FR-WO-004 | P0 | Invalid status transitions shall be rejected with clear errors. |
| FR-WO-005 | P0 | System shall record who changed status and when (audit). |
| FR-WO-006 | P0 | Users shall list/filter WOs by vessel, status, assignee, priority, date range. |
| FR-WO-007 | P0 | Comments/notes on WOs shall be supported. |
| FR-WO-008 | P1 | Checklist templates attachable to WO types; completion required before `Closed` when configured. |
| FR-WO-009 | P1 | File attachments as evidence on WO. |
| FR-WO-010 | P1 | Recurring / planned WO generation (basic). |
| FR-WO-011 | P2 | Parent/child WO hierarchy. |

### 3.4 Checklists & evidence

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-CHK-001 | P1 | Admins shall define checklist templates (items, required flags). |
| FR-CHK-002 | P1 | Executing users shall complete checklist instances on a WO. |
| FR-CHK-003 | P1 | Required items must be complete before WO close when policy says so. |
| FR-EVD-001 | P1 | Upload evidence files with size/type limits; virus scan strategy via ADR. |
| FR-EVD-002 | P1 | Evidence linked immutably to WO version/history where practical. |

### 3.5 Notifications & dashboard

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-NTF-001 | P1 | Notify assignee on assignment and status changes (in-app minimum). |
| FR-NTF-002 | P2 | Email/webhook notifications. |
| FR-DSH-001 | P0 | Dashboard: counts of open/overdue WOs, vessels by status. |
| FR-DSH-002 | P1 | Filters by fleet/vessel group. |

### 3.6 Audit & compliance views

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUD-001 | P0 | Persist audit events for create/update/status on vessels, WOs, users, roles. |
| FR-AUD-002 | P0 | Audit entries: actor, action, entity, timestamp, before/after or diff summary. |
| FR-AUD-003 | P1 | HSEQ can query WO history and evidence for a vessel over a date range. |
| FR-AUD-004 | P2 | Export audit and WO reports (CSV/PDF). |

### 3.7 Administration

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-ADM-001 | P0 | Manage reference data: WO types, priorities, vessel statuses. |
| FR-ADM-002 | P1 | Organization profile settings (name, timezone, locale). |
| FR-ADM-003 | P2 | Feature flags per module. |

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-SEC-001 | Security | All API endpoints authenticated except health/login. |
| NFR-SEC-002 | Security | Authorization checked per action (not only UI hide). |
| NFR-SEC-003 | Security | Passwords hashed with modern algorithm; secrets in env/secret store. |
| NFR-SEC-004 | Security | HTTPS in all non-local environments. |
| NFR-SEC-005 | Security | Input validation on all write APIs. |
| NFR-PRV-001 | Privacy | Personal data minimized; retention policy documented. |
| NFR-REL-001 | Reliability | Target API availability 99.5% for production (tune per deploy). |
| NFR-REL-002 | Reliability | Backups for primary DB daily minimum; restore drill on roadmap. |
| NFR-PERF-001 | Performance | p95 list APIs &lt; 500ms for typical dataset sizes (define load in perf ADR). |
| NFR-PERF-002 | Performance | Pagination required on all list endpoints. |
| NFR-SCL-001 | Scalability | Design for modular growth; avoid cross-module DB joins as default pattern. |
| NFR-USA-001 | Usability | Primary flows completable without training manual for ops users (validate in UAT). |
| NFR-I18N-001 | i18n | UI strings externalizable; English first. |
| NFR-OBS-001 | Observability | Structured logs, correlation IDs, health endpoints. |
| NFR-OBS-002 | Observability | Error tracking in non-dev environments. |
| NFR-MNT-001 | Maintainability | Domain modules isolatable; public APIs versioned when breaking. |
| NFR-OFF-001 | Offline | Offline vessel mode **not** required for MVP (P2+). |

---

## 5. Data requirements (logical)

Core entities (logical, not physical schema):

- User, Role, Permission  
- Organization (future multi-tenant ready)  
- Vessel  
- WorkOrder, WorkOrderComment, WorkOrderAttachment  
- ChecklistTemplate, ChecklistInstance, ChecklistItemResult  
- AuditEvent  
- Notification (optional table/queue)  

Physical schema is owned by implementation ADRs and domain module docs.

---

## 6. External interfaces

### 6.1 User interfaces

- Web application: auth, vessels, work orders, dashboard, admin  
- Responsive layout preferred; vessel-optimized views P1  

### 6.2 Software interfaces

- REST or RPC-style HTTP JSON API (choice via ADR)  
- Future: email provider, object storage, IdP (OIDC), webhooks  

### 6.3 Hardware interfaces

- None (standard compute and storage only)

---

## 7. Requirements traceability (MVP)

MVP = all **P0** FRs + **NFR-SEC-***, **NFR-PERF-002**, **NFR-OBS-001**, pagination and RBAC end-to-end.

| Epic | P0 requirement IDs |
|------|--------------------|
| Auth & RBAC | FR-AUTH-001..004 |
| Vessels | FR-VES-001..004 |
| Work orders | FR-WO-001..007 |
| Dashboard | FR-DSH-001 |
| Audit | FR-AUD-001..002 |
| Admin ref data | FR-ADM-001 |

---

## 8. Acceptance criteria (global)

A requirement is accepted when:

1. Behavior matches this SRS (or approved revision).  
2. Covered by automated tests at appropriate level (see Definition of Done).  
3. Documented if it introduces a new public API or domain rule.  
4. Security and audit obligations met for that feature.  

---

## 9. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial foundation SRS |