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
 * Responsive grid for marine metrics. Cells are separated by hairline
 * dividers (a single bordered surface) rather than floating as individual
 * cards — a calmer, more editorial presentation.
 */
export function MarineSummaryGrid({
  children,
  columns = 4,
  className = '',
  ...rest
}: MarineSummaryGridProps) {
  return (
    <div
      className={`grid ${colClasses[columns]} gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
