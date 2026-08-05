import type { HTMLAttributes } from 'react';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
}

/**
 * Professional empty-state message in Bahasa Melayu.
 * Never uses "Coming Soon" or English placeholders.
 */
export function EmptyState({
  title = 'Tiada Maklumat',
  message = 'Maklumat akan dipaparkan selepas modul ini disepadukan.',
  className = '',
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-marine-600 px-6 py-12 text-center ${className}`}
      role="status"
      {...rest}
    >
      <svg
        className="mb-3 h-10 w-10 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{message}</p>
    </div>
  );
}
