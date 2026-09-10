/**
 * Formatting for instants that belong to a station rather than to the
 * reader.
 *
 * The API returns UTC instants. Rendering them raw put
 * "2026-09-03T23:10:00Z" on the page for an 07:10 sunrise — the correct
 * moment, written so that a quick reading says 11pm the previous day. On
 * pages whose only job is telling someone how much daylight they have,
 * that is not a cosmetic problem.
 *
 * The zone comes from the station record rather than the browser, so a
 * planner looking at a Sabah station from anywhere still sees the time
 * that station will actually experience.
 */

/** Malaysia has no daylight saving, but stations carry their own zone. */
const FALLBACK_TIMEZONE = 'Asia/Kuala_Lumpur';

function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
}

/** Renders an ISO instant as a clock time in the station's own zone. */
export function formatStationTime(
  iso: string | null | undefined,
  timezone: string | undefined,
): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  try {
    return formatter(timezone || FALLBACK_TIMEZONE).format(parsed);
  } catch {
    // An unrecognised IANA zone must not blank the page.
    return formatter(FALLBACK_TIMEZONE).format(parsed);
  }
}

/** "PT12H9M" -> "12j 9m". Returns the input unchanged if it is not a duration. */
export function formatDuration(iso: string | null | undefined): string {
  if (!iso) return '—';
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
  if (!match) return iso;
  const [, hours, minutes] = match;
  const parts = [hours ? `${hours}j` : null, minutes ? `${minutes}m` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : iso;
}
