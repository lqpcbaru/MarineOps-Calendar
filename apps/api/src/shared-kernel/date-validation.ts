import { ValidationError } from './index';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateString(value: string | undefined, paramName: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(value)) {
    throw new ValidationError(`${paramName} mestilah dalam format YYYY-MM-DD`);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`${paramName} bukan tarikh yang sah`);
  }
  return value;
}
