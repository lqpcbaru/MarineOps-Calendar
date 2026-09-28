type Tone = 'safe' | 'caution' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  safe: 'bg-safe-bg text-safe-text border border-safe-border',
  caution: 'bg-caution-bg text-caution-text border border-caution-border',
  danger: 'bg-danger-bg text-danger-text border border-danger-border',
  neutral: 'bg-surface-overlay text-text-secondary border border-border-subtle',
};

export interface StatusBadgeProps {
  tone?: Tone;
  children: React.ReactNode;
}

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
