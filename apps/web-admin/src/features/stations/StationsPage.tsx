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
  Pagination,
  SelectField,
  StatusBadge,
  TextField,
} from '../../shared/components';
import { useAuth } from '../../shared/auth/auth-context';
import { PERMISSIONS } from '../../shared/auth/permissions';
import {
  archiveStation,
  createStation,
  flattenRegions,
  listRegions,
  listStations,
  updateStation,
} from './stations.api';
import type { AdminStation } from './stations.api';

const PAGE_SIZE = 20;

interface StationFormState {
  code: string;
  name: string;
  latitude: string;
  longitude: string;
  timezone: string;
  regionId: string;
}

const EMPTY_FORM: StationFormState = {
  code: '',
  name: '',
  latitude: '',
  longitude: '',
  timezone: 'Asia/Kuala_Lumpur',
  regionId: '',
};

export function StationsPage() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.stationWrite);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'ACTIVE' | 'ARCHIVED'>('');
  const [editing, setEditing] = useState<AdminStation | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StationFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<AdminStation | null>(null);

  const stationsQuery = useQuery({
    queryKey: ['admin-stations', page, PAGE_SIZE, statusFilter, search],
    queryFn: () =>
      listStations({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        search: search || undefined,
      }),
  });

  const regionsQuery = useQuery({
    queryKey: ['admin-regions'],
    queryFn: () => listRegions(),
    staleTime: 30 * 60 * 1000,
  });
  const regions = useMemo(() => flattenRegions(regionsQuery.data ?? []), [regionsQuery.data]);
  const regionName = (id: string | null) =>
    id ? (regions.find((r) => r.id === id)?.name ?? id) : '—';

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
  }

  const createMutation = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateStation>[1] }) =>
      updateStation(id, input),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveStation,
    onSuccess: () => {
      invalidate();
      setConfirmArchive(null);
    },
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(station: AdminStation) {
    setForm({
      code: station.code,
      name: station.name,
      latitude: String(station.latitude),
      longitude: String(station.longitude),
      timezone: station.timezone,
      regionId: station.regionId ?? '',
    });
    setFormError(null);
    setEditing(station);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setFormError('Latitud mestilah antara -90 dan 90.');
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setFormError('Longitud mestilah antara -180 dan 180.');
      return;
    }

    const regionId = form.regionId ? form.regionId : null;

    if (editing) {
      // `code` is intentionally absent: updateStationSchema rejects it.
      updateMutation.mutate({
        id: editing.id,
        input: {
          name: form.name,
          latitude,
          longitude,
          timezone: form.timezone,
          regionId,
        },
      });
      return;
    }

    createMutation.mutate({
      code: form.code,
      name: form.name,
      latitude,
      longitude,
      timezone: form.timezone,
      regionId,
    });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Stesen"
        subtitle="Lokasi operasi yang menjadi sumber data marin."
        actions={canWrite ? <AppButton onClick={openCreate}>Tambah Stesen</AppButton> : undefined}
      />

      <AppCard className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Cari"
            placeholder="Kod atau nama"
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
              setStatusFilter(e.target.value as '' | 'ACTIVE' | 'ARCHIVED');
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="ARCHIVED">Diarkib</option>
          </SelectField>
        </div>
      </AppCard>

      {stationsQuery.isLoading ? <LoadingState /> : null}

      {stationsQuery.isError ? (
        <ErrorState
          message={
            stationsQuery.error instanceof Error
              ? stationsQuery.error.message
              : 'Gagal mendapatkan senarai stesen.'
          }
          onRetry={() => void stationsQuery.refetch()}
        />
      ) : null}

      {stationsQuery.data && stationsQuery.data.stations.length === 0 ? (
        <EmptyState message="Tiada stesen sepadan dengan carian ini." />
      ) : null}

      {stationsQuery.data && stationsQuery.data.stations.length > 0 ? (
        <>
          <AppCard className="overflow-x-auto p-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Nama</th>
                  <th>Wilayah</th>
                  <th>Koordinat</th>
                  <th>Status</th>
                  {canWrite ? <th>Tindakan</th> : null}
                </tr>
              </thead>
              <tbody>
                {stationsQuery.data.stations.map((station) => (
                  <tr key={station.id}>
                    <td className="font-medium text-text-primary">{station.code}</td>
                    <td className="text-text-secondary">{station.name}</td>
                    <td className="text-text-secondary">
                      {station.regionName ?? regionName(station.regionId)}
                    </td>
                    <td className="whitespace-nowrap text-text-secondary">
                      {station.latitude}, {station.longitude}
                    </td>
                    <td>
                      <StatusBadge tone={station.status === 'ACTIVE' ? 'safe' : 'neutral'}>
                        {station.status === 'ACTIVE' ? 'Aktif' : 'Diarkib'}
                      </StatusBadge>
                    </td>
                    {canWrite ? (
                      <td>
                        <div className="flex gap-2">
                          <AppButton variant="secondary" onClick={() => openEdit(station)}>
                            Sunting
                          </AppButton>
                          {station.status === 'ACTIVE' ? (
                            <AppButton variant="ghost" onClick={() => setConfirmArchive(station)}>
                              Arkib
                            </AppButton>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </AppCard>

          <Pagination
            page={stationsQuery.data.page}
            pageSize={stationsQuery.data.pageSize}
            total={stationsQuery.data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Sunting Stesen' : 'Tambah Stesen'}
        onClose={closeForm}
      >
        <form onSubmit={submitForm} noValidate>
          {editing ? (
            <p className="mb-3 text-sm text-text-secondary">
              Kod: <span className="font-medium text-text-primary">{editing.code}</span>{' '}
              <span className="text-text-muted">(tidak boleh diubah)</span>
            </p>
          ) : (
            <TextField
              label="Kod"
              required
              hint="Huruf besar, nombor atau sengkang. Contoh: PKG-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          )}

          <TextField
            className="mt-3"
            label="Nama"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField
              label="Latitud"
              required
              inputMode="decimal"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
            <TextField
              label="Longitud"
              required
              inputMode="decimal"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>

          <TextField
            className="mt-3"
            label="Zon Waktu"
            required
            hint="Contoh: Asia/Kuala_Lumpur"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          />

          <SelectField
            className="mt-3"
            label="Wilayah"
            value={form.regionId}
            onChange={(e) => setForm({ ...form, regionId: e.target.value })}
          >
            <option value="">Tiada wilayah</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name} ({region.code})
              </option>
            ))}
          </SelectField>

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
        open={confirmArchive !== null}
        title="Arkibkan stesen?"
        message={
          confirmArchive
            ? `Stesen ${confirmArchive.code} akan disembunyikan daripada portal awam. Rekod kekal disimpan dan boleh dirujuk semula.`
            : ''
        }
        confirmLabel="Arkibkan"
        pending={archiveMutation.isPending}
        onConfirm={() => confirmArchive && archiveMutation.mutate(confirmArchive.id)}
        onCancel={() => setConfirmArchive(null)}
      />
    </div>
  );
}
