import { Link } from '@tanstack/react-router';
import { useAuth } from '../../shared/auth/auth-context';
import { firstAllowedRoute } from '../../shared/auth/nav-items';
import { AppCard } from '../../shared/components/ui/AppCard';

export interface ForbiddenPageProps {
  requiredPermission?: string;
}

/**
 * 403 surface. Shown instead of redirecting so the operator can tell
 * "you may not do this" apart from "you are logged out".
 */
export function ForbiddenPage({ requiredPermission }: ForbiddenPageProps) {
  const { can } = useAuth();
  // Never /dashboard unconditionally: an operator who lacks dashboard.read
  // reaches this page precisely BY being refused /dashboard, so offering it
  // as the way out sends them straight back to the same refusal.
  const escapeRoute = firstAllowedRoute(can);

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
        {escapeRoute ? (
          <Link to={escapeRoute} className="mt-4 inline-block text-sm text-text-accent underline">
            Kembali ke halaman yang anda boleh akses
          </Link>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Akaun anda tiada akses ke mana-mana bahagian portal ini.
          </p>
        )}
      </AppCard>
    </div>
  );
}
