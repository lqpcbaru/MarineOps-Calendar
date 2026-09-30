import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './create-app';

/**
 * Vercel serverless entry point.
 *
 * Vercel's Node.js runtime invokes a function with Node's native
 * `(req, res)` signature. NestJS's Express adapter exposes the underlying
 * Express app via `getHttpAdapter().getInstance()`, which is itself a
 * `(req, res, next)` handler — so we initialise the Nest application once
 * (reused across warm invocations) and delegate each request straight to
 * Express.
 *
 * IMPORTANT — why `app.init()` and not `app.listen()`:
 *   - `app.listen()` binds a TCP socket, which a serverless runtime must
 *     not do (and cannot — the runtime owns the socket).
 *   - `app.init()` runs the same module/dependency-injection bootstrap and
 *     calls every `onModuleInit` hook (including PrismaService's
 *     `$connect()`), but leaves socket ownership to Vercel.
 *
 * IMPORTANT — why this file is built by `nest build` (tsc) rather than
 * compiled from source by Vercel's esbuild-based builder:
 *   NestJS relies on `emitDecoratorMetadata`, which esbuild does not emit.
 *   tsc (via `nest build`) emits it correctly, so the Vercel function must
 *   load the compiled `dist/vercel.js` output rather than be transpiled
 *   from `.ts` by the platform.
 */

let appPromise: Promise<NestExpressApplication> | null = null;

function getApp(): Promise<NestExpressApplication> {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  const express = app.getHttpAdapter().getInstance();
  express(req, res);
}
