# apps/web

Web client. React 19 + TypeScript + TanStack Router + TanStack Query + Tailwind CSS.

## Structure

```
src/
├── app/                       # Routes / app shell
├── features/
│   ├── auth/                  # Login, profile, role views
│   ├── vessels/               # Vessel list, detail, forms
│   ├── work-orders/           # WO list, detail, create, lifecycle
│   ├── dashboard/             # Ops dashboard
│   ├── admin/                 # Users, roles, reference data
│   └── audit/                 # Audit trail views
├── shared/                    # UI kit, hooks, utilities
├── api/                       # API client layer
└── styles/                    # Global styles, Tailwind config
```

## Rules

- Features map 1:1 to SRS domain areas.
- No business logic in components — use hooks/services.
- API calls go through `src/api/` layer, never directly in components.
- Server-side authZ is authoritative; UI hiding is never the only control.

See `docs/structure/FOLDER_STRUCTURE.md` for full rules.
