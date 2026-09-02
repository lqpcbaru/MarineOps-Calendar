import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ocean-400 text-marine-950 hover:bg-ocean-300',
  secondary: 'bg-marine-600 text-text-primary hover:bg-marine-500',
  ghost: 'bg-transparent text-text-secondary hover:bg-marine-700 hover:text-text-primary',
  danger: 'bg-danger-400 text-marine-950 hover:opacity-90',
};

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Primary action button. `type` defaults to "button" so it never submits a form by accident. */
export function AppButton({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[2.5rem] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-400 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  );
}
