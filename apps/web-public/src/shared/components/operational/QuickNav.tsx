import { Link } from '@tanstack/react-router';
import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from '../ui/Icon';

interface QuickNavItem {
  to: string;
  label: string;
  icon: IconName;
}

interface QuickNavProps extends HTMLAttributes<HTMLElement> {
  items: readonly QuickNavItem[];
}

/**
 * Restrained navigation — a compact link list, not oversized icon tiles.
 */
export function QuickNav({ items, className = '', ...rest }: QuickNavProps) {
  return (
    <nav aria-label="Navigasi pantas" className={className} {...rest}>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="group flex items-center gap-2 rounded-sm py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-400"
            >
              <Icon
                name={item.icon}
                size={16}
                className="shrink-0 text-text-muted transition-colors group-hover:text-ocean-400"
              />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
