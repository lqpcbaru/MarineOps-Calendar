import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../../shared/auth/auth-context';
import { firstAllowedRoute } from '../../shared/auth/nav-items';
import { ForbiddenPage } from './ForbiddenPage';

/**
 * Where `/admin/` sends an operator once they are authenticated.
 *
 * Not a fixed redirect to /dashboard: that assumed every account holds
 * dashboard.read. One that does not — an auditor with only audit.read, say
 * — logged in successfully and landed on "Access Denied", which is a
 * working account presented as a broken one.
 */
export function LandingRedirect() {
  const { can } = useAuth();
  const target = firstAllowedRoute(can);

  // No section at all is genuinely a misconfigured account, so say so here
  // rather than bouncing them between routes that each refuse them.
  if (!target) return <ForbiddenPage />;

  return <Navigate to={target} replace />;
}
