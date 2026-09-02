import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppButton,
  AppCard,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  SelectField,
  StatusBadge,
  TextField,
} from '../../shared/components';
import { listRoles } from '../roles/roles.api';
import { createUser, disableUser, listUsers, updateUser } from './users.api';
import type { AdminUser } from './users.api';

const PAGE_SIZE = 20;

interface UserFormState {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
}

const EMPTY_FORM: UserFormState = { email: '', name: '', password: '', roleIds: [] };

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'ACTIVE' | 'DISABLED'>('');

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<AdminUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin-users', page, PAGE_SIZE, statusFilter, search],
    queryFn: () =>
      listUsers({ page, pageSize: PAGE_SIZE, status: statusFilter, search: search || undefined }),
  });

  // Needed to render role names and to populate the assignment control.
  const rolesQuery = useQuery({ queryKey: ['admin-roles'], queryFn: () => listRoles() });
  const roles = rolesQuery.data ?? [];
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, input),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const disableMutation = useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      invalidate();
      setConfirmDisable(null);
    },
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(user: AdminUser) {
    setForm({ email: user.email, name: user.name, password: '', roleIds: user.roleIds });
    setFormError(null);
    setEditing(user);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function toggleRole(roleId: string) {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    // The API enforces this too (createUserCommandSchema: roleIds.min(1));
    // checking here avoids a round-trip for an obvious mistake.
    if (form.roleIds.length === 0) {
      setFormError('Sekurang-kurangnya satu peranan diperlukan.');
      return;
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        input: { name: form.name, roleIds: form.roleIds },
      });
      return;
    }

    createMutation.mutate({
      email: form.email,
      name: form.name,
      password: form.password,
      roleIds: form.roleIds,
    });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Pengguna"
        subtitle="Urus akaun pentadbir dan pegawai."
        actions={<AppButton onClick={openCreate}>Tambah Pengguna</AppButton>}
      />

      <AppCard className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Cari"
            placeholder="Nama atau e-mel"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as '' | 'ACTIVE' | 'DISABLED');
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="DISABLED">Dinyahaktifkan</option>
          </SelectField>
        </div>
      </AppCard>

      {usersQuery.isLoading ? <LoadingState /> : null}

      {usersQuery.isError ? (
        <ErrorState
          message={
            usersQuery.error instanceof Error
              ? usersQuery.error.message
              : 'Gagal mendapatkan senarai pengguna.'
          }
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}

      {usersQuery.data && usersQuery.data.users.length === 0 ? (
        <EmptyState message="Tiada pengguna sepadan dengan carian ini." />
      ) : null}

      {usersQuery.data && usersQuery.data.users.length > 0 ? (
        <>
          <AppCard className="overflow-x-auto p-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>E-mel</th>
                  <th>Peranan</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="text-text-primary">{user.name}</td>
                    <td className="text-text-secondary">{user.email}</td>
                    <td className="text-text-secondary">
                      {user.roleIds.length > 0 ? user.roleIds.map(roleName).join(', ') : '—'}
                    </td>
                    <td>
                      <StatusBadge tone={user.status === 'ACTIVE' ? 'safe' : 'danger'}>
                        {user.status === 'ACTIVE' ? 'Aktif' : 'Dinyahaktifkan'}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <AppButton variant="secondary" onClick={() => openEdit(user)}>
                          Sunting
                        </AppButton>
                        {user.status === 'ACTIVE' ? (
                          <AppButton variant="ghost" onClick={() => setConfirmDisable(user)}>
                            Nyahaktif
                          </AppButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppCard>

          <Pagination
            page={usersQuery.data.page}
            pageSize={usersQuery.data.pageSize}
            total={usersQuery.data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Sunting Pengguna' : 'Tambah Pengguna'}
        onClose={closeForm}
      >
        <form onSubmit={submitForm} noValidate>
          {editing ? (
            <p className="mb-3 text-sm text-text-secondary">{editing.email}</p>
          ) : (
            <TextField
              label="E-mel"
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}

          <TextField
            className="mt-3"
            label="Nama"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {!editing ? (
            <TextField
              className="mt-3"
              label="Kata Laluan"
              type="password"
              required
              autoComplete="new-password"
              hint="Minimum 8 aksara."
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          ) : null}

          <fieldset className="mt-4">
            <legend className="field-label">Peranan</legend>
            {rolesQuery.isLoading ? (
              <p className="text-sm text-text-muted">Memuatkan peranan...</p>
            ) : (
              <div className="space-y-1">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    <span className="text-text-primary">{role.name}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {formError ? (
            <p role="alert" className="mt-3 text-sm text-danger-400">
              {formError}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <AppButton variant="ghost" onClick={closeForm} disabled={saving}>
              Batal
            </AppButton>
            <AppButton type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </AppButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDisable !== null}
        title="Nyahaktifkan pengguna?"
        message={
          confirmDisable
            ? `${confirmDisable.name} tidak akan dapat log masuk. Akaun dan jejak auditnya kekal disimpan.`
            : ''
        }
        confirmLabel="Nyahaktifkan"
        pending={disableMutation.isPending}
        onConfirm={() => confirmDisable && disableMutation.mutate(confirmDisable.id)}
        onCancel={() => setConfirmDisable(null)}
      />
    </div>
  );
}
