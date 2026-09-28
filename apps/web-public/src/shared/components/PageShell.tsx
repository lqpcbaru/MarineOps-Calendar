import type { ReactNode, HTMLAttributes } from 'react';

type PageShellWidth = 'narrow' | 'default' | 'wide';

interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Content width. narrow=64rem (focus pages), default=72rem, wide=80rem. */
  width?: PageShellWidth;
}

const widthClasses: Record<PageShellWidth, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

/**
 * Standard page container — single source of truth for horizontal rhythm.
 * Every page should wrap its content in this rather than hand-writing
 * `mx-auto max-w-* px-* py-*`.
 */
export function PageShell({
  children,
  width = 'default',
  className = '',
  ...rest
}: PageShellProps) {
  return (
    <div
      className={`mx-auto w-full ${widthClasses[width]} px-4 py-6 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
