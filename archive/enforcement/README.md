# MarineOps Documentation

**Status:** Foundation  
**Owner:** Chief Software Architect  
**Audience:** All engineers, product, QA, DevOps  

This directory is the **single source of truth** for MarineOps. Application code must follow these documents. If code and docs disagree, **update docs first**, then code.

---

## Document map

| Path | Purpose |
|------|---------|
| [vision/PRODUCT_VISION.md](vision/PRODUCT_VISION.md) | Why MarineOps exists, goals, non-goals |
| [requirements/SRS.md](requirements/SRS.md) | Software Requirements Specification |
| [architecture/SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md) | System design, layers, integrations |
| [architecture/DOMAIN_MODEL.md](architecture/DOMAIN_MODEL.md) | Core domains and bounded contexts |
| [structure/FOLDER_STRUCTURE.md](structure/FOLDER_STRUCTURE.md) | Repository layout all code must follow |
| [roadmap/ROADMAP.md](roadmap/ROADMAP.md) | Phased delivery plan |
| [governance/ENGINEERING_STANDARDS.md](governance/ENGINEERING_STANDARDS.md) | Rules every engineer must follow |
| [governance/DEFINITION_OF_DONE.md](governance/DEFINITION_OF_DONE.md) | When work is complete |
| [decisions/](decisions/) | Architecture Decision Records (ADRs) |
| [domains/](domains/) | Per-domain deep dives (expand as modules land) |
| [PROJECT_STATE.md](PROJECT_STATE.md) | Current sprint status and completion report |

---

## How to use this docs set

1. **Before coding** — Read vision, SRS (relevant sections), architecture, and folder structure.
2. **During design** — Record non-trivial choices as ADRs under `decisions/`.
3. **During implementation** — Keep structure and standards; update SRS/architecture when scope changes.
4. **After delivery** — Update roadmap status and domain docs.

---

## Change control

- Docs changes require Architect review for architecture, SRS, structure, and governance.
- Feature PRs that change behavior **must** update the relevant docs in the same PR (or a linked docs PR).
- ADRs are append-only: supersede, do not delete.

---

## Project identity

| Field | Value |
|-------|--------|
| Product name | MarineOps |
| Working title | Marine Operations Platform |
| Repo root | `MarineOps/` |
| Docs root | `MarineOps/docs/` |