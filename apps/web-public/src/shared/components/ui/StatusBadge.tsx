import type { ReactNode, HTMLAttributes } from 'react';

type StatusBadgeVariant = 'hijau' | 'kuning' | 'merah' | 'neutral';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  hijau: 'status-badge-safe',
  kuning: 'status-badge-caution',
  merah: 'status-badge-danger',
  neutral: 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border border-marine-600 text-text-secondary',
};

const dotClasses: Record<StatusBadgeVariant, string> = {
  hijau: 'bg-status-safe',
  kuning: 'bg-status-caution',
  merah: 'bg-status-danger',
  neutral: 'bg-text-muted',
};

/**
 * Status badge with semantic colours.
 *
 * Variants:
 * - hijau: Sesuai / safe
 * - kuning: Berwaspada / caution
 * - merah: Tidak Disyorkan / danger
 * - neutral: no semantic meaning
 */
export function StatusBadge({ variant = 'neutral', children, className = '', ...rest }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${variantClasses[variant]} ${className}`} {...rest}>
      <span className={`h-2 w-2 rounded-full ${dotClasses[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
}
