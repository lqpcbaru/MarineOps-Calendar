/**
 * Assemble the single static output Vercel serves.
 *
 * The two SPAs must share ONE origin so that:
 *   - the relative /api/... calls resolve without CORS preflight, and
 *   - the httpOnly refresh cookie (path /api/v1/auth) is sent same-origin.
 *
 * This mirrors infrastructure/docker/Dockerfile.web, which copies the admin
 * bundle UNDER the public root so one static site serves:
 *   /        → apps/web-public (public portal)
 *   /admin/  → apps/web-admin  (admin portal, built with base=/admin/)
 *
 * Run after `pnpm build`; Vercel's outputDirectory is apps/web-public/dist.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const PUBLIC_DIST = 'apps/web-public/dist';
const ADMIN_DIST = 'apps/web-admin/dist';
const TARGET = `${PUBLIC_DIST}/admin`;

if (!existsSync(`${PUBLIC_DIST}/index.html`)) {
  throw new Error(`${PUBLIC_DIST}/index.html missing — run \`pnpm build\` first`);
}
if (!existsSync(`${ADMIN_DIST}/index.html`)) {
  throw new Error(`${ADMIN_DIST}/index.html missing — run \`pnpm build\` first`);
}

await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });
await cp(ADMIN_DIST, TARGET, { recursive: true });

console.log(`Assembled Vercel static output: ${PUBLIC_DIST} (admin portal at ${TARGET}/)`);
