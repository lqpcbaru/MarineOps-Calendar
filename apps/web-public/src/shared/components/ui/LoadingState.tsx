import type { HTMLAttributes } from 'react';

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

/**
 * Skeleton loading state. No spinner — pulsing placeholder blocks.
 */
export function LoadingState({ lines = 3, className = '', ...rest }: LoadingStateProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Memuatkan..." {...rest}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-sm bg-marine-800"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
      <span className="sr-only">Memuatkan...</span>
    </div>
  );
}
