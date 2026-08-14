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
        <MarineConditionCard icon="🧭" title="Arah Angin" value={current?.windDirection ?? '—'} />
        <MarineConditionCard
          icon="💨"
          title="Kelajuan Angin"
          value={current ? `${current.windSpeed} kn` : '—'}
          subtitle={current ? `Gust ${current.windGusts} kn` : ''}
        />
        <MarineConditionCard
          icon="🌊"
          title="Ketinggian Ombak"
          value={current ? `${current.waveHeight} m` : '—'}
        />
        <MarineConditionCard
          icon="⏱️"
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
                <AppTable.Td>{p.date}</AppTable.Td>
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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-wind-wave', today],
    queryFn: () => getWindWave(undefined, today, today),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Angin & Ombak" subtitle="Maklumat keadaan angin dan ombak." />
        <LoadingState lines={5} />
      </div>
    );
  if (isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Angin & Ombak" subtitle="Maklumat keadaan angin dan ombak." />
        <ErrorState
          title="Ralat Memuatkan Angin & Ombak"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </div>
    );

  const points = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Angin & Ombak"
        subtitle="Maklumat keadaan angin dan ombak untuk membantu operasi di laut."
      />
      <RingkasanHariIni data={points} />
      <JadualRamalan data={points} />
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
      <section className="mb-8">
        <InfoPanel title="Mengapa Angin dan Ombak Penting">
          <p>
            Angin dan ombak adalah dua faktor utama yang menentukan keselamatan operasi di laut.
          </p>
        </InfoPanel>
      </section>
    </div>
  );
}
