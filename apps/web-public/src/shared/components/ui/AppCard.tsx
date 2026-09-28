import type { ReactNode, HTMLAttributes } from 'react';

type AppCardVariant = 'surface' | 'flat' | 'accent' | 'warning' | 'danger';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AppCardVariant;
  children: ReactNode;
}

const variantClasses: Record<AppCardVariant, string> = {
  surface: 'surface',
  flat: 'surface-hairline',
  accent: 'surface border-l-2 border-l-ocean-400',
  warning: 'surface border-l-2 border-l-status-caution',
  danger: 'surface border-l-2 border-l-status-danger',
};

/**
 * Content surface. Defaults to a quiet raised surface with a hairline
 * border rather than a decorative card.
 *
 * Variants:
 * - surface: raised surface, subtle border
 * - flat: hairline-only (no full border)
 * - accent / warning / danger: left semantic rail for alerting content
 */
export function AppCard({ variant = 'surface', children, className = '', ...rest }: AppCardProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
