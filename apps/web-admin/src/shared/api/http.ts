import { getAccessToken, notifySessionEnded, setAccessToken } from './session';

/**
 * Error carrying the API's own envelope. DomainExceptionFilter returns
 * `{ code, message, details?, correlationId? }` for every failure, and the
 * login rate limiter returns `{ code: 'RATE_LIMITED', message }` — so the
 * backend's message is almost always the most useful thing to show.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly correlationId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 403 — authenticated but lacking the required permission. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

const AUTH_BASE = '/api/v1/auth';

async function toApiError(res: Response, fallbackMessage: string): Promise<ApiError> {
  let message: string | null = null;
  let code: string | null = null;
  let correlationId: string | null = null;

  try {
    const body = (await res.json()) as unknown;
    if (body && typeof body === 'object') {
      const b = body as { message?: unknown; code?: unknown; correlationId?: unknown };
      if (typeof b.message === 'string' && b.message.trim().length > 0) message = b.message.trim();
      if (typeof b.code === 'string') code = b.code;
      if (typeof b.correlationId === 'string') correlationId = b.correlationId;
    }
  } catch {
    message = null;
  }

  return new ApiError(
    message ?? `${fallbackMessage} (${res.status})`,
    res.status,
    code,
    correlationId,
  );
}

/**
 * Single-flight refresh. Several queries commonly fail with 401 at the same
 * moment (a dashboard fans out); without this they would each rotate the
 * refresh token, and rotation with reuse-detection means the losers of that
 * race present an already-rotated token and get the whole family revoked —
 * logging the user out instead of refreshing them.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${AUTH_BASE}/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { accessToken?: unknown };
      if (typeof body.accessToken !== 'string') return false;
      setAccessToken(body.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so concurrent callers all observe the same
      // settled promise before a fresh attempt becomes possible.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  /** Fallback message when the API returns no readable body. */
  fallbackMessage?: string;
  /** Internal: prevents infinite refresh recursion. */
  retryOn401?: boolean;
}

/**
 * Performs an authenticated `/api/v1` request.
 *
 * On 401 it attempts exactly one silent refresh and replays the request
 * (ROUTES.md §1.3). If the refresh fails the session is ended, which routes
 * the user to /login.
 *
 * Note this is a convenience layer only — the server remains the sole
 * authorization boundary. A 403 is surfaced, never worked around.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, fallbackMessage = 'Permintaan gagal', retryOn401 = true } = options;

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    // Same-origin so the httpOnly refresh cookie is attached on /auth calls.
    credentials: 'same-origin',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && retryOn401 && !path.startsWith(AUTH_BASE)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOn401: false });
    }
    notifySessionEnded();
    throw new ApiError('Sesi tamat. Sila log masuk semula.', 401, 'AUTH_UNAUTHORIZED');
  }

  if (!res.ok) {
    const error = await toApiError(res, fallbackMessage);
    // A 401 that survived the refresh attempt (or came from an auth route)
    // means the session is genuinely over.
    if (res.status === 401 && !path.startsWith(`${AUTH_BASE}/login`)) {
      notifySessionEnded();
    }
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Builds a query string, omitting empty/undefined values. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export { refreshAccessToken };
