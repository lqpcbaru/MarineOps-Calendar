# ADR-0004: Technology stack selection

**Date:** 2026-07-27  
**Status:** Accepted  
**Deciders:** Chief Software Architect

## Context

The roadmap requires a concrete stack decision before Phase 1 app scaffolding can begin. No team constraints (size, existing skills, cloud provider) have been fixed, so this ADR selects a **sensible default** that aligns with the architecture (modular monolith, DDD, API-first) and can be reconsidered via superseding ADR if stakeholder constraints emerge.

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language / runtime | **TypeScript 5.x on Node.js 22 LTS** | Full-stack type safety; same language for API and web; strong ecosystem |
| API framework | **NestJS** | Native module/controller/provider model maps 1:1 to our DDD module structure; built-in guards, pipes, interceptors for auth, validation, pagination |
| Validation / serialization | **Zod** (DTOs + domain value objects) | Runtime validation with static type inference; avoids duplicate type definitions |
| Database | **PostgreSQL 16** | Mature relational DB; JSONB for flexible vessel metadata; excellent for audit tables; row-level security possible for future multi-tenant |
| ORM / query layer | **Prisma** (migrations + typed client) | Type-safe queries; excellent migration DX; generated types reduce DTO boilerplate. Raw SQL allowed for complex reporting queries. |
| Object storage | **S3-compatible** (AWS S3 / MinIO local) | Industry standard; presigned URLs for secure file access |
| Web client | **React 19 + TypeScript** | Largest ecosystem; aligns with backend TS; good state management options |
| Client routing / data | **TanStack Router + TanStack Query** | Type-safe routing; declarative server-state caching; avoids manual fetch boilerplate |
| CSS / UI | **Tailwind CSS** | Utility-first; rapid iteration; no runtime cost |
| Auth mechanism | **JWT access + refresh tokens stored in httpOnly cookies** | Stateless API; refresh rotation mitigates token theft; httpOnly prevents XSS exfiltration |
| Auth identity | **bcrypt/argon2 local** + **OIDC hook for Phase 2+** | Start simple; architecture supports swapping to external IdP |
| Container runtime | **Docker Compose (dev) / Kubernetes or cloud PaaS (prod)** | Dev consistency; deployment flexibility deferred to infrastructure ADR |
| CI | **GitHub Actions** (or equivalent on chosen forge) | Ubiquitous; sufficient for modular monolith |
| Testing | **Vitest** (unit/integration), **Playwright** (E2E) | Fast, modern, good TS support |
| Linting / formatting | **ESLint + Prettier** | Standard TS tooling |
| Package manager | **pnpm** | Fast, strict, workspaces for monorepo |

## Consequences

### Positive

- Full-stack TypeScript eliminates context-switching between frontend and backend  
- NestJS module system directly enforces the architecture's bounded context boundaries  
- Prisma typed client + Zod validation gives end-to-end type safety from DB to API  
- Default stack is open-source and cloud-agnostic  
- Stack is well-known: easy to hire and onboard  

### Negative / trade-offs

- NestJS is opinionated; module/discovery overhead may feel heavy for very small teams  
- Prisma has a heavier query engine than raw SQL or lighter ORMs (Drizzle, Kysely)  
- `httpOnly` cookie auth complicates Swagger/OpenAPI interactive docs (workaround: bearer token dev mode)  
- JWT statelessness means token revocation requires a blocklist or short TTL + refresh rotation  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Go with Gin/Chi | Two languages (Go + TS for frontend); harder to share types; smaller hiring pool for full-stack marine ops devs |
| Python with FastAPI | Weaker typing than TS; async performance gap; no unified frontend-backend language |
| Express/Fastify raw | Would require hand-rolling module system, DI, guards that NestJS gives for free |
| GraphQL | Added complexity for mostly CRUD + workflow operations; REST is simpler for audit-centric ops |
| Drizzle ORM | Lighter and more SQL-like, but Prisma's migration tooling and ecosystem are more mature as of 2026 |
| MongoDB | Marine ops data is inherently relational (vessels → WOs → evidence → audit); document DB adds accidental complexity |
| Next.js SSR | SSR adds deployment complexity; SPA + API is simpler for Phase 1 internal ops tool; Next.js can be adopted later |
| OIDC from day 1 | External IdP dependency slows local dev; JWT local is zero-setup |

## References

- `docs/architecture/SYSTEM_ARCHITECTURE.md` §12 (technology selection policy)  
- `docs/structure/FOLDER_STRUCTURE.md` (target layout)  
- `docs/roadmap/ROADMAP.md` Phase 0 exit criteria