# Product Vision — MarineOps Calendar

**Version:** 1.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline  
**Authorised by:** PMD-0001 (Project Direction Change)

---

## 1. Vision statement

MarineOps Calendar is a **marine operational planning platform** that gives maritime agencies a unified, calendar-centric view of environmental conditions — tides, weather, wind, waves, sun/moon cycles, and Hijri dates — so they can plan patrols and marine operations against real-world conditions with confidence.

---

## 2. Problem

Marine operational planning teams currently:

- Check tide tables, weather forecasts, wind/wave data, and astronomical times across **multiple disconnected sources**  
- Manually correlate environmental windows with patrol schedules and operational calendars  
- Lack a single integrated view that combines Hijri calendar (important for regional operations) with Gregorian planning  
- Have no persistent record of what conditions were known at planning time vs. what actually occurred  
- Cannot easily generate operational reports that combine planned activities with environmental context  

This causes planning errors, missed environmental windows, redundant data entry, and poor auditability of operational decisions.

---

## 3. Solution (product thesis)

MarineOps Calendar provides a **planning-centric operations core** with:

1. **Stations** — geographic reference points where environmental data is observed/predicted  
2. **Marine Calendar** — unified calendar combining environmental data, astronomical events, and operational activities  
3. **Environmental data** — tide, weather, wind, wave height (sourced from external APIs with caching)  
4. **Astronomical data** — sunrise, sunset, moon phase, Hijri calendar (computed locally, no external dependency)  
5. **Patrol Planner** — schedule and plan patrols against environmental conditions  
6. **Dashboard** — operational overview with key conditions at a glance  
7. **Notifications** — alerts for planned activities and condition changes  
8. **Reports** — exportable operational and planning reports  
9. **Settings** — system configuration, station management, user preferences  

The platform is designed to grow module-by-module without rewriting the core.

---

## 4. Target users

| Persona | Needs |
|---------|-------|
| Operations planner | Plan patrols against tide/weather windows; see integrated calendar |
| Patrol commander | View planned patrol with environmental conditions; receive notifications |
| Station manager | Manage station configuration; monitor data freshness |
| Admin | Manage users, roles, system settings, reference data |
| Compliance / auditor | Review planning history and environmental context for past operations |

---

## 5. Goals (12–18 months)

- Single system of record for marine operational planning and environmental conditions  
- Integrated calendar view combining all environmental + astronomical + Hijri data  
- Patrol planning with environmental context attached to each plan  
- Automated data refresh for tide/weather with graceful degradation  
- Role-based access for planners, commanders, and auditors  
- Exportable reports for operational review and compliance  

---

## 6. Non-goals (explicit)

- Not a vessel tracking or AIS/VMS system (out of scope per PMD-0001)  
- Not a live tracking, geofence, or heatmap system (out of scope per PMD-0001)  
- Not a navigation / ECDIS / bridge system  
- Not a full ERP (finance, payroll, HR)  
- Not a real-time control system for vessels or equipment  
- Not a multi-tenant SaaS in Phase 1 (single-organization)  

---

## 7. Success metrics (product)

| Metric | Intent |
|--------|--------|
| Time to plan a patrol with environmental context | Reduce planning effort |
| Data freshness rate (tide/weather cache hit vs. stale) | Ensure data reliability |
| Patrol plan accuracy (conditions matched actual) | Validate planning quality |
| User adoption (active planners / week) | Prove operational fit |
| Report generation time | Reduce admin load |

---

## 8. Principles

1. **Planning first** — the calendar and patrol planner are the heart of the product; environmental data serves planning.  
2. **Data integrity** — always show data freshness status; never silently serve stale data without a flag.  
3. **Domain boundaries** — modules own their data; cross-module via contracts (ADR-0007).  
4. **Graceful degradation** — when external APIs fail, serve cached data with a `stale` indicator (ADR-0008).  
5. **Docs lead code** — architecture and SRS drive implementation (carried forward from ADR-0003).  

---

## 9. Product assumptions (resolved for Phase 1)

| Question | Assumption | Source |
|----------|------------|--------|
| Primary vertical | Marine operational planning for maritime agencies | PMD-0001 |
| Tenancy model | Single organization; `organizationId` column prepared for future | ADR-0006 |
| Deployment | Docker-first, cloud-agnostic | ADR-0006 |
| API style | RESTful JSON over HTTP | ADR-0006 |
| i18n scope | English-first; i18n keys externalized; Hijri calendar supported natively | ADR-0006 |
| External data | Computable data (sun/moon/Hijri) computed locally; sourced data (tide/weather) via adapter with caching | ADR-0008 |
| Stack | NestJS / Prisma / PostgreSQL / React / Tailwind / JWT / pnpm | ADR-0009 |
| Authentication | JWT access + refresh rotation, httpOnly cookies, argon2id | ADR-0010 |
| Offline | Not required for Phase 1; online-first | ADR-0006 |