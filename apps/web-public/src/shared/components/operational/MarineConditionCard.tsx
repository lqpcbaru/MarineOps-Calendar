import type { HTMLAttributes } from 'react';
import { AppCard } from '../ui/AppCard';
import { Icon, type IconName } from '../ui/Icon';

interface MarineConditionCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: IconName;
  title: string;
  value: string;
  subtitle?: string;
}

/**
 * Compact, left-aligned marine metric — information-dense and tabular.
 * Used by all marine modules (tide, weather, wind, wave, etc.).
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
    <AppCard variant="flat" className={`px-4 py-3 ${className}`} {...rest}>
      <div className="flex items-start gap-2.5">
        <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-text-muted" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p>
          <p className="mt-0.5 truncate text-base font-semibold tabular-nums text-text-primary">
            {value}
          </p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
    </AppCard>
  );
}
