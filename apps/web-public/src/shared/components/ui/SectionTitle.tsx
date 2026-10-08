import type { ReactNode, HTMLAttributes } from 'react';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

/**
 * Standard section heading — a calm, non-uppercase label that reads as a
 * hierarchy level rather than a loud eyebrow. Restrained editorial tone.
 */
export function SectionTitle({ children, className = '', ...rest }: SectionTitleProps) {
  return (
    <h2 className={`section-heading ${className}`} {...rest}>
      {children}
    </h2>
  );
}
