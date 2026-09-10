/**
 * How many reverse proxies sit in front of the API.
 *
 * Express uses this to decide which entry of `X-Forwarded-For` is the
 * real client. Getting it wrong is quiet and expensive in both
 * directions:
 *
 * - **Too low.** Each extra proxy appends its own address, so `req.ip`
 *   resolves to a proxy's internal address for every request. The rate
 *   limiters then key on that single value, giving every client one
 *   shared bucket — ten failed sign-ins by anyone locks out everyone.
 *   Measured with Express directly: with two hops in the header and a
 *   count of 1, `req.ip` is the proxy's address, not the client's.
 *
 * - **Too high.** Express starts trusting addresses the client supplied
 *   itself, so anyone can forge `req.ip` by sending their own
 *   `X-Forwarded-For` and step around the rate limiter entirely.
 *
 * It therefore has to match the deployment exactly, which means it
 * cannot be a constant:
 *
 * | Topology                                   | Hops |
 * | ------------------------------------------ | ---- |
 * | web container (nginx) → API                | 1    |
 * | TLS terminator → web container (nginx) → API | 2  |
 * | cloud LB → TLS terminator → nginx → API    | 3    |
 *
 * Count every proxy that appends to `X-Forwarded-For`, not every network
 * device. The default of 1 matches docker-compose.prod.yml on its own;
 * docker-compose.tls.yml raises it to 2 because Caddy adds a hop.
 */

/** Matches the documented single-proxy topology. */
export const DEFAULT_TRUSTED_PROXY_HOPS = 1;

/**
 * Reads TRUSTED_PROXY_HOPS, falling back to the single-proxy default.
 *
 * A malformed value is rejected rather than coerced: silently treating
 * `"two"` as 0 would disable proxy trust altogether and key every rate
 * limit on the proxy's address, which is the failure this setting exists
 * to prevent.
 */
export function resolveTrustedProxyHops(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env['TRUSTED_PROXY_HOPS'];
  if (raw === undefined || raw.trim() === '') return DEFAULT_TRUSTED_PROXY_HOPS;

  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `TRUSTED_PROXY_HOPS must be a positive integer (got "${raw}"). ` +
        'It is the number of reverse proxies that append to X-Forwarded-For: ' +
        '1 for the web container alone, 2 with a TLS terminator in front.',
    );
  }
  return parsed;
}
