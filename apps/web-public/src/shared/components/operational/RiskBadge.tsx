import type { HTMLAttributes } from 'react';
import { StatusBadge } from '../ui/StatusBadge';

type RiskLevel = 'rendah' | 'sederhana' | 'tinggi';

interface RiskBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel;
}

const levelConfig: Record<RiskLevel, { label: string; variant: 'hijau' | 'kuning' | 'merah' }> = {
  rendah: { label: 'Rendah', variant: 'hijau' },
  sederhana: { label: 'Sederhana', variant: 'kuning' },
  tinggi: { label: 'Tinggi', variant: 'merah' },
};

/**
 * Displays risk level using the existing StatusBadge internally.
 *
 * Levels:
 * - rendah: green (low risk)
 * - sederhana: yellow (moderate risk)
 * - tinggi: red (high risk)
 */
export function RiskBadge({ level, className = '', ...rest }: RiskBadgeProps) {
  const config = levelConfig[level];

  return (
    <StatusBadge variant={config.variant} className={className} {...rest}>
      {config.label}
    </StatusBadge>
  );
}
