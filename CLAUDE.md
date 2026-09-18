# CLAUDE.md — MarineOps Calendar

## Project rules

@AGENTS.md

`AGENTS.md` is the single source of truth for project rules, authority and required
reading. Do not duplicate those rules here — edit `AGENTS.md` instead.

## Tooling

This repo has a configured tool stack. Each tool has one job; do not substitute one for another.

| Need                         | Use                                                    | Notes                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library / framework API docs | **Context7** MCP (`resolve-library-id` → `query-docs`) | Use before writing code against React, Vite, TanStack Router/Query, Tailwind, Zod, Prisma. Training data lags releases. Never put secrets, `.env` values or proprietary code in a Context7 query — queries go to their API. |
| Browser / UI testing         | **Playwright** MCP (project-scoped, `.mcp.json`)       | Drives installed Chrome with `--isolated` (throwaway profile). Requires one-time approval. Run the app via `.claude/launch.json` → `web-public-preview` (port 4173).                                                        |
| Unit / component tests       | **Vitest** + Testing Library                           | `pnpm test`, or `pnpm --filter @marineops/web-public test`.                                                                                                                                                                 |
| Cross-session memory         | **claude-mem**                                         | Recalls past sessions. It does **not** replace `docs/` — durable decisions go to `docs/decisions/ADR-NNNN-*.md`.                                                                                                            |
| UI / accessibility guidance  | **ui-ux-pro-max** skills                               | Style, palette, typography and WCAG contrast guidance for dashboards.                                                                                                                                                       |
| Workflow discipline          | **superpowers** skills                                 | Enabled for this project only (`.claude/settings.json`). ponytail is disabled here.                                                                                                                                         |
| Code review                  | `/code-review`                                         | Native. Run on the diff before committing.                                                                                                                                                                                  |
| Security review              | `/security-review`                                     | Native. Run before pushing anything touching auth, VMS/AIS data or `.env` handling.                                                                                                                                         |

## Verification before claiming done

Do not report work as complete on the basis of reading code. Before saying a task is done:

1. `pnpm typecheck` and `pnpm lint` pass for the affected package.
2. `pnpm test` passes for the affected package.
3. UI changes are checked in a browser (Playwright MCP or the preview server), not assumed.
4. `docs/governance/DEFINITION_OF_DONE.md` is satisfied.

If a step was skipped or failed, say so explicitly rather than reporting success.

## Secrets

`.env` is real and is git-ignored. Never read, print, copy or paste its contents, and never
include credentials in a prompt, a commit, a Context7 query or a bug report. Use `.env.example`
when documenting configuration.
