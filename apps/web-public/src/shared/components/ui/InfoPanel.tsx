import type { ReactNode, HTMLAttributes } from 'react';

interface InfoPanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

/**
 * Explanation panel for informational content.
 * Used to describe concepts, terms, or guidance.
 */
export function InfoPanel({ title, children, className = '', ...rest }: InfoPanelProps) {
  return (
    <div className={`info-panel ${className}`} {...rest}>
      <h3 className="info-panel-title">{title}</h3>
      <div className="info-panel-text">{children}</div>
    </div>
  );
}
