# Domain Model — MarineOps Hub

**Version:** 2.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline (Frozen)  
**Authorised by:** ADR-0011

> **Consolidated.** In the Hub v2.0.0 baseline the domain model is split across two focused documents to avoid duplication and keep a single source of truth:
>
> - **Module dependencies + bounded contexts + aggregates + ownership** → [`MODULE_DEPENDENCY.md`](MODULE_DEPENDENCY.md) (§3 + §4)
> - **Physical entities, relationships, table specs, indexes** → [`../data/ERD.md`](../data/ERD.md)
> - **Ubiquitous language** → [`../requirements/SRS.md`](../requirements/SRS.md) §1.3
> - **Permission catalog** → [`AUTHORIZATION.md`](AUTHORIZATION.md) §4
> - **Data freshness model** → [`API_VERSIONING.md`](API_VERSIONING.md) §5 + `MODULE_DEPENDENCY.md` §3.4

This file is retained as an entry point and redirect. The MarineOps Calendar v1.0.0 DOMAIN_MODEL is preserved at `archive/calendar/architecture/DOMAIN_MODEL.md`.

## Change log

| Version | Date       | Notes                                                                   |
| ------- | ---------- | ----------------------------------------------------------------------- |
| 2.0.0   | 2026-07-31 | Domain model consolidated into MODULE_DEPENDENCY.md + ERD.md (ADR-0011) |
