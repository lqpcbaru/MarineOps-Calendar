import { useQuery } from '@tanstack/react-query';
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
  OperationalStatusCard,
  OperationalRecommendationCard,
  OperationalLegend,
} from '../../shared/components';
import { getSunData, type SunDataPoint } from './matahari.api';

function RingkasanHariIni({ data }: { data: SunDataPoint | null }) {
  return (
    <section aria-label="Ringkasan matahari" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌅" title="Matahari Terbit" value={data?.sunrise ?? '—'} />
        <MarineConditionCard icon="🌇" title="Matahari Terbenam" value={data?.sunset ?? '—'} />
        <MarineConditionCard icon="☀️" title="Tengah Hari" value={data?.solarNoon ?? '—'} />
        <MarineConditionCard icon="⏱️" title="Tempoh Siang" value={data?.daylightDuration ?? '—'} />
      </MarineSummaryGrid>
    </section>
  );
}

function JadualHarian({ data }: { data: SunDataPoint | null }) {
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
            <AppTable.Td>{data.sunrise}</AppTable.Td>
            <AppTable.Td>{data.sunset}</AppTable.Td>
            <AppTable.Td>{data.solarNoon}</AppTable.Td>
            <AppTable.Td>{data.daylightDuration}</AppTable.Td>
          </AppTable.Row>
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

export function MatahariPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-sun', today],
    queryFn: () => getSunData(undefined, today),
  });

  if (isLoading)
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
        <ErrorState
          title="Ralat"
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
      <RingkasanHariIni data={sunData} />
      <JadualHarian data={sunData} />
      <section className="mb-8">
        <OperationalStatusCard variant="neutral" />
      </section>
      <section className="mb-8">
        <OperationalRecommendationCard variant="placeholder" />
      </section>
      <section className="mb-8">
        <OperationalLegend />
      </section>
      <section className="mb-8 space-y-4">
        <InfoPanel title="Mengapa Waktu Matahari Penting">
          <p>Waktu matahari menentukan tempoh cahaya siang yang tersedia untuk operasi di laut.</p>
        </InfoPanel>
        <InfoPanel title="Perancangan Rondaan">
          <p>
            Rondaan siang sesuai untuk pemantauan umum. Rondaan malam sesuai untuk operasi khas.
          </p>
        </InfoPanel>
      </section>
    </div>
  );
}
