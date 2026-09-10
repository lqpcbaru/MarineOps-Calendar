import { AppCard } from '../../shared/components/ui/AppCard';
import { AppButton } from '../../shared/components/ui/AppButton';

export interface RouteErrorPageProps {
  error?: Error;
}

/**
 * Router-level error boundary. Catches render/loader failures that would
 * otherwise blank the whole app.
 */
export function RouteErrorPage({ error }: RouteErrorPageProps) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <AppCard className="border-danger-400/40">
        <h1 className="text-xl font-semibold text-danger-400">Ralat Sistem</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Berlaku ralat tidak dijangka semasa memaparkan halaman ini.
        </p>
        {error?.message ? (
          <p className="mt-2 break-words text-xs text-text-muted">{error.message}</p>
        ) : null}
        <AppButton variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
          Muat Semula
        </AppButton>
      </AppCard>
    </div>
  );
}
