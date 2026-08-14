import { ValidationError } from './index';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Operational timezone. All "today" / calendar-date logic must use this, not the server TZ. */
export const OPERATIONAL_TIME_ZONE = 'Asia/Kuala_Lumpur';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OPERATIONAL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Formats an instant (Date) as a YYYY-MM-DD calendar string in the
 * operational timezone (Asia/Kuala_Lumpur), independent of the server
 * process/OS timezone.
 */
export function toLocalDateString(date: Date): string {
  // en-CA yields YYYY-MM-DD.
  return dateFormatter.format(date);
}

/**
 * Returns the current calendar date (YYYY-MM-DD) in the operational
 * timezone (Asia/Kuala_Lumpur).
 */
export function localToday(): string {
  return toLocalDateString(new Date());
}

interface CalendarDate {
  year: number;
  month: number; // 1-based
  day: number; // 1-based
}

function parseCalendarDateParts(value: string): CalendarDate {
  const [year, month, day] = value.split('-').map(Number);
  return {
    year: year ?? 0,
    month: month ?? 1,
    day: day ?? 1,
  };
}

function toDateString(parts: CalendarDate): string {
  const y = parts.year;
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parses a YYYY-MM-DD calendar date. The returned Date is a UTC-midnight
 * representation of that calendar day; callers should use it only for
 * ordering/comparison, never to re-derive a local calendar string.
 * Prefer {@link iterateCalendarDates} for date-range iteration.
 */
export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

/**
 * Returns every calendar date (inclusive) between `dateFrom` and `dateTo`
 * as ordered YYYY-MM-DD strings. Pure calendar arithmetic — no timezone,
 * no UTC drift, no millisecond arithmetic.
 */
export function iterateCalendarDates(dateFrom: string, dateTo: string): string[] {
  const from = parseCalendarDateParts(dateFrom);
  const to = parseCalendarDateParts(dateTo);

  // Reject reversed ranges.
  const cmp = from.year - to.year || from.month - to.month || from.day - to.day;
  if (cmp > 0) return [];

  const dates: string[] = [];
  let year = from.year;
  let month = from.month;
  let day = from.day;

  let safety = 0;
  while (safety < 5000) {
    dates.push(toDateString({ year, month, day }));
    if (year === to.year && month === to.month && day === to.day) {
      break;
    }

    const endOfMonth = daysInMonth(year, month);
    if (day < endOfMonth) {
      day += 1;
    } else {
      day = 1;
      if (month === 12) {
        month = 1;
        year += 1;
      } else {
        month += 1;
      }
    }
    safety += 1;
  }

  return dates;
}

export function validateDateString(value: string | undefined, paramName: string): string {
  if (!value) return localToday();
  if (!DATE_RE.test(value)) {
    throw new ValidationError(`${paramName} mestilah dalam format YYYY-MM-DD`);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`${paramName} bukan tarikh yang sah`);
  }
  return value;
}
