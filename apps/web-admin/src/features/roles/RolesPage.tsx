import { useMemo, useState } from 'react';
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
  TextField,
} from '../../shared/components';
import { PERMISSION_CATALOG } from '../../shared/auth/permissions';
import { createRole, deleteRole, listRoles, updateRole } from './roles.api';
import type { AdminRole } from './roles.api';

export function RolesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRole | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rolesQuery = useQuery({ queryKey: ['admin-roles'], queryFn: () => listRoles() });

  /**
   * Show every catalogued permission, plus any code a role already holds
   * that the catalogue doesn't know about. Without the second part, editing
   * a role that carries a newer//unknown code would silently strip it on
   * save, because the form would submit only what it rendered.
   */
  const permissionOptions = useMemo(() => {
    const known = new Set(PERMISSION_CATALOG.map((p) => p.code));
    const extras = new Set<string>();
    for (const role of rolesQuery.data ?? []) {
      for (const code of role.permissionCodes) if (!known.has(code)) extras.add(code);
    }
    return [
      ...PERMISSION_CATALOG,
      ...[...extras].sort().map((code) => ({ code, label: code, group: 'Lain-lain' })),
    ];
  }, [rolesQuery.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof permissionOptions>();
    for (const p of permissionOptions) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    return [...map.entries()];
  }, [permissionOptions]);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
  }

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRole>[1] }) =>
      updateRole(id, input),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
      setDeleteError(null);
    },
    // 409 RoleHasUsersError is the expected failure here; show the API's
    // own message, which names how many users still hold the role.
    onError: (err: Error) => setDeleteError(err.message),
  });

  function openCreate() {
    setName('');
    setSelected([]);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(role: AdminRole) {
    setName(role.name);
    setSelected(role.permissionCodes);
    setFormError(null);
    setEditing(role);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setName('');
    setSelected([]);
    setFormError(null);
  }

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    // Mirrors createRoleCommandSchema (permissionCodes.min(1)).
    if (selected.length === 0) {
      setFormError('Sekurang-kurangnya satu kebenaran diperlukan.');
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, input: { name, permissionCodes: selected } });
      return;
    }
    createMutation.mutate({ name, permissionCodes: selected });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Peranan & Kebenaran"
        subtitle="Peranan ialah set kod kebenaran yang dikuatkuasakan oleh pelayan."
        actions={<AppButton onClick={openCreate}>Tambah Peranan</AppButton>}
      />

      {rolesQuery.isLoading ? <LoadingState /> : null}

      {rolesQuery.isError ? (
        <ErrorState
          message={
            rolesQuery.error instanceof Error
              ? rolesQuery.error.message
              : 'Gagal mendapatkan senarai peranan.'
          }
          onRetry={() => void rolesQuery.refetch()}
        />
      ) : null}

      {rolesQuery.data && rolesQuery.data.length === 0 ? (
        <EmptyState message="Tiada peranan ditakrifkan." />
      ) : null}

      {rolesQuery.data && rolesQuery.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rolesQuery.data.map((role) => (
            <AppCard key={role.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-text-primary">{role.name}</h2>
                <div className="flex gap-2">
                  <AppButton variant="secondary" onClick={() => openEdit(role)}>
                    Sunting
                  </AppButton>
                  <AppButton
                    variant="ghost"
                    onClick={() => {
                      setDeleteError(null);
                      setConfirmDelete(role);
                    }}
                  >
                    Padam
                  </AppButton>
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {role.permissionCodes.map((code) => (
                  <li
                    key={code}
                    className="rounded bg-marine-700 px-2 py-0.5 text-xs text-text-secondary"
                  >
                    {code}
                  </li>
                ))}
              </ul>
            </AppCard>
          ))}
        </div>
      ) : null}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Sunting Peranan' : 'Tambah Peranan'}
        onClose={closeForm}
      >
        <form onSubmit={submitForm} noValidate>
          <TextField
            label="Nama Peranan"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <fieldset className="mt-4">
            <legend className="field-label">Kebenaran</legend>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {group}
                  </p>
                  <div className="mt-1 space-y-1">
                    {items.map((p) => (
                      <label key={p.code} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.includes(p.code)}
                          onChange={() => toggle(p.code)}
                        />
                        <span>
                          <span className="text-text-primary">{p.label}</span>{' '}
                          <code className="text-xs text-text-muted">{p.code}</code>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
        open={confirmDelete !== null}
        title="Padam peranan?"
        message={
          deleteError ??
          (confirmDelete
            ? `Peranan "${confirmDelete.name}" akan dipadam kekal. Tindakan ini tidak boleh dibatalkan.`
            : '')
        }
        confirmLabel="Padam"
        pending={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => {
          setConfirmDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
