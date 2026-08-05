# Architecture Decision Records (ADRs)

ADRs capture **significant** decisions that affect structure, stack, security, or cross-module design.

## Rules

1. One decision per file.
2. Number sequentially: `ADR-0001`, `ADR-0002`, …
3. Status: `Proposed` → `Accepted` | `Rejected` | `Superseded by ADR-XXXX`.
4. Never delete Accepted ADRs; supersede instead.
5. Link ADRs from architecture docs when they lock a choice.

## Template

Copy `ADR-0000-template.md`.

## Index

### MarineOps Enforcement (archived — historical reference)

ADRs 0001–0005 were created for the archived MarineOps Enforcement project. They are preserved unmodified under `archive/enforcement/`. They remain valid as historical record only.

| ADR  | Title                           | Status                                                  |
| ---- | ------------------------------- | ------------------------------------------------------- |
| 0001 | Record architecture decisions   | Archived                                                |
| 0002 | Modular monolith first          | Archived                                                |
| 0003 | Docs-first delivery             | Archived                                                |
| 0004 | Technology stack selection      | Archived (stack re-confirmed for Calendar via ADR-0009) |
| 0005 | Product assumptions for Phase 1 | Archived (superseded for active scope)                  |

### MarineOps Calendar (archived — historical reference)

ADRs 0006–0010 were created for the MarineOps Calendar v1.0.0 baseline. They are preserved unmodified under `archive/calendar/`. They remain valid as historical record only; ADR-0011 supersedes their active scope for MarineOps Hub.

| ADR  | Title                                                            | Status                                                                        |
| ---- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 0006 | Project direction change — Enforcement archived, Calendar active | Archived (superseded by 0011 for active scope)                                |
| 0007 | Modular monolith for MarineOps Calendar                          | Archived (mechanics retained for Hub; superseded by 0011)                     |
| 0008 | External data source strategy (tide, weather, sun/moon)          | Archived (mechanics retained for Hub; superseded by 0011)                     |
| 0009 | Technology stack re-confirmation for MarineOps Calendar          | Retained (stack re-confirmed for Hub; not superseded)                         |
| 0010 | Authentication strategy — JWT with refresh rotation              | Archived (mechanics retained for admin surface; superseded by 0011 for scope) |

### MarineOps Hub (active)

| ADR                                                 | Title                                                    | Status                |
| --------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| [0011](ADR-0011-project-direction-change-to-hub.md) | Project direction change — Calendar archived, Hub active | Accepted (2026-07-31) |
