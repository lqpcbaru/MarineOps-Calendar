import type { HTMLAttributes } from 'react';

interface LegendItem {
  color: 'hijau' | 'kuning' | 'merah';
  label: string;
  description?: string;
}

interface OperationalLegendProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  items?: LegendItem[];
}

const dotClasses: Record<LegendItem['color'], string> = {
  hijau: 'legend-dot-safe',
  kuning: 'legend-dot-caution',
  merah: 'legend-dot-danger',
};

const defaultItems: LegendItem[] = [
  { color: 'hijau', label: 'Sesuai' },
  { color: 'kuning', label: 'Berwaspada' },
  { color: 'merah', label: 'Tidak Disyorkan' },
];

/**
 * Reusable legend explaining status colours (green / yellow / red).
 */
export function OperationalLegend({
  title = 'Petunjuk Status',
  items = defaultItems,
  className = '',
  ...rest
}: OperationalLegendProps) {
  return (
    <div className={className} {...rest}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2" role="list">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span className={`legend-dot mt-1 ${dotClasses[item.color]}`} aria-hidden="true" />
            <span className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{item.label}</span>
              {item.description && (
                <span className="block text-xs text-text-muted">{item.description}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
