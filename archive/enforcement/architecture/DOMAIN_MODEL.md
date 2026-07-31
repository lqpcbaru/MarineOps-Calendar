# Domain Model — MarineOps

**Version:** 0.1.0  
**Last updated:** 2026-07-27  

---

## 1. Purpose

Defines ubiquitous language and aggregate boundaries for MarineOps. Implementation must use these names in code and APIs unless an ADR renames them.

---

## 2. Ubiquitous language

| Term | Meaning |
|------|---------|
| Organization | Legal/ops boundary owning users and vessels |
| User | Authenticated person with roles |
| Role | Named set of permissions |
| Permission | Fine-grained action (e.g. `workorder.close`) |
| Vessel | Tracked marine asset |
| VesselStatus | Operational state of a vessel |
| WorkOrder | Unit of work against vessel or org |
| WorkOrderStatus | Lifecycle state of a work order |
| Priority | Business urgency of a work order |
| WorkOrderType | Category (corrective, inspection, etc.) |
| ChecklistTemplate | Reusable list of required checks |
| ChecklistInstance | Filled checklist on a work order |
| Evidence | File or structured proof attached to work |
| AuditEvent | Record of a significant state change |
| Assignment | Link of user(s) to a work order |

---

## 3. Context map

```
[Identity] ──provides principal──► [all modules]
[Fleet] ◄──references vesselId── [WorkManagement]
[WorkManagement] ──requires──► [Compliance] (close policies)
[WorkManagement] ──stores files via──► [Files]
[all modules] ──emit──► [Audit]
[WorkManagement/Fleet] ──events──► [Notifications]
[Reporting] ──reads projections from──► events / queries
```

---

## 4. Aggregates (logical)

### 4.1 Identity

- **User** (root): id, email, name, status, roleIds  
- **Role** (root): id, name, permissionCodes  

Invariants:

- Disabled users cannot authenticate  
- Roles only grant known permission codes  

### 4.2 Fleet

- **Vessel** (root): id, organizationId, name, externalIds (IMO/MMSI/local), type, status, metadata  

Invariants:

- Unique business key per organization (define: name or IMO)  
- Cannot hard-delete if WorkOrders reference vessel  

### 4.3 WorkManagement

- **WorkOrder** (root): id, vesselId?, title, description, type, priority, status, dueAt, assignees, createdBy  
- **WorkOrderComment** (entity): id, body, authorId, createdAt  

Invariants:

- Status transitions only via allowed graph  
- Assignee must be active user  
- Closed WO cannot accept new substantive edits without reopen policy  

### 4.4 Compliance

- **ChecklistTemplate** (root): id, name, items[]  
- **ChecklistInstance** (root): id, workOrderId, templateId, results[]  

Invariants:

- Required items must be satisfied before WO close when linked  

### 4.5 Files

- **FileObject** (root): id, storageKey, contentType, size, uploadedBy, linkedEntity  

### 4.6 Audit

- **AuditEvent** (root, append-only): id, actorId, action, entityType, entityId, at, payload  

Invariants:

- No update/delete of audit rows in application paths  

---

## 5. Work order status model (canonical)

```
Draft ──► Open ──► InProgress ──► Completed ──► Closed
              │         │
              └─────────┴──► Blocked ──► InProgress | Open
```

- **Cancel** may be modeled as terminal status `Cancelled` from Open/InProgress/Blocked (confirm in implementation).  
- Reopen rules: Admin/Ops only; always audited.  

Refine transition matrix in `docs/domains/work-management.md` when module is built.

---

## 6. Domain events (initial catalog)

| Event | Payload (conceptual) | Consumers |
|-------|----------------------|-----------|
| UserDisabled | userId | Identity, Notifications |
| VesselStatusChanged | vesselId, from, to | Reporting, Notifications |
| WorkOrderCreated | workOrderId, vesselId | Audit, Reporting |
| WorkOrderAssigned | workOrderId, assigneeIds | Notifications |
| WorkOrderStatusChanged | workOrderId, from, to | Audit, Notifications, Reporting |
| WorkOrderClosed | workOrderId | Compliance, Reporting |
| EvidenceAttached | workOrderId, fileId | Audit |

---

## 7. Permission catalog (seed)

Exact codes may expand; keep stable strings.

| Code | Description |
|------|-------------|
| `user.manage` | Manage users |
| `role.manage` | Manage roles |
| `vessel.read` | View vessels |
| `vessel.write` | Create/update vessels |
| `workorder.read` | View work orders |
| `workorder.write` | Create/edit work orders |
| `workorder.assign` | Assign work orders |
| `workorder.transition` | Change status |
| `workorder.close` | Close work orders |
| `checklist.manage` | Manage templates |
| `checklist.complete` | Complete instances |
| `evidence.upload` | Upload files |
| `audit.read` | Read audit trail |
| `admin.reference` | Manage reference data |
| `dashboard.read` | View dashboards |
| `report.export` | Export reports |

Map roles (Admin, Ops, Superintendent, Vessel, HSEQ, Auditor) to subsets in Identity module config.

---

## 8. Modeling rules for engineers

1. One aggregate root per transaction boundary when possible.  
2. Reference other contexts by ID, not by embedding full aggregates.  
3. Put business rules in domain; not only in UI.  
4. Name classes and tables after ubiquitous language.  
5. Document new aggregates under `docs/domains/`.  

---

## 9. Change log

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-27 | Initial domain model |