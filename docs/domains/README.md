# Domain documentation index

Deep-dive specs per bounded context. Create a file when a module moves from proposed to active design/implementation.

> Module list reflects MarineOps Hub (ADR-0011). Calendar v1.0.0 domain docs are preserved under `archive/calendar/domains/`.

## Public-facing modules

| Domain          | Doc                        | Status   |
| --------------- | -------------------------- | -------- |
| Tide            | _TBD_ `tide.md`            | Proposed |
| Marine Weather  | _TBD_ `marine-weather.md`  | Proposed |
| Wind            | _TBD_ `wind.md`            | Proposed |
| Wave            | _TBD_ `wave.md`            | Proposed |
| Moon Phase      | _TBD_ `moon-phase.md`      | Proposed |
| Sunrise/Sunset  | _TBD_ `sunrise-sunset.md`  | Proposed |
| Hijri Calendar  | _TBD_ `hijri-calendar.md`  | Proposed |
| Marine Calendar | _TBD_ `marine-calendar.md` | Proposed |
| Marine Alerts   | _TBD_ `marine-alerts.md`   | Proposed |
| Stations (read) | _TBD_ `stations.md`        | Proposed |
| About           | _TBD_ `about.md`           | Proposed |

## Admin-facing modules

| Domain              | Doc                                         | Status                     |
| ------------------- | ------------------------------------------- | -------------------------- |
| Authentication      | [authentication.md](authentication.md)      | Active (admin-only per §6) |
| Users               | _TBD_ `users.md`                            | Proposed                   |
| Roles & Permissions | _TBD_ `roles.md`                            | Proposed                   |
| Dashboard           | _TBD_ `dashboard.md`                        | Proposed                   |
| Calendar Admin      | _TBD_ `calendar-admin.md`                   | Proposed                   |
| Stations Admin      | _TBD_ `stations.md` (shared with read)      | Proposed                   |
| Alerts Admin        | _TBD_ `marine-alerts.md` (shared with read) | Proposed                   |
| Audit               | _TBD_ `audit.md`                            | Proposed                   |
| Settings            | _TBD_ `settings.md`                         | Proposed                   |

## Future modules (each requires its own ADR before implementation)

| Domain            | Doc                          | Status   |
| ----------------- | ---------------------------- | -------- |
| Patrol Planner    | _TBD_ `patrol-planner.md`    | Deferred |
| AIS               | _TBD_ `ais.md`               | Deferred |
| VMS               | _TBD_ `vms.md`               | Deferred |
| Vessel Monitoring | _TBD_ `vessel-monitoring.md` | Deferred |

Until a deep-dive exists, use:

- `docs/architecture/MODULE_DEPENDENCY.md` (§3 + §4)
- `docs/architecture/SYSTEM_ARCHITECTURE.md`

## Template for a domain doc

1. Scope & non-scope
2. Aggregates & invariants
3. Use-cases (map to SRS IDs)
4. Published ports (inbound/outbound)
5. Events emitted/consumed
6. Permissions
7. Persistence notes (or "no persistence — pure computation")
8. Surface (public / admin / both)
9. Open questions
