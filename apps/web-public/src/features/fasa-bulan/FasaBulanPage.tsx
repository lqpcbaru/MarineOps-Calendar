import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  PageShell,
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
  StationSelect,
  MoonPhaseVisual,
} from '../../shared/components';
import { formatStationTime, formatDateDDMMYYYY } from '../../shared/format/station-time';
import { getStations } from '../stesen/stesen.api';
import { getMoonPhase, type MoonDataPoint } from './fasa-bulan.api';

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
  data: MoonDataPoint | null;
  timezone: string | undefined;
}) {
  return (
    <section aria-label="Ringkasan fasa bulan" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="moon" title="Fasa Bulan" value={data?.phaseName ?? '—'} />
        <MarineConditionCard
          icon="gauge"
          title="Pencahayaan"
          value={data ? `${data.illumination}%` : '—'}
        />
        <MarineConditionCard
          icon="calendar"
          title="Umur Bulan"
          value={data ? `${data.ageDays} hari` : '—'}
        />
        <MarineConditionCard
          icon="sun"
          title="Bulan Terbit"
          value={formatStationTime(data?.moonrise, timezone)}
        />
      </MarineSummaryGrid>
    </section>
  );
}

function JadualFasa({
  data,
  timezone,
}: {
  data: MoonDataPoint | null;
  timezone: string | undefined;
}) {
  if (!data) return <EmptyState title="Tiada Data" message="Data fasa bulan tidak tersedia." />;

  return (
    <section aria-label="Jadual fasa bulan" className="mb-8">
      <SectionTitle>Jadual Fasa Bulan</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Fasa</AppTable.Th>
            <AppTable.Th>Pencahayaan</AppTable.Th>
            <AppTable.Th>Umur (hari)</AppTable.Th>
            <AppTable.Th>Bulan Terbit</AppTable.Th>
            <AppTable.Th>Bulan Terbenam</AppTable.Th>
          </AppTable.Row>
        </AppTable.Head>
        <AppTable.Body>
          <AppTable.Row>
            <AppTable.Td>{formatDateDDMMYYYY(data.date)}</AppTable.Td>
            <AppTable.Td>{data.phaseName}</AppTable.Td>
            <AppTable.Td>{data.illumination}%</AppTable.Td>
            <AppTable.Td>{data.ageDays}</AppTable.Td>
            <AppTable.Td>{formatStationTime(data.moonrise, timezone)}</AppTable.Td>
            <AppTable.Td>{formatStationTime(data.moonset, timezone)}</AppTable.Td>
          </AppTable.Row>
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

export function FasaBulanPage() {
  const today = toLocalDateString(new Date());

  // Moonrise and moonset are properties of a place, not of the date, so
  // this page has to name a station. It used to call with none, which the
  // old engine silently accepted because it invented the times from the
  // date alone.
  const [stationId, setStationId] = useState<string | undefined>(undefined);

  const stationsQuery = useQuery({
    queryKey: ['public-stations', 'for-moon'],
    queryFn: () => getStations(1, 100),
  });
  const stations = stationsQuery.data?.stations ?? [];
  const selectedStationId = stationId ?? stations[0]?.id;
  const selectedTimezone = stations.find((s) => s.id === selectedStationId)?.timezone;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-moon', selectedStationId, today],
    queryFn: () => getMoonPhase(selectedStationId, today),
    enabled: Boolean(selectedStationId),
  });

  const stationPicker =
    stations.length > 0 ? (
      <div className="mb-6">
        <label
          htmlFor="moon-station"
          className="mb-1 block text-xs uppercase tracking-wide text-text-muted"
        >
          Stesen
        </label>
        <StationSelect
          id="moon-station"
          stations={stations}
          value={selectedStationId ?? ''}
          onChange={(e) => setStationId(e.target.value)}
        />
      </div>
    ) : null;

  if (stationsQuery.isError)
    return (
      <PageShell>
        <PageHeader title="Fasa Bulan" subtitle="Maklumat fasa bulan." />
        <ErrorState
          title="Ralat Memuatkan Senarai Stesen"
          message={
            stationsQuery.error instanceof Error
              ? stationsQuery.error.message
              : 'Gagal mendapatkan senarai stesen.'
          }
        />
      </PageShell>
    );

  if (stationsQuery.isLoading || (isLoading && Boolean(selectedStationId)))
    return (
      <PageShell>
        <PageHeader title="Fasa Bulan" subtitle="Maklumat fasa bulan." />
        <LoadingState lines={5} />
      </PageShell>
    );
  if (isError)
    return (
      <PageShell>
        <PageHeader title="Fasa Bulan" subtitle="Maklumat fasa bulan." />
        {stationPicker}
        <ErrorState
          title="Ralat Memuatkan Fasa Bulan"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </PageShell>
    );

  const moonData = data?.data ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Fasa Bulan"
        subtitle="Maklumat fasa bulan untuk membantu memahami keadaan pasang surut dan operasi laut."
      />
      {stationPicker}
      {moonData && (
        <section aria-label="Visual fasa bulan" className="mb-8">
          <div className="surface px-3 py-4">
            <MoonPhaseVisual phaseName={moonData.phaseName} illumination={moonData.illumination} />
          </div>
        </section>
      )}
      <RingkasanHariIni data={moonData} timezone={selectedTimezone} />
      <JadualFasa data={moonData} timezone={selectedTimezone} />
      <section className="mb-8">
        <Link
          to="/amaran-marin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-accent hover:text-ocean-300"
        >
          Semakan status dan cadangan operasi
        </Link>
      </section>
      <section className="mb-8">
        <OperationalLegend />
      </section>
      <section className="mb-8 space-y-4">
        <InfoPanel title="Hubungan Fasa Bulan dengan Air Besar">
          <p>Air Besar berlaku apabila bulan berada dalam fasa bulan baharu dan bulan penuh.</p>
        </InfoPanel>
        <InfoPanel title="Hubungan Fasa Bulan dengan Air Mati">
          <p>Air Mati berlaku apabila bulan berada dalam fasa suku pertama dan suku ketiga.</p>
        </InfoPanel>
      </section>
    </PageShell>
  );
}
