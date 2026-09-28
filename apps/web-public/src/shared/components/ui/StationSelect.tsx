import type { SelectHTMLAttributes } from 'react';

interface StationSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  stations: { id: string; code: string; name: string }[];
}

/**
 * Consistent station selector used by station-dependent pages.
 */
export function StationSelect({ stations, className = '', ...rest }: StationSelectProps) {
  return (
    <select
      className={`h-10 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-text-primary focus:border-ocean-400 focus:outline-none sm:w-72 ${className}`}
      {...rest}
    >
      {stations.map((station) => (
        <option key={station.id} value={station.id}>
          {station.code} — {station.name}
        </option>
      ))}
    </select>
  );
}
