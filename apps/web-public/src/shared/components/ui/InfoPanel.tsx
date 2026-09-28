import type { ReactNode, HTMLAttributes } from 'react';

interface InfoPanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

/**
 * Quiet explanatory callout — visually subordinate to operational data.
 */
export function InfoPanel({ title, children, className = '', ...rest }: InfoPanelProps) {
  return (
    <div
      className={`border-l-2 border-l-border-strong bg-surface-raised/40 px-4 py-3 ${className}`}
      {...rest}
    >
      <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-text-muted">{children}</div>
    </div>
  );
}
