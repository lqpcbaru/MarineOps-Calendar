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
import { getMoonPhase, type MoonDataPoint } from './fasa-bulan.api';

function RingkasanHariIni({ data }: { data: MoonDataPoint | null }) {
  return (
    <section aria-label="Ringkasan fasa bulan" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌙" title="Fasa Bulan" value={data?.phaseName ?? '—'} />
        <MarineConditionCard
          icon="✨"
          title="Pencahayaan"
          value={data ? `${data.illumination}%` : '—'}
        />
        <MarineConditionCard
          icon="📆"
          title="Umur Bulan"
          value={data ? `${data.ageDays} hari` : '—'}
        />
        <MarineConditionCard icon="🌅" title="Bulan Terbit" value={data?.moonrise ?? '—'} />
      </MarineSummaryGrid>
    </section>
  );
}

function JadualFasa({ data }: { data: MoonDataPoint | null }) {
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
            <AppTable.Td>{data.date}</AppTable.Td>
            <AppTable.Td>{data.phaseName}</AppTable.Td>
            <AppTable.Td>{data.illumination}%</AppTable.Td>
            <AppTable.Td>{data.ageDays}</AppTable.Td>
            <AppTable.Td>{data.moonrise ?? '—'}</AppTable.Td>
            <AppTable.Td>{data.moonset ?? '—'}</AppTable.Td>
          </AppTable.Row>
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

export function FasaBulanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-moon', today],
    queryFn: () => getMoonPhase(undefined, today),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Fasa Bulan" subtitle="Maklumat fasa bulan." />
        <LoadingState lines={5} />
      </div>
    );
  if (isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PageHeader title="Fasa Bulan" subtitle="Maklumat fasa bulan." />
        <ErrorState
          title="Ralat"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </div>
    );

  const moonData = data?.data ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Fasa Bulan"
        subtitle="Maklumat fasa bulan untuk membantu memahami keadaan pasang surut dan operasi laut."
      />
      <RingkasanHariIni data={moonData} />
      <JadualFasa data={moonData} />
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
        <InfoPanel title="Hubungan Fasa Bulan dengan Air Besar">
          <p>Air Besar berlaku apabila bulan berada dalam fasa bulan baharu dan bulan penuh.</p>
        </InfoPanel>
        <InfoPanel title="Hubungan Fasa Bulan dengan Air Mati">
          <p>Air Mati berlaku apabila bulan berada dalam fasa suku pertama dan suku ketiga.</p>
        </InfoPanel>
      </section>
    </div>
  );
}
