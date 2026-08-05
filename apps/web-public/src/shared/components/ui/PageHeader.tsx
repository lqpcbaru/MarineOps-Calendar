import type { ReactNode, HTMLAttributes } from 'react';

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Consistent page header with title, subtitle, and optional action slot.
 * Every page should use this for its top heading area.
 */
export function PageHeader({ title, subtitle, action, className = '', ...rest }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`} {...rest}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-lg text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
