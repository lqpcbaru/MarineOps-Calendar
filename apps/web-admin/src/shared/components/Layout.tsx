import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../auth/auth-context';
import { PERMISSIONS } from '../auth/permissions';
import { AppButton } from './ui/AppButton';

interface NavItem {
  to: string;
  label: string;
  /** Hidden when the principal lacks this — convenience only, not security. */
  permission: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Papan Pemuka', permission: PERMISSIONS.dashboard },
  { to: '/users', label: 'Pengguna', permission: PERMISSIONS.users },
  { to: '/roles', label: 'Peranan', permission: PERMISSIONS.roles },
  { to: '/stations', label: 'Stesen', permission: PERMISSIONS.stationRead },
  { to: '/audit', label: 'Jejak Audit', permission: PERMISSIONS.audit },
];

/**
 * Authenticated shell. Renders nothing auth-specific when anonymous — the
 * login route is rendered outside this layout's guard by RequireAuth.
 */
export function Layout() {
  const { principal, logout, can } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Langkau ke kandungan utama
      </a>

      <header className="border-b border-marine-600 bg-surface-raised">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <span className="font-semibold text-text-primary">
            MarineOps <span className="text-text-accent">Pentadbir</span>
          </span>

          <nav aria-label="Navigasi utama" className="flex flex-wrap gap-1">
            {visibleItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${pathname.startsWith(item.to) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {principal ? (
              <span className="hidden text-sm text-text-secondary sm:inline">{principal.name}</span>
            ) : null}
            <AppButton variant="ghost" onClick={() => void logout()}>
              Log Keluar
            </AppButton>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
