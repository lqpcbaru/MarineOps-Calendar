import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  PageHeader,
  SectionTitle,
  AppTable,
  InfoPanel,
  EmptyState,
  ErrorState,
  LoadingState,
  MarineConditionCard,
  MarineSummaryGrid,
  OperationalLegend,
} from '../../shared/components';
import { formatDuration, formatStationTime } from '../../shared/format/station-time';
import { getStations } from '../stesen/stesen.api';
import { getSunData, type SunDataPoint } from './matahari.api';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function RingkasanHariIni({
  data,
  timezone,
}: {
  data: SunDataPoint | null;
  timezone: string | undefined;
}) {
  return (
    <section aria-label="Ringkasan matahari" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard
          icon="🌅"
          title="Matahari Terbit"
          value={formatStationTime(data?.sunrise, timezone)}
        />
        <MarineConditionCard
          icon="🌇"
          title="Matahari Terbenam"
          value={formatStationTime(data?.sunset, timezone)}
        />
        <MarineConditionCard
          icon="☀️"
          title="Tengah Hari"
          value={formatStationTime(data?.solarNoon, timezone)}
        />
        <MarineConditionCard
          icon="⏱️"
          title="Tempoh Siang"
          value={formatDuration(data?.daylightDuration)}
        />
      </MarineSummaryGrid>
    </section>
  );
}

function JadualHarian({
  data,
  timezone,
}: {
  data: SunDataPoint | null;
  timezone: string | undefined;
}) {
  if (!data) return <EmptyState title="Tiada Data" message="Data matahari tidak tersedia." />;

  return (
    <section aria-label="Jadual harian" className="mb-8">
      <SectionTitle>Jadual Harian</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Terbit</AppTable.Th>
            <AppTable.Th>Terbenam</AppTable.Th>
            <AppTable.Th>Tengah Hari</AppTable.Th>
            <AppTable.Th>Tempoh Siang</AppTable.Th>
          </AppTable.Row>
        </AppTable.Head>
        <AppTable.Body>
          <AppTable.Row>
            <AppTable.Td>{data.date}</AppTable.Td>
            <AppTable.Td>{formatStationTime(data.sunrise, timezone)}</AppTable.Td>
            <AppTable.Td>{formatStationTime(data.sunset, timezone)}</AppTable.Td>
            <AppTable.Td>{formatStationTime(data.solarNoon, timezone)}</AppTable.Td>
            <AppTable.Td>{formatDuration(data.daylightDuration)}</AppTable.Td>
          </AppTable.Row>
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

export function MatahariPage() {
  const today = toLocalDateString(new Date());

  // Sunrise and sunset are computed from a station's coordinates, so this
  // page cannot ask for them without naming one. It used to call with no
  // stationId at all, which the API answered with an error for every
  // visitor on every load — the page never once displayed data. Malaysia
  // spans enough longitude for the choice to matter by over an hour, so
  // there is no single correct station to hardcode; the operator picks,
  // defaulting to the first one.
  const [stationId, setStationId] = useState<string | undefined>(undefined);

  const stationsQuery = useQuery({
    queryKey: ['public-stations', 'for-sun'],
    queryFn: () => getStations(1, 100),
  });
  const stations = stationsQuery.data?.stations ?? [];
  const selectedStationId = stationId ?? stations[0]?.id;
  const selectedTimezone = stations.find((s) => s.id === selectedStationId)?.timezone;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-sun', selectedStationId, today],
    queryFn: () => getSunData(selectedStationId, today),
    // Without a station there is nothing to ask for; waiting is correct
    // rather than firing a request that is certain to fail.
    enabled: Boolean(selectedStationId),
  });

  const stationPicker =
    stations.length > 0 ? (
      <div className="card-flat mb-6">
        <label htmlFor="sun-station" className="mb-1 block text-sm text-text-secondary">
          Stesen
        </label>
        <select
          id="sun-station"
          className="w-full rounded-lg border border-marine-600 bg-surface-raised px-3 py-2 text-text-primary focus:border-ocean-400 focus:outline-none sm:max-w-sm"
          value={selectedStationId ?? ''}
          onChange={(e) => setStationId(e.target.value)}
        >
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.code} — {station.name}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  if (stationsQuery.isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Matahari" subtitle="Maklumat waktu matahari." />
        <ErrorState
          title="Ralat Memuatkan Senarai Stesen"
          message={
            stationsQuery.error instanceof Error
              ? stationsQuery.error.message
              : 'Gagal mendapatkan senarai stesen.'
          }
        />
      </div>
    );

  if (stationsQuery.isLoading || (isLoading && Boolean(selectedStationId)))
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Matahari" subtitle="Maklumat waktu matahari." />
        <LoadingState lines={5} />
      </div>
    );
  if (isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Matahari" subtitle="Maklumat waktu matahari." />
        {stationPicker}
        <ErrorState
          title="Ralat Memuatkan Matahari"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </div>
    );

  const sunData = data?.data ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Matahari"
        subtitle="Maklumat waktu matahari untuk membantu perancangan operasi laut."
      />
      {stationPicker}
      <RingkasanHariIni data={sunData} timezone={selectedTimezone} />
      <JadualHarian data={sunData} timezone={selectedTimezone} />
      <section className="mb-8">
        <div className="card-flat flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Semakan status dan cadangan operasi tersedia di Amaran Marin.
          </p>
          <Link to="/amaran-marin" className="btn-primary" aria-label="Ke halaman Amaran Marin">
            Amaran Marin
          </Link>
        </div>
      </section>
      <section className="mb-8">
        <OperationalLegend />
      </section>
      <section className="mb-8 space-y-4">
        <InfoPanel title="Mengapa Waktu Matahari Penting">
          <p>Waktu matahari menentukan tempoh cahaya siang yang tersedia untuk operasi di laut.</p>
        </InfoPanel>
        <InfoPanel title="Tempoh Cahaya Siang">
          <p>
            Tempoh cahaya siang menentukan jumlah waktu siang yang tersedia sepanjang hari. Maklumat
            ini boleh dirujuk semasa merancang aktiviti di laut.
          </p>
        </InfoPanel>
      </section>
    </div>
  );
}
