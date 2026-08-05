import type { ReactNode, HTMLAttributes } from 'react';

interface MarineSummaryGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

const colClasses: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

/**
 * Responsive grid for marine condition cards.
 * Wraps MarineConditionCard or AppCard in a consistent grid layout.
 *
 * - Mobile: always 2 columns
 * - Tablet (sm+): 3 or 4 columns depending on `columns` prop
 */
export function MarineSummaryGrid({
  children,
  columns = 4,
  className = '',
  ...rest
}: MarineSummaryGridProps) {
  return (
    <div className={`grid gap-3 ${colClasses[columns]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
