/**
 * In-memory access-token store.
 *
 * ADR-0010 / AUTHENTICATION.md §"Token storage" require the access token to
 * live in **frontend memory only, never localStorage** — and ROUTES.md §1.3
 * describes the guard as checking "an in-memory access token". This module
 * is the single place that holds it.
 *
 * Deliberately NOT persisted anywhere: no localStorage, no sessionStorage,
 * no cookie written by JS. Durability across a page reload comes from the
 * httpOnly refresh cookie (path=/api/v1/auth), which JS cannot read and the
 * browser replays on POST /api/v1/auth/refresh. A hard refresh therefore
 * starts with no access token and silently re-acquires one.
 *
 * It lives outside React so the fetch layer can read it without importing
 * component code (which would be a cycle), while AuthProvider stays the only
 * writer.
 */
let accessToken: string | null = null;

/** Called when the session is definitively over (refresh failed / logout). */
type SessionEndedListener = () => void;
let sessionEndedListener: SessionEndedListener | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Registers the single callback invoked when the session ends. AuthProvider
 * uses it to drop the principal and send the user to /login.
 */
export function onSessionEnded(listener: SessionEndedListener | null): void {
  sessionEndedListener = listener;
}

export function notifySessionEnded(): void {
  accessToken = null;
  sessionEndedListener?.();
}
