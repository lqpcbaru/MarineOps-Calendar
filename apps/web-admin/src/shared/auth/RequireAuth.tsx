import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAuth } from './auth-context';
import { LoadingState } from '../components/ui/LoadingState';
import { ForbiddenPage } from '../../features/errors/ForbiddenPage';

export interface RequireAuthProps {
  children: ReactNode;
  /** When set, the principal must hold this permission to see `children`. */
  permission?: string;
}

/**
 * Route guard (ROUTES.md §1.3).
 *
 * Three states matter and conflating any two of them is a real bug:
 *   - `restoring`: the boot-time silent refresh hasn't settled. Rendering a
 *     redirect here would bounce an authenticated user to /login on every
 *     hard refresh.
 *   - `anonymous`: no session → /login.
 *   - `authenticated` but missing the permission → 403 page, NOT a redirect,
 *     so the user can see what happened instead of a silent bounce.
 *
 * This hides UI. It is not the security boundary: the same requests are
 * independently rejected by JwtAuthGuard/PermissionsGuard on the server, and
 * a user who edits their way past this still gets a 403 from the API.
 */
export function RequireAuth({ children, permission }: RequireAuthProps) {
  const { status, can } = useAuth();

  if (status === 'restoring') {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <LoadingState lines={3} />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (permission && !can(permission)) {
    return <ForbiddenPage requiredPermission={permission} />;
  }

  return <>{children}</>;
}
