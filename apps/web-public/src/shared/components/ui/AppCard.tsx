import type { ReactNode, HTMLAttributes } from 'react';

type AppCardVariant = 'default' | 'flat' | 'highlight' | 'warning';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AppCardVariant;
  children: ReactNode;
}

const variantClasses: Record<AppCardVariant, string> = {
  default: 'card',
  flat: 'card-flat',
  highlight: 'card border-ocean-400/40',
  warning: 'card border-warning-400/40',
};

/**
 * Standard content card.
 *
 * Variants:
 * - default: hover border transition
 * - flat: no hover effect
 * - highlight: accent border (ocean)
 * - warning: caution border (amber)
 */
export function AppCard({ variant = 'default', children, className = '', ...rest }: AppCardProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
