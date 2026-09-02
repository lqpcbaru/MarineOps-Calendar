type Tone = 'safe' | 'caution' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  safe: 'bg-status-safe/15 text-status-safe',
  caution: 'bg-status-caution/15 text-status-caution',
  danger: 'bg-status-danger/15 text-status-danger',
  neutral: 'bg-marine-600 text-text-secondary',
};

export interface StatusBadgeProps {
  tone?: Tone;
  children: React.ReactNode;
}

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
