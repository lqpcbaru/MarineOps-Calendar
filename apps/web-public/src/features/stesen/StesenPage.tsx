import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  SectionTitle,
  AppTable,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../shared/components';
import {
  getStations,
  getStationRegions,
  type StationRecord,
  type OperationRegionRecord,
} from './stesen.api';

const PAGE_SIZE = 20;

function flattenRegions(
  regions: OperationRegionRecord[],
  depth = 0,
): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const r of regions) {
    result.push({ id: r.id, label: `${'— '.repeat(depth)}${r.name}` });
    if (r.children && r.children.length > 0) {
      result.push(...flattenRegions(r.children, depth + 1));
    }
  }
  return result;
}

export function StesenPage() {
  const [page, setPage] = useState(1);
  const [regionId, setRegionId] = useState<string>('');

  const regionsQuery = useQuery({
    queryKey: ['public-station-regions'],
    queryFn: () => getStationRegions(),
    staleTime: 30 * 60 * 1000,
  });

  const stationsQuery = useQuery({
    queryKey: ['public-stations', page, PAGE_SIZE, regionId],
    queryFn: () => getStations(page, PAGE_SIZE, regionId || undefined),
    staleTime: 5 * 60 * 1000,
  });

  const regionOptions = useMemo(() => {
    if (!regionsQuery.data) return [];
    return flattenRegions(regionsQuery.data);
  }, [regionsQuery.data]);

  const total = stationsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Stesen" subtitle="Senarai stesen pemantauan marin yang aktif." />

      {/* Region filter */}
      <section aria-label="Tapis wilayah" className="mb-6">
        <SectionTitle>Tapis Wilayah</SectionTitle>
        <select
          value={regionId}
          onChange={(e) => {
            setRegionId(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-marine-600 bg-surface-raised px-4 py-2.5 text-text-primary focus:border-ocean-400 focus:outline-none sm:w-72"
          aria-label="Pilih wilayah"
        >
          <option value="">Semua Wilayah</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </section>

      {/* Loading */}
      {stationsQuery.isLoading && <LoadingState lines={8} />}

      {/* Error */}
      {stationsQuery.isError && (
        <ErrorState
          title="Ralat Memuatkan Stesen"
          message={
            stationsQuery.error instanceof Error
              ? stationsQuery.error.message
              : 'Gagal mendapatkan senarai stesen.'
          }
        />
      )}

      {/* Empty */}
      {!stationsQuery.isLoading &&
        !stationsQuery.isError &&
        stationsQuery.data?.stations.length === 0 && (
          <EmptyState
            title="Tiada Stesen"
            message="Tiada stesen pemantauan marin tersedia untuk pilihan ini."
          />
        )}

      {/* Station list */}
      {!stationsQuery.isLoading &&
        !stationsQuery.isError &&
        stationsQuery.data &&
        stationsQuery.data.stations.length > 0 && (
          <section aria-label="Senarai stesen">
            <AppTable>
              <AppTable.Head>
                <AppTable.Row>
                  <AppTable.Th>Kod</AppTable.Th>
                  <AppTable.Th>Nama</AppTable.Th>
                  <AppTable.Th>Wilayah</AppTable.Th>
                  <AppTable.Th>Koordinat</AppTable.Th>
                </AppTable.Row>
              </AppTable.Head>
              <AppTable.Body>
                {stationsQuery.data.stations.map((s: StationRecord) => (
                  <AppTable.Row key={s.id}>
                    <AppTable.Td>{s.code}</AppTable.Td>
                    <AppTable.Td>{s.name}</AppTable.Td>
                    <AppTable.Td>{s.regionName ?? '—'}</AppTable.Td>
                    <AppTable.Td>
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </AppTable.Td>
                  </AppTable.Row>
                ))}
              </AppTable.Body>
            </AppTable>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-primary disabled:opacity-50"
                >
                  Sebelum
                </button>
                <span>
                  Halaman {page} / {totalPages} ({total} stesen)
                </span>
                <button
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
    </div>
  );
}
