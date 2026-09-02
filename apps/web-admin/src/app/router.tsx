import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from '@tanstack/react-router';
import { Layout } from '../shared/components/Layout';
import { RequireAuth } from '../shared/auth/RequireAuth';
import { PERMISSIONS } from '../shared/auth/permissions';
import { LoginPage } from '../features/login/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { UsersPage } from '../features/users/UsersPage';
import { RolesPage } from '../features/roles/RolesPage';
import { StationsPage } from '../features/stations/StationsPage';
import { AuditPage } from '../features/audit/AuditPage';
import { NotFoundPage } from '../features/errors/NotFoundPage';
import { RouteErrorPage } from '../features/errors/RouteErrorPage';

/**
 * Route tree per ROUTES.md §1.2.
 *
 * /calendar, /alerts and /settings appear in that table but are deliberately
 * absent: no calendar, alerts or settings controller exists under
 * apps/api/src/api/admin, so those screens would have no API to call.
 *
 * The root renders a bare Outlet rather than the chrome, because /login must
 * not show the authenticated shell. Every other route wraps itself in
 * RequireAuth + Layout.
 */
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
});

/**
 * Layout renders <Outlet/>, so protected pages are children of one pathless
 * layout route rather than each re-rendering the chrome. The outer
 * RequireAuth here handles authentication; each child adds its own
 * permission check so an authorised-but-unpermitted user still gets the
 * chrome and a readable 403 rather than a blank screen.
 */
const authedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authed',
  component: () => (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" replace />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/dashboard',
  component: () => (
    <RequireAuth permission={PERMISSIONS.dashboard}>
      <DashboardPage />
    </RequireAuth>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/users',
  component: () => (
    <RequireAuth permission={PERMISSIONS.users}>
      <UsersPage />
    </RequireAuth>
  ),
});

const rolesRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/roles',
  component: () => (
    <RequireAuth permission={PERMISSIONS.roles}>
      <RolesPage />
    </RequireAuth>
  ),
});

const stationsRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/stations',
  component: () => (
    <RequireAuth permission={PERMISSIONS.stationRead}>
      <StationsPage />
    </RequireAuth>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => authedLayoutRoute,
  path: '/audit',
  component: () => (
    <RequireAuth permission={PERMISSIONS.audit}>
      <AuditPage />
    </RequireAuth>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authedLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    usersRoute,
    rolesRoute,
    stationsRoute,
    auditRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
