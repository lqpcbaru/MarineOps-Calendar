import type { HTMLAttributes } from 'react';
import { AppCard } from '../ui/AppCard';

type RecommendationVariant = 'placeholder' | 'warning' | 'information';

interface OperationalRecommendationCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: RecommendationVariant;
  title?: string;
  message?: string;
}

const config: Record<RecommendationVariant, { icon: string; defaultTitle: string; defaultMessage: string; cardVariant: 'flat' | 'warning' | 'highlight' }> = {
  placeholder: {
    icon: '📋',
    defaultTitle: 'Cadangan Operasi',
    defaultMessage: 'Maklumat operasi akan dipaparkan di sini.',
    cardVariant: 'flat',
  },
  warning: {
    icon: '⚠️',
    defaultTitle: 'Amaran Operasi',
    defaultMessage: 'Sila ambil perhatian terhadap keadaan semasa sebelum beroperasi.',
    cardVariant: 'warning',
  },
  information: {
    icon: 'ℹ️',
    defaultTitle: 'Maklumat Operasi',
    defaultMessage: 'Maklumat tambahan berkaitan operasi akan dipaparkan di sini.',
    cardVariant: 'highlight',
  },
};

/**
 * Displays operational recommendations in a professional card.
 * Used by all marine modules for consistent recommendation display.
 *
 * Variants:
 * - placeholder: default state, no data available
 * - warning: caution needed
 * - information: general information
 */
export function OperationalRecommendationCard({
  variant = 'placeholder',
  title,
  message,
  className = '',
  ...rest
}: OperationalRecommendationCardProps) {
  const cfg = config[variant];

  return (
    <AppCard variant={cfg.cardVariant} className={className} {...rest}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 text-2xl">
          {cfg.icon}
        </span>
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {title ?? cfg.defaultTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {message ?? cfg.defaultMessage}
          </p>
        </div>
      </div>
    </AppCard>
  );
}
