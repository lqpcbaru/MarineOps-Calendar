import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Query validation for the PUBLIC, unauthenticated vessel endpoints.
 *
 * These parameters are forwarded to Global Fishing Watch as upstream query
 * values (`limit`/`offset`) and are also folded into the cache key, so
 * leaving them unbounded gave an anonymous caller two levers:
 *   - amplification: `?pageSize=100000` becomes `limit=100000` against a
 *     rate-limited third-party API we pay for in quota;
 *   - unbounded cache-key growth: every distinct page/pageSize pair mints
 *     a new entry, so a loop over the parameter space grows the cache
 *     without bound (an in-memory Map until the process dies, or Redis
 *     key bloat).
 * Non-numeric input was equally unchecked — `?page=abc` produced
 * `offset=NaN` in the upstream request.
 *
 * `pageSize` is capped at 100 to match listStationsQuerySchema and the
 * other public list endpoints.
 */
export const searchVesselsQuerySchema = z.object({
  // Bounded rather than required: an empty query is the existing
  // behaviour and is preserved deliberately; only its length is capped.
  q: z.string().max(200).optional().default(''),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type SearchVesselsQuery = z.infer<typeof searchVesselsQuerySchema>;

/**
 * Both bounds stay optional — omitting them means "no date filter", which
 * is what the Public Portal does. They are only format-checked when
 * present, so an arbitrary string can't reach the upstream query.
 */
export const vesselEventsQuerySchema = z.object({
  dateFrom: z.string().regex(DATE_RE, 'dateFrom mestilah dalam format YYYY-MM-DD').optional(),
  dateTo: z.string().regex(DATE_RE, 'dateTo mestilah dalam format YYYY-MM-DD').optional(),
});
export type VesselEventsQuery = z.infer<typeof vesselEventsQuerySchema>;
