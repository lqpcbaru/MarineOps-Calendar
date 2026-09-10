import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, firstAllowedRoute } from './nav-items';
import { PERMISSIONS } from './permissions';

function canOnly(...held: string[]) {
  const set = new Set(held);
  return (permission: string) => set.has(permission);
}

describe('firstAllowedRoute', () => {
  it('sends a full administrator to the dashboard', () => {
    expect(firstAllowedRoute(() => true)).toBe('/dashboard');
  });

  // The case that made this necessary: an auditor logged in successfully
  // and landed on "Access Denied", whose only link pointed back at the
  // dashboard that had just refused them.
  it('sends an audit-only operator to the audit trail, not the dashboard', () => {
    expect(firstAllowedRoute(canOnly(PERMISSIONS.audit))).toBe('/audit');
  });

  it('picks the first section in nav order when several are allowed', () => {
    expect(firstAllowedRoute(canOnly(PERMISSIONS.audit, PERMISSIONS.roles))).toBe('/roles');
  });

  it('returns null when the account may open nothing', () => {
    expect(firstAllowedRoute(() => false)).toBeNull();
  });

  it('gives every section a route and a permission', () => {
    for (const item of NAV_ITEMS) {
      expect(item.to.startsWith('/')).toBe(true);
      expect(item.permission).toBeTruthy();
      expect(item.label).toBeTruthy();
    }
  });
});
