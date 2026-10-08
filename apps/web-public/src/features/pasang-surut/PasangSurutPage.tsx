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
  TideChart,
} from '../../shared/components';
import { useStationPicker } from '../../shared/hooks/use-station-picker';
import { formatDateDDMMYYYY } from '../../shared/format/station-time';
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
          icon="tide"
          title="Jenis Air"
          value={todayPoints.length > 0 ? (high ? 'Pasang' : 'Surut') : '—'}
        />
        <MarineConditionCard
          icon="arrow-up"
          title="Pasang Tinggi"
          value={high ? `${high.height}m` : '—'}
          subtitle={high?.time ?? ''}
        />
        <MarineConditionCard
          icon="arrow-down"
          title="Surut Rendah"
          value={low ? `${low.height}m` : '—'}
          subtitle={low?.time ?? ''}
        />
        <MarineConditionCard
          icon="gauge"
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
                <AppTable.Td>{formatDateDDMMYYYY(p.date)}</AppTable.Td>
                <AppTable.Td>{p.time}</AppTable.Td>
                <AppTable.Td>{p.type === 'HIGH' ? 'Pasang' : 'Surut'}</AppTable.Td>
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
  const picker = useStationPicker('pasang-surut');
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-tide', picker.selectedStationId, today],
    queryFn: () => getTide(picker.selectedStationId, today, today),
    enabled: Boolean(picker.selectedStationId),
  });

  if (picker.isError) {
    return (
      <PageShell>
        <PageHeader
          title="Pasang Surut"
          subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
        />
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
  }

  if (picker.isLoading || (isLoading && Boolean(picker.selectedStationId))) {
    return (
      <PageShell>
        <PageHeader
          title="Pasang Surut"
          subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
        />
        <LoadingState lines={5} />
      </PageShell>
    );
  }
  if (isError) {
    return (
      <PageShell>
        <PageHeader
          title="Pasang Surut"
          subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
        />
        <ErrorState
          title="Ralat Memuatkan Pasang Surut"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data.'}
        />
      </PageShell>
    );
  }

  const points = data?.data ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Pasang Surut"
        subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
      />
      <div className="mb-6">
        <label
          htmlFor="tide-station"
          className="mb-1 block text-xs uppercase tracking-wide text-text-muted"
        >
          Stesen
        </label>
        <StationSelect
          id="tide-station"
          stations={picker.stations}
          value={picker.selectedStationId ?? ''}
          onChange={(e) => picker.setStationId(e.target.value)}
        />
      </div>
      <section aria-label="Graf pasang surut" className="mb-8">
        <SectionTitle>Graf Pasang Surut Hari Ini</SectionTitle>
        <div className="surface px-3 py-4">
          <TideChart data={points} />
        </div>
      </section>
      <TodaySummary data={points} />
      <TideTable data={points} />
      <section aria-label="Cadangan operasi" className="mb-8">
        <Link
          to="/amaran-marin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-accent hover:text-ocean-300"
        >
          Semakan status dan cadangan operasi
        </Link>
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
    </PageShell>
  );
}
