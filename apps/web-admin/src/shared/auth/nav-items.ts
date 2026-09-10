import { PERMISSIONS } from './permissions';

export interface NavItem {
  to: string;
  label: string;
  /** Hidden when the principal lacks this — convenience only, not security. */
  permission: string;
}

/**
 * The admin sections, in the order they appear in the header.
 *
 * Shared rather than private to Layout because "where can this operator
 * actually go?" is asked in three places: the nav itself, where to send
 * someone after login, and where the 403 page should offer to send them.
 * Answering it from one list is what stops those three drifting apart.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Papan Pemuka', permission: PERMISSIONS.dashboard },
  { to: '/users', label: 'Pengguna', permission: PERMISSIONS.users },
  { to: '/roles', label: 'Peranan', permission: PERMISSIONS.roles },
  { to: '/stations', label: 'Stesen', permission: PERMISSIONS.stationRead },
  { to: '/audit', label: 'Jejak Audit', permission: PERMISSIONS.audit },
];

/**
 * The first section this principal may actually open, or null when they
 * may open none.
 *
 * Everything used to assume /dashboard. An operator who holds, say, only
 * audit.read then logged in and landed on a 403 whose sole link was
 * "back to the dashboard" — pointing at the page that had just refused
 * them. The account works; the only route into it was a nav link they had
 * to notice for themselves.
 */
export function firstAllowedRoute(can: (permission: string) => boolean): string | null {
  return NAV_ITEMS.find((item) => can(item.permission))?.to ?? null;
}
