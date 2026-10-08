import type { HTMLAttributes } from 'react';

interface MarineConditionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  subtitle?: string;
  /** Retained for backward compatibility; no longer rendered. */
  icon?: string;
}

/**
 * A single marine metric rendered as a clean editorial datum — a muted label
 * over a large tabular value, separated by hairline dividers rather than
 * boxed into individual cards. Used by all marine modules.
 */
export function MarineConditionCard({
  title,
  value,
  subtitle,
  className = '',
  ...rest
}: MarineConditionCardProps) {
  return (
    <div className={`bg-surface-raised px-4 py-3 ${className}`} {...rest}>
      <p className="text-xs text-text-muted">{title}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
    </div>
  );
}
