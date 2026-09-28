import type { ReactNode, HTMLAttributes } from 'react';

interface MarineSummaryGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

const colClasses: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

/**
 * Responsive grid for marine condition cards.
 * - Mobile: 2 columns
 * - sm+: 3 columns
 * - lg+: 4 columns (when columns=4)
 */
export function MarineSummaryGrid({
  children,
  columns = 4,
  className = '',
  ...rest
}: MarineSummaryGridProps) {
  return (
    <div className={`grid gap-2 ${colClasses[columns]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
