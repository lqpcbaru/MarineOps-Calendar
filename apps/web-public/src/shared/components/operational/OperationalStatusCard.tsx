import type { HTMLAttributes } from 'react';
import { AppCard } from '../ui/AppCard';

type StatusVariant = 'hijau' | 'kuning' | 'merah' | 'neutral';

interface OperationalStatusCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant;
  title?: string;
  subtitle?: string;
}

const statusConfig: Record<StatusVariant, { icon: string; defaultTitle: string }> = {
  hijau: { icon: '🟢', defaultTitle: 'Sesuai Beroperasi' },
  kuning: { icon: '🟡', defaultTitle: 'Berwaspada' },
  merah: { icon: '🔴', defaultTitle: 'Tidak Disyorkan' },
  neutral: { icon: '⚪', defaultTitle: 'Tiada Status' },
};

const borderClasses: Record<StatusVariant, string> = {
  hijau: 'status-card-safe',
  kuning: 'status-card-caution',
  merah: 'status-card-danger',
  neutral: '',
};

/**
 * Displays the current operational status as a large card.
 * Shared by all marine modules for consistent status display.
 *
 * Variants:
 * - hijau: Sesuai Beroperasi
 * - kuning: Berwaspada
 * - merah: Tidak Disyorkan
 * - neutral: Tiada Status
 */
export function OperationalStatusCard({
  variant = 'neutral',
  title,
  subtitle = 'Maklumat status operasi akan dipaparkan di sini.',
  className = '',
  ...rest
}: OperationalStatusCardProps) {
  const config = statusConfig[variant];
  const displayTitle = title ?? config.defaultTitle;

  return (
    <AppCard
      variant="flat"
      className={`status-card ${borderClasses[variant]} ${className}`}
      role="status"
      {...rest}
    >
      <div className="status-card-icon" aria-hidden="true">
        {config.icon}
      </div>
      <p className="status-card-title">{displayTitle}</p>
      <p className="status-card-subtitle">{subtitle}</p>
    </AppCard>
  );
}
