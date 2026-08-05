import type { ReactNode, HTMLAttributes } from 'react';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

/**
 * Standard section heading.
 * Consistent typography across all pages.
 */
export function SectionTitle({ children, className = '', ...rest }: SectionTitleProps) {
  return (
    <h2 className={`section-heading ${className}`} {...rest}>
      {children}
    </h2>
  );
}
