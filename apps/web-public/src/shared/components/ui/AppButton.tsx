import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type AppButtonSize = 'sm' | 'md';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  children: ReactNode;
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary: 'bg-marine-500 text-white hover:bg-marine-400 border border-transparent',
  secondary: 'bg-surface-overlay text-text-primary hover:bg-marine-700 border border-border-subtle',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-marine-800 border border-transparent',
  danger: 'bg-danger-bg text-danger-text hover:bg-danger-border border border-danger-border',
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: 'min-h-[2.25rem] px-3 text-sm',
  md: 'min-h-[2.75rem] px-5 text-sm',
};

/**
 * Standard button with 44px minimum touch target (md).
 */
export function AppButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: AppButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-400 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
