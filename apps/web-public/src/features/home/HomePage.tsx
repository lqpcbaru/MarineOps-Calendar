import { useQuery } from '@tanstack/react-query';
import {
  PageShell,
  PageHeader,
  SectionTitle,
  MarineSummaryGrid,
  MarineConditionCard,
  OperationalStatusCard,
  OperationalRecommendationCard,
  QuickNav,
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StationSelect,
} from '../../shared/components';
import { useStationPicker } from '../../shared/hooks/use-station-picker';
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

const quickNavItems = [
  { to: '/pasang-surut', label: 'Pasang Surut', icon: 'tide' as const },
  { to: '/cuaca', label: 'Cuaca', icon: 'weather' as const },
  { to: '/angin-ombak', label: 'Angin & Ombak', icon: 'wind' as const },
  { to: '/fasa-bulan', label: 'Fasa Bulan', icon: 'moon' as const },
  { to: '/matahari', label: 'Matahari', icon: 'sun' as const },
  { to: '/kalendar-operasi', label: 'Kalendar Operasi', icon: 'calendar' as const },
  { to: '/stesen', label: 'Stesen', icon: 'station' as const },
  { to: '/amaran-marin', label: 'Amaran Marin', icon: 'alert' as const },
] as const;

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
      <PageShell width="narrow">
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
      <PageShell width="narrow">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <LoadingState lines={6} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell width="narrow">
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
      <PageShell width="narrow">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <EmptyState title="Tiada Data" message="Data dashboard tidak tersedia buat masa ini." />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <PageHeader title="Pusat Operasi" subtitle={formatDate(data.date)} />

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
      <section aria-label="Status operasi" className="mb-6">
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

      {/* Metric strip */}
      <section aria-label="Keadaan marin" className="mb-6">
        <SectionTitle>Keadaan Marin</SectionTitle>
        <MarineSummaryGrid columns={3}>
          <MarineConditionCard
            icon="tide"
            title="Pasang Surut"
            value={data.tide ? data.tide.type : '—'}
            subtitle={
              data.tide
                ? `Pasang ${data.tide.nextHigh?.time ?? '—'} · Surut ${data.tide.nextLow?.time ?? '—'}`
                : 'Data tidak tersedia'
            }
          />
          <MarineConditionCard
            icon="weather"
            title="Cuaca"
            value={data.weather ? `${data.weather.temperature}°C` : '—'}
            subtitle={data.weather ? data.weather.conditions : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            icon="wind"
            title="Angin"
            value={data.wind ? `${data.wind.speed} kn` : '—'}
            subtitle={data.wind ? `Arah: ${data.wind.direction}` : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            icon="tide"
            title="Ombak"
            value={data.wave ? `${data.wave.height} m` : '—'}
            subtitle={data.wave ? 'Ketinggian ombak' : 'Data tidak tersedia'}
          />
          <MarineConditionCard
            icon="moon"
            title="Fasa Bulan"
            value={data.moon ? `${data.moon.illumination}%` : '—'}
            subtitle={data.moon ? data.moon.phaseName : 'Data tidak tersedia'}
          />
        </MarineSummaryGrid>
      </section>

      {/* Alerts & advisories */}
      {(data.warnings.length > 0 || data.advisories.length > 0) && (
        <section aria-label="Amaran dan nasihat" className="mb-6">
          <SectionTitle>Amaran & Nasihat</SectionTitle>
          <div className="space-y-2">
            {data.warnings.map((w, i) => (
              <div
                key={`w-${i}`}
                className="flex items-start gap-2.5 rounded-md border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger-text"
              >
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
            {data.advisories.map((a, i) => (
              <div
                key={`a-${i}`}
                className="flex items-start gap-2.5 rounded-md border border-caution-border bg-caution-bg px-3 py-2.5 text-sm text-caution-text"
              >
                <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendation */}
      {data.recommendation && data.recommendation !== '—' && (
        <section aria-label="Cadangan operasi" className="mb-6">
          <SectionTitle>Cadangan Operasi</SectionTitle>
          <OperationalRecommendationCard
            variant="information"
            title="Cadangan Operasi"
            message={data.recommendation}
          />
        </section>
      )}

      {/* Navigation */}
      <section aria-label="Navigasi" className="mb-6 border-t border-border-subtle pt-5">
        <SectionTitle>Navigasi</SectionTitle>
        <QuickNav items={quickNavItems} />
      </section>
    </PageShell>
  );
}
