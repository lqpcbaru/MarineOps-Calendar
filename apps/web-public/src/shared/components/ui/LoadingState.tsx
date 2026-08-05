import type { HTMLAttributes } from 'react';

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

/**
 * Simple skeleton loading state.
 * No spinner — uses pulsing placeholder blocks.
 */
export function LoadingState({ lines = 3, className = '', ...rest }: LoadingStateProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Memuatkan..." {...rest}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-marine-700"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
      <span className="sr-only">Memuatkan...</span>
    </div>
  );
}
