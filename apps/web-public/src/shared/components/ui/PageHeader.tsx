import type { ReactNode, HTMLAttributes } from 'react';

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Consistent page header with title, subtitle, and optional action slot.
 * Titles are restrained — a single clear line, not a marketing hero.
 */
export function PageHeader({ title, subtitle, action, className = '', ...rest }: PageHeaderProps) {
  return (
    <div className={`mb-6 border-b border-border-subtle pb-5 ${className}`} {...rest}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
