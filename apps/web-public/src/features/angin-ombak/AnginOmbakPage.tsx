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
  WindCompass,
  WaveVisual,
} from '../../shared/components';
import { useStationPicker } from '../../shared/hooks/use-station-picker';
import { formatDateDDMMYYYY } from '../../shared/format/station-time';
import { getWindWave, type WindWaveDataPoint } from './angin-ombak.api';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function RingkasanHariIni({ data }: { data: WindWaveDataPoint[] }) {
  const current = data[0];
  return (
    <section aria-label="Ringkasan angin dan ombak" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard
          icon="compass"
          title="Arah Angin"
          value={current?.windDirection ?? '—'}
        />
        <MarineConditionCard
          icon="wind"
          title="Kelajuan Angin"
          value={current ? `${current.windSpeed} kn` : '—'}
          subtitle={current ? `Gust ${current.windGusts} kn` : ''}
        />
        <MarineConditionCard
          icon="tide"
          title="Ketinggian Ombak"
          value={current ? `${current.waveHeight} m` : '—'}
        />
        <MarineConditionCard
          icon="clock"
          title="Tempoh Ombak"
          value={current ? `${current.wavePeriod}s` : '—'}
        />
      </MarineSummaryGrid>
    </section>
  );
}

function JadualRamalan({ data }: { data: WindWaveDataPoint[] }) {
  return (
    <section aria-label="Jadual ramalan" className="mb-8">
      <SectionTitle>Jadual Ramalan</SectionTitle>
      {data.length === 0 ? (
        <EmptyState title="Tiada Data" message="Data angin dan ombak tidak tersedia." />
      ) : (
        <AppTable>
          <AppTable.Head>
            <AppTable.Row>
              <AppTable.Th>Tarikh</AppTable.Th>
              <AppTable.Th>Arah Angin</AppTable.Th>
              <AppTable.Th>Kelajuan (kn)</AppTable.Th>
              <AppTable.Th>Gust (kn)</AppTable.Th>
              <AppTable.Th>Ombak (m)</AppTable.Th>
              <AppTable.Th>Tempoh (s)</AppTable.Th>
            </AppTable.Row>
          </AppTable.Head>
          <AppTable.Body>
            {data.slice(0, 7).map((p, i) => (
              <AppTable.Row key={i}>
                <AppTable.Td>{formatDateDDMMYYYY(p.date)}</AppTable.Td>
                <AppTable.Td>{p.windDirection}</AppTable.Td>
                <AppTable.Td>{p.windSpeed}</AppTable.Td>
                <AppTable.Td>{p.windGusts}</AppTable.Td>
                <AppTable.Td>{p.waveHeight}</AppTable.Td>
                <AppTable.Td>{p.wavePeriod}</AppTable.Td>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      )}
    </section>
  );
}

export function AnginOmbakPage() {
  const today = toLocalDateString(new Date());
  const picker = useStationPicker('angin-ombak');
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-wind-wave', picker.selectedStationId, today],
    queryFn: () => getWindWave(picker.selectedStationId, today, today),
    enabled: Boolean(picker.selectedStationId),
  });

  if (picker.isError)
    return (
      <PageShell>
        <PageHeader title="Angin & Ombak" subtitle="Maklumat keadaan angin dan ombak." />
        <ErrorState
          title="Ralat Memuatkan Senarai Stesen"
          message={
            picker.error instanceof Error
              ? picker.error.message
              : 'Gagal mendapatkan senarai stesen.'
          }
        />
      </PageShell>
    );

  if (picker.isLoading || (isLoading && Boolean(picker.selectedStationId)))
    return (
      <PageShell>
        <PageHeader title="Angin & Ombak" subtitle="Maklumat keadaan angin dan ombak." />
        <LoadingState lines={5} />
      </PageShell>
    );
  if (isError)
    return (
      <PageShell>
        <PageHeader title="Angin & Ombak" subtitle="Maklumat keadaan angin dan ombak." />
        <ErrorState
          title="Ralat Memuatkan Angin & Ombak"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </PageShell>
    );

  const points = data?.data ?? [];
  const current = points[0];

  return (
    <PageShell>
      <PageHeader
        title="Angin & Ombak"
        subtitle="Maklumat keadaan angin dan ombak untuk membantu operasi di laut."
      />
      <div className="mb-6">
        <label
          htmlFor="angin-ombak-station"
          className="mb-1 block text-xs uppercase tracking-wide text-text-muted"
        >
          Stesen
        </label>
        <StationSelect
          id="angin-ombak-station"
          stations={picker.stations}
          value={picker.selectedStationId ?? ''}
          onChange={(e) => picker.setStationId(e.target.value)}
        />
      </div>
      {current && (
        <section aria-label="Visual angin dan ombak" className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="surface px-3 py-4">
              <SectionTitle>Arah Angin</SectionTitle>
              <WindCompass
                direction={current.windDirection}
                speed={current.windSpeed}
                gusts={current.windGusts}
              />
            </div>
            <div className="surface px-3 py-4">
              <SectionTitle>Ketinggian Ombak</SectionTitle>
              <WaveVisual height={current.waveHeight} period={current.wavePeriod} />
            </div>
          </div>
        </section>
      )}
      <RingkasanHariIni data={points} />
      <JadualRamalan data={points} />
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
      <section className="mb-8">
        <InfoPanel title="Mengapa Angin dan Ombak Penting">
          <p>
            Angin dan ombak adalah dua faktor utama yang menentukan keselamatan operasi di laut.
          </p>
        </InfoPanel>
      </section>
    </PageShell>
  );
}
