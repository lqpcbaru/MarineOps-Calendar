# Domain documentation index

Deep-dive specs per bounded context. Create a file when a module moves from planned to active design/implementation.

| Domain | Doc | Phase |
|--------|-----|-------|
| Identity | *TBD* `identity.md` | 1 |
| Fleet | *TBD* `fleet.md` | 1 |
| Work Management | *TBD* `work-management.md` | 1 |
| Compliance | *TBD* `compliance.md` | 2 |
| Files | *TBD* `files.md` | 2 |
| Audit | *TBD* `audit.md` | 1 |
| Notifications | *TBD* `notifications.md` | 2 |
| Reporting | *TBD* `reporting.md` | 3 |

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
7. Persistence notes  
8. Open questions