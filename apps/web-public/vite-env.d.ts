/// <reference types="vite/client" />

// This app intentionally consumes NO build-time environment variables.
// It calls the API through relative `/api/public/*` paths — proxied to
// localhost:3000 by vite.config.ts in development, and served from the
// same origin by the reverse proxy in production
// (infrastructure/docker/nginx.conf). Same-origin means no CORS
// preflight and nothing to configure per environment.
//
// A `VITE_API_URL` was previously declared here and in a local
// .env.example. Nothing read it, and it pointed at /api/v1 — the
// authenticated ADMIN surface, which the public portal never calls.
// Do not reintroduce an API-URL variable without also changing the code
// to actually use it.
