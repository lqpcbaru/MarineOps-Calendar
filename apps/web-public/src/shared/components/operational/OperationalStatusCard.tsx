import type { HTMLAttributes } from 'react';

type StatusVariant = 'hijau' | 'kuning' | 'merah' | 'neutral';

interface OperationalStatusCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant;
  title?: string;
  subtitle?: string;
  /** Optional secondary metric shown on the right of the banner. */
  metricLabel?: string;
  metricValue?: string;
}

const defaultTitle: Record<StatusVariant, string> = {
  hijau: 'Sesuai Beroperasi',
  kuning: 'Berwaspada',
  merah: 'Tidak Disyorkan',
  neutral: 'Tiada Status',
};

const railClasses: Record<StatusVariant, string> = {
  hijau: 'bg-status-safe',
  kuning: 'bg-status-caution',
  merah: 'bg-status-danger',
  neutral: 'bg-text-muted',
};

const titleClasses: Record<StatusVariant, string> = {
  hijau: 'text-safe-text',
  kuning: 'text-caution-text',
  merah: 'text-danger-text',
  neutral: 'text-text-primary',
};

/**
 * The page's operational hero: a horizontal status banner with a left
 * semantic rail, status title, reason, and an optional score metric.
 */
export function OperationalStatusCard({
  variant = 'neutral',
  title,
  subtitle = 'Maklumat status operasi akan dipaparkan di sini.',
  metricLabel,
  metricValue,
  className = '',
  ...rest
}: OperationalStatusCardProps) {
  const displayTitle = title ?? defaultTitle[variant];

  return (
    <div
      className={`flex overflow-hidden rounded-md border border-border-subtle bg-surface-raised ${className}`}
      role="status"
      {...rest}
    >
      <div className={`w-1 shrink-0 ${railClasses[variant]}`} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-base font-semibold ${titleClasses[variant]}`}>{displayTitle}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
        </div>
        {metricLabel && metricValue ? (
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-text-muted">{metricLabel}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-text-primary">
              {metricValue}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
