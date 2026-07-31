# Product Vision — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Status:** Baseline (resolved per ADR-0005)  

---

## 1. Vision statement

MarineOps is an **operations platform for maritime and marine service organizations**. It unifies vessel readiness, crew and shore workflows, job/work orders, compliance evidence, and operational visibility into one coherent system so teams can plan, execute, and audit marine work with less friction and fewer gaps.

---

## 2. Problem

Marine operations teams typically juggle:

- Spreadsheets, email, and paper for work orders and checklists  
- Fragmented tools for vessels, crew, inventory, and maintenance  
- Weak audit trails for safety, regulatory, and client reporting  
- Limited real-time view of what is happening on which asset  

This causes delayed jobs, compliance risk, duplicated data entry, and poor handover between shore and vessel.

---

## 3. Solution (product thesis)

MarineOps provides a **domain-driven operations core** with:

1. **Assets & vessels** — fleet identity, status, and operational context  
2. **Work & jobs** — planned and reactive work from request → close-out  
3. **People & roles** — crew/shore assignment and responsibility  
4. **Compliance & evidence** — checklists, certificates, attachments, audit log  
5. **Visibility** — dashboards, alerts, and operational reports  

The platform is designed to grow module-by-module without rewriting the core.

---

## 4. Target users

| Persona | Needs |
|---------|--------|
| Operations manager (shore) | Schedule jobs, see fleet status, resolve blockers |
| Superintendent / fleet manager | Vessel readiness, maintenance backlog, compliance |
| Master / vessel officer | Execute work orders, log evidence, report issues |
| Technician / crew | Assigned tasks, checklists, parts/requests |
| Compliance / HSEQ | Certificates, audits, traceability |
| Client / charterer (optional later) | Limited status and report access |

---

## 5. Goals (12–18 months)

- Single system of record for vessels, work orders, and operational events  
- Traceable work lifecycle with attachments and audit history  
- Role-based access for shore vs vessel contexts  
- Extensible module architecture (maintenance, inventory, crewing, etc.)  
- Exportable reports suitable for internal ops and external audits  

---

## 6. Non-goals (explicit)

- Not a full ERP (finance/GL, payroll) in v1  
- Not a navigation / ECDIS / bridge system  
- Not a real-time AIS tracking product as a primary offering (may integrate later)  
- Not a multi-tenant marketplace in v1 (single-tenant / multi-org design may be planned later)  
- No autonomous vessel control or safety-critical control loops  

---

## 7. Success metrics (product)

| Metric | Intent |
|--------|--------|
| Time from job request → assignment | Reduce operational lag |
| % work orders closed with required evidence | Improve compliance quality |
| Duplicate vessel/crew records | Reduce data chaos |
| Time to produce standard ops report | Reduce admin load |
| System adoption (active users / week) | Prove operational fit |

Exact targets are set per client/deployment in implementation phases.

---

## 8. Principles

1. **Operations first** — prioritize real job flow over decorative features.  
2. **Audit by default** — important state changes are attributable and durable.  
3. **Domain boundaries** — modules own their data; cross-module via contracts.  
4. **Shore and vessel aware** — UX and offline/sync strategy respect connectivity.  
5. **Docs lead code** — architecture and SRS drive implementation.  

---

## 9. Product assumptions (resolved for Phase 1)

The following were resolved by the Chief Software Architect via [ADR-0005](../decisions/ADR-0005-product-assumptions-phase-1.md). Stakeholders may override via superseding ADR.

| Question | Assumption for Phase 1 |
|----------|------------------------|
| Primary vertical focus | Mixed / general marine ops. No single sub-sector specialization. |
| Offline vessel client in Phase 1? | No. Online-first web app only. Offline = Phase 4 with its own ADR. |
| Multi-company / multi-fleet tenancy model | Single organization. `organizationId` column prepared from day one for future multi-tenancy. |
| Preferred stack constraints | Open-source, Docker-first, cloud-agnostic (AWS ECS/Fargate default). On-prem possible. |
| API style | RESTful JSON over HTTP. Confirm architecture default. |
| i18n scope | English-only UI in Phase 1. i18n keys externalized from day one. |
| Vessel identifier | Name + organization is the business key. IMO/MMSI are optional. |
| Deployment | Docker Compose for dev; cloud PaaS for prod. No hard cloud lock-in. |