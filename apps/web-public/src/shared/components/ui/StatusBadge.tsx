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
  neutral:
    'inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-overlay px-2 py-0.5 text-xs font-semibold text-text-secondary',
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
export function StatusBadge({
  variant = 'neutral',
  children,
  className = '',
  ...rest
}: StatusBadgeProps) {
  return (
    <span className={`status-badge ${variantClasses[variant]} ${className}`} {...rest}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
}
