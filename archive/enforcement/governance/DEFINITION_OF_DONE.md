# Definition of Done — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  

A backlog item (story, epic slice, bugfix) is **Done** only when all applicable checks pass.

---

## 1. Functional Done

- [ ] Behavior matches SRS requirement IDs listed on the ticket  
- [ ] Edge cases agreed in ticket are handled (validation, authz denials)  
- [ ] UX copy uses ubiquitous language from domain model  
- [ ] No open “known issues” without ticket link for P0 paths  

---

## 2. Engineering Done

- [ ] Code lives in the correct module/folder per structure docs  
- [ ] Server-side authorization enforced  
- [ ] Audit events emitted for relevant state changes  
- [ ] List endpoints paginated  
- [ ] Migrations included and reversible or forward-safe as per policy  
- [ ] No secrets committed  
- [ ] Lint/typecheck/tests pass in CI (once CI exists)  

---

## 3. Test Done

- [ ] Unit tests for domain rules touched  
- [ ] Integration or API tests for new endpoints  
- [ ] Regression tests for bugs  
- [ ] Critical path e2e updated when flow changes (Phase 1+)  

---

## 4. Documentation Done

- [ ] SRS updated if requirement changed  
- [ ] Domain/module doc updated if model changed  
- [ ] ADR added if architecture decision made  
- [ ] Roadmap status updated if epic completed  
- [ ] README/module README updated if run/dev steps changed  

---

## 5. Operability Done

- [ ] Meaningful logs (no PII spam)  
- [ ] Errors mapped to stable client codes  
- [ ] Feature flagged or config documented if optional  
- [ ] `.env.example` updated for new config keys  

---

## 6. Review Done

- [ ] Peer review approved (human)  
- [ ] Architect review if boundaries, security model, or status graph changed  
- [ ] Product/stakeholder UAT for user-facing P0 flows when required  

---

## 7. Not Done if

- “Works on my machine” only  
- UI-only permission hiding  
- Docs “to follow”  
- TODOs that block the requirement left in main path  
- Cross-module deep imports “just this once”  

---

## 8. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial DoD |