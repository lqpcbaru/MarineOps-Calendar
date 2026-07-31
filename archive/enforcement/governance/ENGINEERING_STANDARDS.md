# Engineering Standards — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  
**Binding:** Yes — all engineers and coding agents  

---

## 1. Authority

1. **Documentation leads implementation.** Conflict → update docs, then code.  
2. **Chief Software Architect** owns architecture, SRS, structure, roadmap, ADRs.  
3. Feature engineers own module implementation within those boundaries.  

---

## 2. Before writing code

Checklist:

- [ ] Relevant SRS IDs identified  
- [ ] Domain language checked (`DOMAIN_MODEL.md`)  
- [ ] Target folder per `FOLDER_STRUCTURE.md`  
- [ ] New cross-cutting decision? → draft ADR  
- [ ] Security/audit impact considered  

No drive-by new top-level folders or new bounded contexts without Architect sign-off.

---

## 3. Code design rules

1. **Modular boundaries** — depend on application ports, not foreign infrastructure.  
2. **Domain purity** — no HTTP/DB frameworks inside `domain/`.  
3. **Use-case oriented API** — controllers thin; business in application/domain.  
4. **RBAC on server** — every mutating and sensitive read path authorized.  
5. **Audit** — state changes on User, Vessel, WorkOrder, Role emit audit.  
6. **Pagination** — all list endpoints.  
7. **UTC** — store UTC; convert at edges.  
8. **Errors** — typed/stable error codes; no raw stack traces to clients.  
9. **No secrets** in repo, logs, or client bundles.  
10. **No speculative microservices.**  

---

## 4. API standards

- Prefix: `/api/v1`  
- JSON request/response  
- Consistent error envelope  
- Auth required except health and auth endpoints  
- Breaking changes require version bump or explicit migration guide in docs  

---

## 5. Data standards

- Migrations only through approved migration tool (ADR)  
- No manual prod schema edits  
- Soft-delete/archive for historical master data  
- Foreign references across modules by ID  

---

## 6. Testing standards

| Level | Expectation |
|-------|-------------|
| Unit | Domain rules and pure application logic |
| Integration | Repositories, auth, module API happy/sad paths |
| E2E | Critical ops path: login → vessel → WO lifecycle |

No P0 feature merges without tests appropriate to risk (see DoD).

---

## 7. Git & review

- Small PRs mapped to SRS/epic  
- PR description lists SRS IDs and doc updates  
- Do not commit `apps/` code that invents architecture contradicting docs  
- `main` (or `trunk`) always releasable after Phase 1 CI exists  

---

## 8. Documentation duty

Update in the **same change** when you:

- Add/change a public API  
- Add a module or aggregate  
- Change WO status model or permissions  
- Adopt a new dependency that affects architecture  
- Complete a roadmap epic (status flip)  

---

## 9. Coding agents / AI assistants

- Follow this file and `/docs` strictly  
- **Do not** invent product scope outside SRS  
- **Do not** write application code when the task is architecture-only  
- Prefer editing `docs/` for planning tasks  
- When implementing, mirror folder structure exactly  

---

## 10. Security minimum bar

- Parameterized queries / ORM safe usage  
- File upload limits and authz on download  
- Dependency updates for critical CVEs  
- Least privilege cloud/DB credentials  

---

## 11. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial standards |