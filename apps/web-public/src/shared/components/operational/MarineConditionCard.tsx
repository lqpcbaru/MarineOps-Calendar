import type { HTMLAttributes } from 'react';
import { AppCard } from '../ui/AppCard';

interface MarineConditionCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
}

/**
 * Reusable summary card for a single marine condition.
 * Used by all marine modules (tide, weather, wind, wave, etc.)
 * to display a single data point with icon, title, value, and optional subtitle.
 */
export function MarineConditionCard({
  icon,
  title,
  value,
  subtitle,
  className = '',
  ...rest
}: MarineConditionCardProps) {
  return (
    <AppCard variant="flat" className={`text-center ${className}`} {...rest}>
      <span aria-hidden="true" className="mb-1 block text-2xl">
        {icon}
      </span>
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {title}
      </p>
      <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
      )}
    </AppCard>
  );
}
