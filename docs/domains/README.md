# Domain documentation index

Deep-dive specs per bounded context. Create a file when a module moves from planned to active design/implementation.

| Domain | Doc | Phase |
|--------|-----|-------|
| Authentication | *TBD* `authentication.md` | 1 |
| Users | *TBD* `users.md` | 1 |
| Stations | *TBD* `stations.md` | 1 |
| Marine Calendar | *TBD* `marine-calendar.md` | 1 |
| Tide | *TBD* `tide.md` | 1 |
| Moon Phase | *TBD* `moon-phase.md` | 1 |
| Hijri Calendar | *TBD* `hijri-calendar.md` | 1 |
| Weather | *TBD* `weather.md` | 1 |
| Wind | *TBD* `wind.md` | 1 |
| Wave | *TBD* `wave.md` | 1 |
| Sunrise/Sunset | *TBD* `sunrise-sunset.md` | 1 |
| Dashboard | *TBD* `dashboard.md` | 1 |
| Patrol Planner | *TBD* `patrol-planner.md` | 1 |
| Notifications | *TBD* `notifications.md` | 2 |
| Reports | *TBD* `reports.md` | 2 |
| Settings | *TBD* `settings.md` | 1 |
| Audit | *TBD* `audit.md` | 1 |

Until a deep-dive exists, use:

- `docs/architecture/DOMAIN_MODEL.md`  
- `docs/requirements/SRS.md`  

## Template for a domain doc

1. Scope & non-scope  
2. Aggregates & invariants  
3. Use-cases (map to SRS IDs)  
4. Published ports (inbound/outbound)  
5. Events emitted/consumed  
6. Permissions  
7. Persistence notes (or "no persistence — pure computation")  
8. Open questions