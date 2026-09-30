/**
 * Vercel serverless function entry point.
 *
 * Loads the ALREADY-COMPILED NestJS handler at apps/api/dist/vercel.js.
 * This file is intentionally plain CommonJS JavaScript (not TypeScript) so
 * that Vercel's Node.js runtime never transpiles the NestJS application
 * itself: NestJS depends on `emitDecoratorMetadata`, which esbuild (the
 * platform's TypeScript transpiler) does NOT emit — only tsc via
 * `nest build` does. The `pnpm build` step in buildCommand produces
 * dist/vercel.js before Vercel bundles this function.
 *
 * The function is served at /api and receives every request Vercel rewrites
 * from /api/* and /health/* (see vercel.json). Vercel rewrites preserve the
 * original request URL, so NestJS's own global prefix and controllers
 * (/api/public, /api/v1, /health) continue to route exactly as they do
 * behind nginx in the existing Docker deployment.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain CommonJS shim: Vercel expects `module.exports` and dist/vercel.js is CommonJS.
module.exports = require('../apps/api/dist/vercel.js').default;
