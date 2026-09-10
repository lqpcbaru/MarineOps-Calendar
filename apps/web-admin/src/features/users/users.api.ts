import { apiRequest, buildQuery } from '../../shared/api/http';

/**
 * Mirrors `toPublicUser()` in apps/api/src/api/admin/users.controller.ts.
 * That helper is the API's explicit response shape and deliberately omits
 * passwordHash — do not widen this interface to match UserRecord.
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED';
  timezone: string;
  locale: string;
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListResult {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  status?: 'ACTIVE' | 'DISABLED' | '';
  search?: string;
}

export function listUsers(params: ListUsersParams = {}): Promise<UserListResult> {
  const qs = buildQuery({
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    search: params.search,
  });
  return apiRequest<UserListResult>(`/api/v1/users${qs}`, {
    fallbackMessage: 'Gagal mendapatkan senarai pengguna',
  });
}

/** POST /api/v1/users — createUserCommandSchema requires at least one role. */
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
  timezone?: string;
  locale?: string;
}

export function createUser(input: CreateUserInput): Promise<AdminUser> {
  return apiRequest<AdminUser>('/api/v1/users', {
    method: 'POST',
    body: input,
    fallbackMessage: 'Gagal mencipta pengguna',
  });
}

/** PATCH /api/v1/users/:id — email and password are not updatable by this API. */
export interface UpdateUserInput {
  name?: string;
  timezone?: string;
  locale?: string;
  roleIds?: string[];
}

export function updateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
    fallbackMessage: 'Gagal mengemas kini pengguna',
  });
}

/**
 * DELETE /api/v1/users/:id is a soft disable (DisableUserUseCase), not a
 * hard delete — the row and its audit history are preserved.
 */
export function disableUser(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    fallbackMessage: 'Gagal menyahaktifkan pengguna',
  });
}
