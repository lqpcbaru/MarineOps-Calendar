import type { ReactNode, HTMLAttributes } from 'react';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

/**
 * Standard section heading — a calm uppercase eyebrow rather than a
 * heavy h2, so page structure reads as a hierarchy, not a stack of titles.
 */
export function SectionTitle({ children, className = '', ...rest }: SectionTitleProps) {
  return (
    <h2 className={`section-heading ${className}`} {...rest}>
      {children}
    </h2>
  );
}
