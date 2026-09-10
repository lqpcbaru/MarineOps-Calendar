/// <reference types="vite/client" />

// Like apps/web-public, this app consumes NO build-time environment
// variables. It calls the admin API through relative `/api/v1/*` paths —
// proxied to localhost:3000 by vite.config.ts in development and served
// from the same origin by the reverse proxy in production.
//
// Same-origin is a requirement, not a convenience: the refresh token is an
// httpOnly cookie scoped to path=/api/v1/auth, so the browser only sends it
// when the API is reached on the portal's own origin.
