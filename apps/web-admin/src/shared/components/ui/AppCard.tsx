import type { HTMLAttributes } from 'react';

/** Standard panel surface. */
export function AppCard({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card p-4 sm:p-5 ${className}`} {...rest} />;
}
