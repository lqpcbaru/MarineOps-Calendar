/**
 * Test helpers that build REAL `Response` objects.
 *
 * The provider specs used to hand-roll `{ ok, status, json }` object
 * literals cast to Response. Those satisfy the type but do not behave like
 * a response: notably they have no `body` stream, so any client code that
 * reads the body as a stream — which ProviderHttpClient does, to enforce
 * its size cap — sees nothing at all. A test double that cannot exhibit
 * the failure it is meant to guard is worse than none, so these build the
 * genuine article and let the real Response implementation supply the
 * behaviour.
 */

/** A successful JSON response, exactly as fetch would return one. */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** A failed response carrying a plain-text body. */
export function errorResponse(status: number, body = ''): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });
}
