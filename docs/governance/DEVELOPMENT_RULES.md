# §10 — Development Rules: MarineOps Hub

**Version:** 2.0.0 (Proposed)  
**Last updated:** 2026-07-31  
**Status:** Binding for all engineers and coding agents  
**Authorised by:** ADR-0011

> The foundational governance — [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md) and [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) — is **carried forward unchanged** from the Calendar baseline (ADR-0011 §2). This document adds **Hub-specific** development rules on top of that foundation. Where this document and ENGINEERING_STANDARDS agree, both apply; where the Hub introduces a new rule (two portals, public/admin split), it is stated here.

---

## 1. Authority (unchanged from ENGINEERING_STANDARDS §1)

1. Documentation leads implementation. Conflict → update docs, then code.
2. Chief Software Architect owns architecture, SRS, structure, roadmap, ADRs.
3. Feature engineers own module implementation within those boundaries.

The Hub baseline (v2.0.0) is **Proposed** until ADR-0011 is ratified. After ratification it freezes; breaking changes require a new ADR.

---

## 2. Before writing code (Hub checklist)

Standard checklist (ENGINEERING_STANDARDS §2) plus Hub-specific items:

- [ ] Relevant requirements identified
- [ ] Domain language checked (`MODULE_DEPENDENCY.md` §4)
- [ ] Target folder per `FOLDER_STRUCTURE.md` §2
- [ ] **Which surface does this serve?** Public (`/api/public`), Admin (`/api/v1`), or both — pick deliberately
- [ ] **Which portal consumes this?** `web-public`, `web-admin`, or both
- [ ] New cross-cutting decision? → draft ADR
- [ ] Security/audit impact considered
- [ ] If the module is future-scope (Patrol Planner, AIS, VMS, Vessel Monitoring) → an ADR must be accepted first

---

## 3. Two-portal development rules (NEW for Hub)

These rules did not exist in the Calendar baseline and are the core Hub additions.

### 3.1 Surface discipline

- Public controllers live **only** under `apps/api/src/api/public/`.
- Admin controllers live **only** under `apps/api/src/api/admin/`.
- A controller may never live inside a module folder.
- `@Public()` may appear **only** on controllers under `src/api/public/` and on the four `/api/v1/auth/*` login/refresh/logout/me routes. A CI lint rule enforces this.

### 3.2 Public surface is read-only

- `/api/public/*` supports **GET only**. No POST/PUT/PATCH/DELETE.
- Public controllers may import **only read-side use-cases / query ports**. Importing a command use-case into a public controller is a lint error.
- Public responses use the **public DTO** (strict subset, no PII, no admin fields).

### 3.3 Portal discipline

- `apps/web-public` must never import `/api/v1` — enforced by build-time lint.
- `apps/web-public` must never import admin-only exports from `packages/ui`.
- `apps/web-admin` must never bypass the auth guard; every route except `/login` is gated.
- Both portals share `packages/shared-kernel` and `packages/api-client` to prevent DTO drift.

### 3.4 No auth in the public portal

- No login UI, no token storage, no auth context, no `Authorization` headers.
- Any 401 logged on `/api/public/*` is a misconfiguration alert.

---

## 4. Code design rules (Hub-specific additions)

The Calendar design rules (ENGINEERING_STANDARDS §3) all still apply. Additions:

1. **Module boundaries** — depend on application ports, not foreign infrastructure. (unchanged)
2. **Domain purity** — no HTTP/DB frameworks inside `domain/`. (unchanged)
3. **Use-case oriented API** — controllers thin; business in application/domain. (unchanged)
4. **RBAC on server** — every mutating and sensitive read path authorized. (unchanged)
5. **Audit** — all admin state-changing actions emit audit events. Public reads are **not** audited (volume).
6. **Pagination** — all list endpoints (both surfaces).
7. **UTC** — store UTC; convert at edges.
8. **Errors** — typed/stable error codes via `DomainExceptionFilter`; consistent envelope on both surfaces.
9. **No secrets** in repo, logs, client bundles, or **public responses**.
10. **No speculative microservices.**
11. **NEW — Surface isolation**: a feature that needs both public read and admin write is implemented as two controllers (one per surface) calling the same module's read vs write use-cases. Never collapse them into one controller.
12. **NEW — DTO projection by type**: public and admin DTOs are distinct types. The public controller cannot import the admin DTO type.

---

## 5. API standards (Hub)

- Two prefixes: `/api/public` (no auth) and `/api/v1` (JWT + RBAC). See §5 API Versioning.
- JSON request/response.
- Consistent error envelope on both surfaces.
- Auth required on `/api/v1` except the four auth routes; **never** on `/api/public`.
- Breaking changes: public surface → major bump + ADR; admin surface → coordinate with Admin Portal release + changelog entry.

---

## 6. Data standards (Hub)

Carry forward ENGINEERING_STANDARDS §5, plus §9 Database Ownership Rules of this baseline:

- One owner per table.
- No cross-module writes.
- Foreign references by ID only (no enforced cross-module FK cascades).
- No cross-module joins as default.
- Public/admin reads share the owning module's table (read-through), but writes come only from admin use-cases.
- Computable modules have no tables.
- Soft delete / archive for master data; audit is append-only.
- Migrations via Prisma only.

---

## 7. Testing standards (Hub)

| Level       | Expectation                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Domain rules, pure computable functions, use-case logic (with port fakes)                                                                   |
| Integration | Repositories, auth flows, module API happy/sad paths — **for both surfaces**                                                                |
| E2E         | Public Portal critical path (browse calendar → view station → view alerts); Admin Portal critical path (login → manage station → audit log) |

- Every public controller must have an integration test asserting it returns the **public DTO** (not the admin DTO).
- Every admin controller must have an integration test asserting 401 without a token and 403 without the required permission.
- No P0 feature merges without tests appropriate to risk (DoD).

---

## 8. Git & review (Hub)

- Small PRs mapped to SRS/epic.
- PR description lists SRS IDs, doc updates, and **which surface/portal** is affected.
- PRs touching the public surface require extra scrutiny (external-facing stability).
- PRs adding a new `/api/public` route must update §8 Routes in the same PR.
- Do not commit `apps/` code that invents architecture contradicting docs.
- `main` always releasable after CI exists.

---

## 9. Documentation duty (Hub)

Update in the **same change** when you:

- Add/change a public or admin API (update §5 API Versioning + §8 Routes).
- Add a module or aggregate (update §3/§4 Module Dependency & Domain Boundaries).
- Change permissions or roles (update §7 Authorization).
- Add a portal route (update §8 Routes).
- Adopt a dependency that affects architecture (ADR).
- Complete a roadmap epic (status flip).

---

## 10. Coding agents / AI assistants (Hub)

- Follow `docs/` strictly — especially the surface/portal split.
- Do not invent product scope outside the SRS/module list.
- Do not write application code when the task is architecture-only.
- Prefer editing `docs/` for planning tasks.
- When implementing, mirror the folder structure exactly (two web apps, `src/api/public` + `src/api/admin`).
- Never add auth code to the Public Portal. Never add `@Public()` to an admin controller.

---

## 11. Security minimum bar (Hub)

- Parameterized queries / ORM safe usage.
- File upload limits and authz on download (admin only).
- Dependency updates for critical CVEs.
- Least-privilege cloud/DB credentials.
- **NEW — Public response audit**: before merging a public endpoint, verify the response contains no PII and no admin-only fields. The public DTO type enforces this; review double-checks.
- **NEW — Public rate limiting**: every `/api/public` route is rate-limited at the edge.

---

## 12. Open architecture questions (deferred)

- Station-scoped officer roles (resource-level authorization) — future ADR.
- API keys for third-party partners on `/api/public` — future decision.
- MFA for privileged admin roles — Phase 3.
- Queue-based refresh (BullMQ + Redis) if cron outgrows NestJS Schedule — future ADR.
- AIS/VMS/Vessel Monitoring integration shape — each its own ADR before implementation.

---

## 13. Change log

| Version | Date       | Notes                                                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Hub development rules — two-portal/surface discipline on top of carried-forward governance (ADR-0011) |
