import type { HTMLAttributes } from 'react';
import { AppCard } from '../ui/AppCard';
import { Icon, type IconName } from '../ui/Icon';

type RecommendationVariant = 'placeholder' | 'warning' | 'information';

interface OperationalRecommendationCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: RecommendationVariant;
  title?: string;
  message?: string;
}

const config: Record<
  RecommendationVariant,
  {
    icon: IconName;
    defaultTitle: string;
    defaultMessage: string;
    cardVariant: 'flat' | 'warning' | 'accent';
  }
> = {
  placeholder: {
    icon: 'info',
    defaultTitle: 'Cadangan Operasi',
    defaultMessage: 'Maklumat operasi akan dipaparkan di sini.',
    cardVariant: 'flat',
  },
  warning: {
    icon: 'alert',
    defaultTitle: 'Amaran Operasi',
    defaultMessage: 'Sila ambil perhatian terhadap keadaan semasa sebelum beroperasi.',
    cardVariant: 'warning',
  },
  information: {
    icon: 'info',
    defaultTitle: 'Maklumat Operasi',
    defaultMessage: 'Maklumat tambahan berkaitan operasi akan dipaparkan di sini.',
    cardVariant: 'accent',
  },
};

/**
 * Operational recommendation, surfaced with a left semantic rail.
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
    <AppCard variant={cfg.cardVariant} className={`px-4 py-3 ${className}`} {...rest}>
      <div className="flex items-start gap-2.5">
        <Icon name={cfg.icon} size={18} className="mt-0.5 shrink-0 text-text-muted" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title ?? cfg.defaultTitle}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
            {message ?? cfg.defaultMessage}
          </p>
        </div>
      </div>
    </AppCard>
  );
}
