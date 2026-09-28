import type { HTMLAttributes } from 'react';

interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Error component. Left-aligned, clear, actionable.
 */
export function ErrorState({
  title = 'Ralat Sistem',
  message = 'Maklumat tidak dapat dimuatkan. Sila cuba sebentar lagi.',
  onRetry,
  className = '',
  ...rest
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-start justify-center rounded-md border border-danger-border bg-danger-bg px-5 py-8 ${className}`}
      role="alert"
      {...rest}
    >
      <svg
        className="mb-3 h-8 w-8 text-danger-text"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-4">
          Cuba Semula
        </button>
      )}
    </div>
  );
}
