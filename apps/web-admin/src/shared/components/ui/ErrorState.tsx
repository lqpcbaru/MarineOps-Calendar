import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Ralat Sistem',
  message = 'Maklumat tidak dapat dimuatkan. Sila cuba sebentar lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-md border border-danger-border bg-danger-bg p-5">
      <h2 className="text-base font-semibold text-danger-text">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <AppButton variant="secondary" className="mt-3" onClick={onRetry}>
          Cuba Semula
        </AppButton>
      ) : null}
    </div>
  );
}
