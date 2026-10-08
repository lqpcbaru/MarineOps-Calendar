import { useQuery } from '@tanstack/react-query';
import {
  PageShell,
  PageHeader,
  SectionTitle,
  MarineSummaryGrid,
  MarineConditionCard,
  OperationalStatusCard,
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StationSelect,
} from '../../shared/components';
import { useStationPicker } from '../../shared/hooks/use-station-picker';
import { formatStationTime } from '../../shared/format/station-time';
import { getPublicDashboard } from './dashboard.api';

const DAYS_BM = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const MONTHS_BM = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS_BM[d.getDay()]} ${d.getDate()} ${MONTHS_BM[d.getMonth()]} ${d.getFullYear()}`;
}

function mapStatusVariant(status: string): 'hijau' | 'kuning' | 'merah' | 'neutral' {
  switch (status) {
    case 'SAFE':
      return 'hijau';
    case 'CAUTION':
      return 'kuning';
    case 'WARNING':
      return 'merah';
    case 'UNSAFE':
      return 'merah';
    default:
      return 'neutral';
  }
}

function statusTitle(status: string): string {
  switch (status) {
    case 'SAFE':
      return 'Sesuai Beroperasi';
    case 'CAUTION':
      return 'Berwaspada';
    case 'WARNING':
      return 'Amaran';
    case 'UNSAFE':
      return 'Tidak Disyorkan';
    default:
      return 'Tiada Status';
  }
}

export function HomePage() {
  const picker = useStationPicker('dashboard');
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-dashboard', picker.selectedStationId],
    queryFn: () => getPublicDashboard(picker.selectedStationId),
    enabled: Boolean(picker.selectedStationId),
    refetchInterval: 5 * 60 * 1000,
  });

  if (picker.isError) {
    return (
      <PageShell width="default">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
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
      <PageShell width="default">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <LoadingState lines={6} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell width="default">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <ErrorState
          title="Ralat Memuatkan Dashboard"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data dashboard.'}
        />
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell width="default">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <EmptyState title="Tiada Data" message="Data dashboard tidak tersedia buat masa ini." />
      </PageShell>
    );
  }

  return (
    <PageShell width="default">
      <PageHeader
        title="Pusat Operasi"
        subtitle={`${data.station.name ?? ''}${data.station.regionName ? ` · ${data.station.regionName}` : ''} · ${formatDate(data.date)}`}
      />

      <div className="mb-6">
        <label
          htmlFor="dashboard-station"
          className="mb-1 block text-xs uppercase tracking-wide text-text-muted"
        >
          Stesen
        </label>
        <StationSelect
          id="dashboard-station"
          stations={picker.stations}
          value={picker.selectedStationId ?? ''}
          onChange={(e) => picker.setStationId(e.target.value)}
        />
      </div>

      {/* Hero: operational status */}
      <section aria-label="Status operasi" className="mb-8">
        <OperationalStatusCard
          variant={mapStatusVariant(data.operationalStatus)}
          title={statusTitle(data.operationalStatus)}
          subtitle={
            data.recommendation && data.recommendation !== '—' ? data.recommendation : undefined
          }
          metricLabel="Skor"
          metricValue={String(data.overallScore)}
        />
      </section>

      {/* Current marine conditions */}
      <section aria-label="Keadaan marin" className="mb-8">
        <SectionTitle>Keadaan Marin</SectionTitle>
        <MarineSummaryGrid columns={4}>
          <MarineConditionCard
            title="Pasang Surut"
            value={data.tide ? data.tide.type : '—'}
            subtitle={
              data.tide
                ? `Pasang ${formatStationTime(data.tide.nextHigh?.time, picker.selectedTimezone)} · Surut ${formatStationTime(data.tide.nextLow?.time, picker.selectedTimezone)}`
                : 'Data tidak tersedia'
            }
          />
          <MarineConditionCard
            title="Cuaca"
            value={data.weather ? `${data.weather.temperature}°C` : '—'}
            subtitle={data.weather ? data.weather.conditions : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            title="Angin"
            value={data.wind ? `${data.wind.speed} kn` : '—'}
            subtitle={data.wind ? data.wind.direction : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            title="Ombak"
            value={data.wave ? `${data.wave.height} m` : '—'}
            subtitle={data.wave ? 'Ketinggian ombak' : 'Data tidak tersedia'}
          />
        </MarineSummaryGrid>
      </section>

      {/* Supporting environmental information */}
      <section aria-label="Maklumat sokongan" className="mb-8">
        <SectionTitle>Maklumat Sokongan</SectionTitle>
        <MarineSummaryGrid columns={2}>
          <MarineConditionCard
            title="Fasa Bulan"
            value={data.moon ? data.moon.phaseName : '—'}
            subtitle={data.moon ? `Pencahayaan ${data.moon.illumination}%` : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            title="Matahari"
            value={data.sun ? formatStationTime(data.sun.sunrise, picker.selectedTimezone) : '—'}
            subtitle={
              data.sun
                ? `Terbenam ${formatStationTime(data.sun.sunset, picker.selectedTimezone)}`
                : 'Data tidak tersedia'
            }
          />
        </MarineSummaryGrid>
      </section>

      {/* Alerts & advisories */}
      {(data.warnings.length > 0 || data.advisories.length > 0) && (
        <section aria-label="Amaran dan nasihat" className="mb-8">
          <SectionTitle>Amaran & Nasihat</SectionTitle>
          <ul className="space-y-2">
            {data.warnings.map((w, i) => (
              <li
                key={`w-${i}`}
                className="flex items-start gap-2.5 rounded-md border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger-text"
              >
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
            {data.advisories.map((a, i) => (
              <li
                key={`a-${i}`}
                className="flex items-start gap-2.5 rounded-md border border-caution-border bg-caution-bg px-3 py-2.5 text-sm text-caution-text"
              >
                <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
