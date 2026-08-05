import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary:
    'bg-marine-500 text-white hover:bg-marine-400 border border-transparent',
  secondary:
    'bg-marine-800 text-text-primary hover:bg-marine-700 border border-marine-600',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-marine-800 border border-transparent',
  danger:
    'bg-danger-400/10 text-danger-400 hover:bg-danger-400/20 border border-danger-400/30',
};

/**
 * Standard button with large touch targets.
 *
 * Variants:
 * - primary: main action
 * - secondary: alternative action
 * - ghost: subtle action
 * - danger: destructive action
 */
export function AppButton({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: AppButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[2.75rem] items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-400 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
