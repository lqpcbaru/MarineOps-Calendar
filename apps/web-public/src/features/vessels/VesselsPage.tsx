import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  SectionTitle,
  AppCard,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '../../shared/components';
import {
  searchVessels,
  getVesselProfile,
  type VesselSummary,
  type VesselProfile,
  type VesselPosition,
  type VesselEvent,
} from './vessels.api';

const PAGE_SIZE = 20;

type StatusVariant = 'hijau' | 'kuning' | 'merah' | 'neutral';

function statusLabel(status: string): string {
  switch (status) {
    case 'KNOWN':
      return 'Dikenali';
    case 'STALE':
      return 'Data Lama';
    case 'UNKNOWN':
      return 'Tidak Diketahui';
    case 'NO_RECENT_DATA':
      return 'Tiada Data Terkini';
    case 'AIS_GAP':
      return 'Jurang AIS';
    default:
      return 'Tidak Diketahui';
  }
}

function statusVariant(status: string): StatusVariant {
  switch (status) {
    case 'KNOWN':
      return 'hijau';
    case 'STALE':
      return 'kuning';
    case 'NO_RECENT_DATA':
      return 'kuning';
    case 'AIS_GAP':
      return 'neutral';
    case 'UNKNOWN':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case 'FISHING':
      return 'Aktiviti Perikanan';
    case 'ENCOUNTER':
      return 'Pertemuan';
    case 'PORT_VISIT':
      return 'Lawatan Pelabuhan';
    case 'LOITERING':
      return 'Berkeliaran';
    case 'AIS_GAP':
      return 'Jurang AIS';
    case 'UNKNOWN':
      return 'Tidak Diketahui';
    default:
      return 'Tidak Diketahui';
  }
}

function formatCoord(value: number): string {
  return value.toFixed(4);
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <span className="text-text-muted">{label}</span>
      <p className="text-text-primary">{value}</p>
    </div>
  );
}

function PositionBlock({ position }: { position: VesselPosition | null }) {
  if (!position) {
    return <div className="mt-3 text-sm text-text-muted">Kedudukan terakhir tidak tersedia.</div>;
  }
  return (
    <div className="mt-3 rounded-lg border border-marine-600 p-3 text-sm">
      <p className="mb-2 font-semibold text-text-secondary">Kedudukan Terakhir</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div>
          <span className="text-text-muted">Latitud</span>
          <p className="text-text-primary">{formatCoord(position.latitude)}</p>
        </div>
        <div>
          <span className="text-text-muted">Longitud</span>
          <p className="text-text-primary">{formatCoord(position.longitude)}</p>
        </div>
        <div>
          <span className="text-text-muted">Kelajuan</span>
          <p className="text-text-primary">
            {position.speed !== null ? `${position.speed} kn` : '—'}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Haluan</span>
          <p className="text-text-primary">
            {position.course !== null ? `${position.course}°` : '—'}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Panduan</span>
          <p className="text-text-primary">
            {position.heading !== null ? `${position.heading}°` : '—'}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Masa</span>
          <p className="text-text-primary">{position.timestamp}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: VesselProfile }) {
  const identity = profile.identity;
  return (
    <div className="space-y-4">
      <AppCard variant="flat">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            {identity.name ?? 'Tidak Dikenali'}
          </h2>
          <StatusBadge variant={statusVariant(identity.dataStatus)}>
            {statusLabel(identity.dataStatus)}
          </StatusBadge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="MMSI" value={identity.mmsi} />
          <Field label="IMO" value={identity.imo} />
          <Field label="Bendera" value={identity.flag} />
          <Field label="Jenis" value={identity.vesselType} />
          <Field label="Tanda Panggilan" value={identity.callsign} />
          <Field label="Panjang" value={identity.length !== null ? `${identity.length}m` : null} />
          <Field label="Tanan" value={identity.tonnage} />
          <Field label="Sumber" value={identity.source} />
        </div>

        <PositionBlock position={profile.position} />

        <div className="mt-3 text-xs text-text-muted">
          <p>Kedudukan terakhir: {identity.lastPositionAt ?? '—'}</p>
          <p>Data diperoleh: {profile.retrievedAt}</p>
        </div>
      </AppCard>

      {profile.events.length > 0 ? (
        <AppCard variant="flat">
          <h3 className="mb-3 text-lg font-semibold text-text-primary">Aktiviti</h3>
          <div className="space-y-2">
            {profile.events.map((ev: VesselEvent) => (
              <div
                key={ev.id}
                className="flex items-center justify-between border-b border-marine-700 py-2 text-sm last:border-0"
              >
                <div>
                  <span className="font-semibold text-text-primary">{eventLabel(ev.type)}</span>
                  <span className="ml-2 text-text-muted">{ev.startAt}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted">
                    {ev.freshness} • {ev.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      ) : (
        <EmptyState title="Tiada Aktiviti" message="Tiada aktiviti direkodkan untuk kapal ini." />
      )}
    </div>
  );
}

export function VesselsPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trimmedQuery = query.trim();

  const searchQuery = useQuery({
    queryKey: ['public-vessels-search', trimmedQuery, page, PAGE_SIZE],
    queryFn: () => searchVessels(trimmedQuery, page, PAGE_SIZE),
    enabled: trimmedQuery.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const profileQuery = useQuery({
    queryKey: ['public-vessel-profile', selectedId],
    queryFn: () => getVesselProfile(selectedId!),
    enabled: selectedId !== null,
    staleTime: 2 * 60 * 1000,
  });

  const total = searchQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSubmit = () => {
    const next = input.trim();
    if (!next) return;
    setQuery(next);
    setPage(1);
    setSelectedId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Perisikan Kapal" subtitle="Maklumat kapal daripada sumber data awam." />

      {/* Search */}
      <section aria-label="Carian kapal" className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Cari kapal (nama, MMSI, IMO)..."
            className="flex-1 rounded-lg border border-marine-600 bg-surface-raised px-4 py-2.5 text-text-primary placeholder-text-muted focus:border-ocean-400 focus:outline-none"
            aria-label="Carian kapal"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={searchQuery.isFetching}
            className="btn-primary min-h-[2.75rem]"
          >
            Cari
          </button>
        </div>
      </section>

      {/* Search states */}
      {searchQuery.isLoading && <LoadingState lines={6} />}

      {searchQuery.isError && (
        <ErrorState
          title="Ralat Carian"
          message={
            searchQuery.error instanceof Error
              ? searchQuery.error.message
              : 'Gagal mendapatkan maklumat kapal.'
          }
        />
      )}

      {!searchQuery.isLoading &&
        !searchQuery.isError &&
        trimmedQuery &&
        searchQuery.data &&
        searchQuery.data.vessels.length === 0 && (
          <EmptyState title="Tiada Kapal" message="Tiada kapal ditemui." />
        )}

      {/* Results */}
      {!searchQuery.isLoading &&
        !searchQuery.isError &&
        searchQuery.data &&
        searchQuery.data.vessels.length > 0 && (
          <section aria-label="Senarai kapal" className="mb-6">
            <div className="space-y-2">
              {searchQuery.data.vessels.map((v: VesselSummary) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className="card-flat flex w-full items-center justify-between text-left transition-colors hover:border-marine-500"
                >
                  <div>
                    <p className="font-semibold text-text-primary">{v.name ?? 'Tidak Dikenali'}</p>
                    <p className="text-sm text-text-secondary">
                      {v.mmsi && `MMSI: ${v.mmsi}`} {v.flag && `• ${v.flag}`}{' '}
                      {v.vesselType && `• ${v.vesselType}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge variant={statusVariant(v.dataStatus)}>
                      {statusLabel(v.dataStatus)}
                    </StatusBadge>
                    <p className="mt-1 text-xs text-text-muted">{v.source}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-primary disabled:opacity-50"
                >
                  Sebelum
                </button>
                <span>
                  Halaman {page} / {totalPages} ({total} kapal)
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-primary disabled:opacity-50"
                >
                  Seterusnya
                </button>
              </div>
            )}
          </section>
        )}

      {/* Profile */}
      {selectedId && (
        <section aria-label="Profil kapal" className="mb-6">
          <SectionTitle>Profil Kapal</SectionTitle>
          {profileQuery.isLoading && <LoadingState lines={6} />}
          {profileQuery.isError && (
            <ErrorState
              title="Ralat Profil"
              message={
                profileQuery.error instanceof Error
                  ? profileQuery.error.message
                  : 'Gagal mendapatkan profil kapal.'
              }
            />
          )}
          {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data && (
            <ProfileCard profile={profileQuery.data} />
          )}
        </section>
      )}
    </div>
  );
}
