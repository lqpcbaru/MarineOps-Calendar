# ADR-0013: Playwright MCP as a Pinned Alpha Tooling Dependency

**Date:** 2026-09-18  
**Status:** Proposed  
**Deciders:** Chief Software Architect  
**Related:** ADR-0009 (technology stack reconfirmation), `CLAUDE.md` (tooling ownership table)

---

## Context

Browser-level UI verification is currently manual. `apps/web-public` has Vitest and Testing
Library for unit and component tests, and `apps/api` has a Vitest e2e config, but nothing
drives a real browser. `tests/e2e/` exists and is empty.

To let an AI agent verify UI changes in a real browser rather than assuming them, the
Playwright MCP server (`@playwright/mcp`) is registered at project scope in `.mcp.json`.

The dependency was initially installed globally on one developer machine and referenced by
absolute path (`C:\Users\<user>\AppData\Roaming\npm\...`). That is not portable, leaks a
machine username into a tracked file, and breaks for any other clone or CI runner. Moving it
into the workspace fixes all three, but forces a decision about what it drags in.

**`@playwright/mcp@0.0.81` depends on `playwright@1.64.0-alpha-2026-09-14` and
`playwright-core@1.64.0-alpha-2026-09-14` — alpha builds.** The MCP package is itself
pre-1.0 (`0.0.x`), meaning its public surface may change without semver protection.

This is a deliberate decision to record rather than an implementation detail: it introduces
an alpha-versioned transitive dependency into the lockfile of a system that handles
VMS/AIS fisheries data.

## Decision

1. Add `@playwright/mcp` to **root** `devDependencies` at an **exact** pin, `0.0.81`.
   No `^`, no `~`. Under semver, `^0.0.81` is already exact for `0.0.x`; the bare version is
   used so the intent is explicit to readers rather than implied by a semver subtlety.
2. Keep the server **project-scoped** in `.mcp.json`, not user-scoped, so its 26 tools load
   only in this repository.
3. Invoke it as `node node_modules/@playwright/mcp/cli.js`, resolved relative to the
   repository root, rather than via `pnpm exec` or `npx`.
4. Run with `--isolated` and `--browser chrome`.
5. Confine it to **development tooling**. It is not imported by application code, not part of
   `pnpm build`, and not a runtime dependency of any deployable artifact.

## Consequences

### Positive

- No machine-specific absolute path or username in a tracked file.
- Version is locked for every developer and for CI; no drift between machines.
- Project scoping keeps agent context cost out of unrelated repositories.
- `--isolated` uses a throwaway browser profile, so automated runs never touch a real Chrome
  profile, its cookies or its logged-in sessions. This matters given the data this system handles.
- `node <relative path>` avoids both the `npx` registry round-trip (which timed out the
  30-second MCP health check twice during setup) and Windows `.CMD`/`.ps1` shim resolution.

### Negative / trade-offs

- **An alpha dependency enters `pnpm-lock.yaml`.** Alpha builds may be yanked, may change
  behaviour without notice, and carry a wider supply-chain surface than a stable release.
  Mitigated by the exact pin and by dev-only confinement, not eliminated.
- `0.0.x` gives no semver guarantee; upgrades must be treated as potentially breaking and
  verified manually.
- `--browser chrome` requires Google Chrome installed on every machine that runs it. The
  bundled-Chromium alternative was attempted and **failed to download** (Google CDN timeout,
  twice, on this network), which is why the installed-channel is used. CI would need either
  Chrome preinstalled or a working Chromium download.
- Adds ~3 packages and a browser-driver dependency chain to install time for all contributors,
  including those who never run browser tests.

## Alternatives considered

| Alternative                                 | Rejected because                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the global install + absolute path     | Not portable; leaks a username into a tracked file; breaks on any other clone or CI runner.                                                                               |
| `npx -y @playwright/mcp@0.0.81`             | Re-resolves from the registry on every launch. Timed out the 30-second MCP health check twice during setup, even with a warm cache.                                       |
| `pnpm exec playwright-mcp`                  | Works, but adds a pnpm process startup per launch and relies on Windows shim resolution. Retained as the documented fallback if the relative-path form proves unreliable. |
| Wait for a stable `@playwright/mcp` release | No stable release exists; the package is pre-1.0. Waiting leaves browser verification manual indefinitely.                                                                |
| Add to `apps/web-public` instead of root    | `.mcp.json` lives at the repository root, so a root dependency keeps the invocation path short and the tool available to any app.                                         |

## References

- `.mcp.json` — server registration
- `package.json` — root `devDependencies`
- `CLAUDE.md` — tooling ownership table
- `.gitignore` — `.playwright-mcp/` snapshot artifacts
- https://github.com/microsoft/playwright-mcp
