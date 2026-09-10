/**
 * Permission catalogue — transcribed from docs/architecture/AUTHORIZATION.md
 * §4 ("Permission catalog (admin surface)"), which states the codes are
 * stable strings owned by the Roles module and seeded at deploy time.
 *
 * This list exists ONLY to render a checkbox editor with human labels on the
 * Roles screen. It is not an authorization mechanism: the backend validates
 * whatever `permissionCodes` array it is sent, and PermissionsGuard is the
 * sole enforcement boundary. A code missing from this list is still shown if
 * a role already holds it (see RolesPage) so the UI can never silently drop
 * a permission it does not recognise.
 *
 * Future codes (patrolplan.*, ais.read, vms.read, vessel.monitor) are
 * intentionally excluded — AUTHORIZATION.md gates each behind its own ADR
 * and no backend module implements them.
 */
export interface PermissionDefinition {
  code: string;
  /** Bahasa Melayu label shown in the roles editor. */
  label: string;
  group: string;
}

export const PERMISSION_CATALOG: readonly PermissionDefinition[] = [
  { code: 'user.manage', label: 'Urus pengguna', group: 'Pentadbiran' },
  { code: 'role.manage', label: 'Urus peranan & kebenaran', group: 'Pentadbiran' },
  { code: 'admin.reference', label: 'Urus data rujukan', group: 'Pentadbiran' },

  { code: 'station.read', label: 'Lihat stesen', group: 'Stesen' },
  { code: 'station.write', label: 'Cipta/kemas kini/arkib stesen', group: 'Stesen' },

  { code: 'calendar.read', label: 'Lihat kalendar', group: 'Kalendar' },
  { code: 'calendar.write', label: 'Urus entri kalendar', group: 'Kalendar' },

  { code: 'alert.read', label: 'Lihat amaran', group: 'Amaran' },
  { code: 'alert.write', label: 'Urus & terbit amaran', group: 'Amaran' },

  { code: 'dashboard.read', label: 'Lihat papan pemuka', group: 'Operasi' },
  { code: 'audit.read', label: 'Baca jejak audit', group: 'Operasi' },

  { code: 'settings.read', label: 'Lihat tetapan', group: 'Tetapan' },
  { code: 'settings.write', label: 'Urus tetapan', group: 'Tetapan' },
] as const;

/** Permission codes the admin routes gate on. */
export const PERMISSIONS = {
  dashboard: 'dashboard.read',
  users: 'user.manage',
  roles: 'role.manage',
  stationRead: 'station.read',
  stationWrite: 'station.write',
  audit: 'audit.read',
} as const;
