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
import { getTide, type TideDataPoint } from './pasang-surut.api';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function TodaySummary({ data }: { data: TideDataPoint[] }) {
  const today = toLocalDateString(new Date());
  const todayPoints = data.filter((p) => p.date === today);
  const high = todayPoints.find((p) => p.type === 'HIGH');
  const low = todayPoints.find((p) => p.type === 'LOW');

  return (
    <section aria-label="Ringkasan hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard
          icon="🌊"
          title="Jenis Air"
          value={todayPoints.length > 0 ? (high ? 'Pasang' : 'Surut') : '—'}
        />
        <MarineConditionCard
          icon="⬆️"
          title="Pasang Tinggi"
          value={high ? `${high.height}m` : '—'}
          subtitle={high?.time ?? ''}
        />
        <MarineConditionCard
          icon="⬇️"
          title="Surut Rendah"
          value={low ? `${low.height}m` : '—'}
          subtitle={low?.time ?? ''}
        />
        <MarineConditionCard
          icon="📊"
          title="Titik Data"
          value={String(todayPoints.length)}
          subtitle="hari ini"
        />
      </MarineSummaryGrid>
    </section>
  );
}

function TideTable({ data }: { data: TideDataPoint[] }) {
  const rows = data.slice(0, 14);

  return (
    <section aria-label="Jadual pasang surut" className="mb-8">
      <SectionTitle>Jadual Pasang Surut</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState title="Tiada Data" message="Data pasang surut tidak tersedia." />
      ) : (
        <AppTable>
          <AppTable.Head>
            <AppTable.Row>
              <AppTable.Th>Tarikh</AppTable.Th>
              <AppTable.Th>Masa</AppTable.Th>
              <AppTable.Th>Jenis</AppTable.Th>
              <AppTable.Th>Ketinggian (m)</AppTable.Th>
            </AppTable.Row>
          </AppTable.Head>
          <AppTable.Body>
            {rows.map((p, i) => (
              <AppTable.Row key={i}>
                <AppTable.Td>{p.date}</AppTable.Td>
                <AppTable.Td>{p.time}</AppTable.Td>
                <AppTable.Td>{p.type === 'HIGH' ? '🟢 Pasang' : '🔴 Surut'}</AppTable.Td>
                <AppTable.Td>{p.height}</AppTable.Td>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      )}
    </section>
  );
}

export function PasangSurutPage() {
  const today = toLocalDateString(new Date());
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-tide', today],
    queryFn: () => getTide(undefined, today, today),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader
          title="Pasang Surut"
          subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
        />
        <LoadingState lines={5} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader
          title="Pasang Surut"
          subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
        />
        <ErrorState
          title="Ralat Memuatkan Pasang Surut"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </div>
    );
  }

  const points = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Pasang Surut"
        subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
      />
      <TodaySummary data={points} />
      <TideTable data={points} />
      <section aria-label="Cadangan operasi" className="mb-8">
        <div className="card-flat flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Semakan status dan cadangan operasi tersedia di Amaran Marin.
          </p>
          <Link to="/amaran-marin" className="btn-primary" aria-label="Ke halaman Amaran Marin">
            Amaran Marin
          </Link>
        </div>
      </section>
      <section aria-label="Petunjuk status" className="mb-8">
        <OperationalLegend />
      </section>
      <section aria-label="Maklumat pasang surut" className="mb-8">
        <InfoPanel title="Mengapa Penting kepada Operasi Laut">
          <p>
            Pengetahuan tentang pasang surut adalah penting untuk keselamatan pelayaran, perancangan
            operasi perikanan, dan aktiviti maritim.
          </p>
        </InfoPanel>
      </section>
    </div>
  );
}
