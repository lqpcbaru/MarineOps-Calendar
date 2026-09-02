import { apiRequest } from '../../shared/api/http';

/** Mirrors the response shape built by roles.controller.ts. */
export interface AdminRole {
  id: string;
  name: string;
  permissionCodes: string[];
  createdAt: string;
  updatedAt: string;
}

/** GET /api/v1/roles returns a bare array — it is not paginated. */
export function listRoles(): Promise<AdminRole[]> {
  return apiRequest<AdminRole[]>('/api/v1/roles', {
    fallbackMessage: 'Gagal mendapatkan senarai peranan',
  });
}

/** createRoleCommandSchema requires a non-empty permissionCodes array. */
export interface CreateRoleInput {
  name: string;
  permissionCodes: string[];
}

export function createRole(input: CreateRoleInput): Promise<AdminRole> {
  return apiRequest<AdminRole>('/api/v1/roles', {
    method: 'POST',
    body: input,
    fallbackMessage: 'Gagal mencipta peranan',
  });
}

export interface UpdateRoleInput {
  name?: string;
  permissionCodes?: string[];
}

export function updateRole(id: string, input: UpdateRoleInput): Promise<AdminRole> {
  return apiRequest<AdminRole>(`/api/v1/roles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
    fallbackMessage: 'Gagal mengemas kini peranan',
  });
}

/**
 * Hard delete. The API refuses with 409 (RoleHasUsersError) when the role is
 * still assigned to any user, so the conflict message is surfaced verbatim.
 */
export function deleteRole(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    fallbackMessage: 'Gagal memadam peranan',
  });
}
