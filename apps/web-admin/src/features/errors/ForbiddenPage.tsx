import { Link } from '@tanstack/react-router';
import { AppCard } from '../../shared/components/ui/AppCard';

export interface ForbiddenPageProps {
  requiredPermission?: string;
}

/**
 * 403 surface. Shown instead of redirecting so the operator can tell
 * "you may not do this" apart from "you are logged out".
 */
export function ForbiddenPage({ requiredPermission }: ForbiddenPageProps) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <AppCard>
        <h1 className="text-xl font-semibold text-warning-400">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Akaun anda tiada kebenaran untuk melihat halaman ini. Sila hubungi pentadbir sistem jika
          anda memerlukan akses.
        </p>
        {requiredPermission ? (
          <p className="mt-2 text-xs text-text-muted">
            Kebenaran diperlukan: <code>{requiredPermission}</code>
          </p>
        ) : null}
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-text-accent underline">
          Kembali ke papan pemuka
        </Link>
      </AppCard>
    </div>
  );
}
