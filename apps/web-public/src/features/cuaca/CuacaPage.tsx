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
} from '../../shared/components';
import { getWeather, type WeatherDataPoint } from './cuaca.api';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function RingkasanHariIni({ data }: { data: WeatherDataPoint[] }) {
  const today = toLocalDateString(new Date());
  const current = data.find((p) => p.date === today) || data[0];

  return (
    <section aria-label="Ringkasan cuaca hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌤️" title="Keadaan Cuaca" value={current?.conditions ?? '—'} />
        <MarineConditionCard
          icon="🌡️"
          title="Suhu"
          value={current ? `${current.temperature}°C` : '—'}
        />
        <MarineConditionCard icon="💧" title="Kelembapan" value="—" />
        <MarineConditionCard
          icon="👁️"
          title="Jarak Penglihatan"
          value={current ? `${current.visibility} km` : '—'}
        />
      </MarineSummaryGrid>
    </section>
  );
}

function RamalanCuaca({ data }: { data: WeatherDataPoint[] }) {
  return (
    <section aria-label="Ramalan cuaca" className="mb-8">
      <SectionTitle>Ramalan Cuaca</SectionTitle>
      {data.length === 0 ? (
        <EmptyState title="Tiada Data" message="Data cuaca tidak tersedia." />
      ) : (
        <AppTable>
          <AppTable.Head>
            <AppTable.Row>
              <AppTable.Th>Tarikh</AppTable.Th>
              <AppTable.Th>Cuaca</AppTable.Th>
              <AppTable.Th>Suhu (°C)</AppTable.Th>
              <AppTable.Th>Penglihatan (km)</AppTable.Th>
              <AppTable.Th>Hujan (mm)</AppTable.Th>
            </AppTable.Row>
          </AppTable.Head>
          <AppTable.Body>
            {data.slice(0, 7).map((p, i) => (
              <AppTable.Row key={i}>
                <AppTable.Td>{p.date}</AppTable.Td>
                <AppTable.Td>{p.conditions}</AppTable.Td>
                <AppTable.Td>{p.temperature}</AppTable.Td>
                <AppTable.Td>{p.visibility}</AppTable.Td>
                <AppTable.Td>{p.precipitation}</AppTable.Td>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      )}
    </section>
  );
}

export function CuacaPage() {
  const today = toLocalDateString(new Date());
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-weather', today],
    queryFn: () => getWeather(undefined, today, today),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader
          title="Cuaca Marin"
          subtitle="Keadaan cuaca semasa dan ramalan ringkas untuk operasi laut."
        />
        <LoadingState lines={5} />
      </div>
    );
  if (isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader
          title="Cuaca Marin"
          subtitle="Keadaan cuaca semasa dan ramalan ringkas untuk operasi laut."
        />
        <ErrorState
          title="Ralat"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </div>
    );

  const points = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Cuaca Marin"
        subtitle="Keadaan cuaca semasa dan ramalan ringkas untuk operasi laut."
      />
      <RingkasanHariIni data={points} />
      <RamalanCuaca data={points} />
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
        <InfoPanel title="Mengapa Cuaca Penting">
          <p>Cuaca adalah faktor utama yang mempengaruhi keselamatan operasi di laut.</p>
        </InfoPanel>
      </section>
    </div>
  );
}
