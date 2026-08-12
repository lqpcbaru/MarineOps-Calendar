import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  SectionTitle,
  AppCard,
  MarineSummaryGrid,
  MarineConditionCard,
  OperationalStatusCard,
  OperationalRecommendationCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../shared/components';
import { getPublicDashboard, type DashboardResponse } from './dashboard.api';

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

/* ── Header Summary ── */
function HeaderSummary({ data }: { data: DashboardResponse }) {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-6">
      <AppCard variant="flat">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-muted">Hari</p>
            <p className="text-xl font-bold text-text-primary">{formatDate(data.date)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Tarikh</p>
            <p className="text-xl font-bold text-text-primary">{data.date}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Tarikh Hijrah</p>
            <p className="text-xl font-bold text-text-muted">Tidak Tersedia</p>
          </div>
        </div>
      </AppCard>
    </section>
  );
}

/* ── Summary Cards ── */
function SummaryCards({ data }: { data: DashboardResponse }) {
  const tide = data.tide;
  const weather = data.weather;
  const wind = data.wind;
  const wave = data.wave;
  const moon = data.moon;

  return (
    <section aria-label="Ringkasan modul" className="mb-6">
      <MarineSummaryGrid columns={3}>
        <MarineConditionCard
          icon="🌊"
          title="Pasang Surut"
          value={tide ? tide.type : '—'}
          subtitle={
            tide
              ? `Pasang ${tide.nextHigh?.time ?? '—'} • Surut ${tide.nextLow?.time ?? '—'}`
              : 'Data tidak tersedia'
          }
        />
        <MarineConditionCard
          icon="🌤️"
          title="Cuaca"
          value={weather ? `${weather.temperature}°C` : '—'}
          subtitle={weather ? weather.conditions : 'Data tidak tersedia'}
        />
        <MarineConditionCard
          icon="💨"
          title="Angin"
          value={wind ? `${wind.speed} kn` : '—'}
          subtitle={wind ? `Arah: ${wind.direction}` : 'Data tidak tersedia'}
        />
        <MarineConditionCard
          icon="🌊"
          title="Ombak"
          value={wave ? `${wave.height} m` : '—'}
          subtitle={wave ? 'Ketinggian ombak' : 'Data tidak tersedia'}
        />
        <MarineConditionCard
          icon="🌙"
          title="Fasa Bulan"
          value={moon ? `${moon.illumination}%` : '—'}
          subtitle={moon ? moon.phaseName : 'Data tidak tersedia'}
        />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Quick Navigation ── */
const quickNavItems = [
  { to: '/pasang-surut', label: 'Pasang Surut', icon: '🌊' },
  { to: '/cuaca', label: 'Cuaca', icon: '🌤️' },
  { to: '/angin-ombak', label: 'Angin & Ombak', icon: '💨' },
  { to: '/fasa-bulan', label: 'Fasa Bulan', icon: '🌙' },
  { to: '/matahari', label: 'Matahari', icon: '☀️' },
  { to: '/kalendar-operasi', label: 'Kalendar Operasi', icon: '📅' },
  { to: '/stesen', label: 'Stesen', icon: '📍' },
  { to: '/amaran-marin', label: 'Amaran Marin', icon: '⚠️' },
] as const;

function QuickNav() {
  return (
    <section aria-label="Navigasi pantas">
      <SectionTitle>Navigasi Pantas</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickNavItems.map((item) => (
          <Link key={item.to} to={item.to} className="quick-nav-btn" aria-label={item.label}>
            <span className="quick-nav-btn-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="quick-nav-btn-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-dashboard'],
    queryFn: () => getPublicDashboard(),
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <LoadingState lines={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <ErrorState
          title="Ralat Memuatkan Dashboard"
          message={error instanceof Error ? error.message : 'Gagal mendapatkan data dashboard.'}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />
        <EmptyState title="Tiada Data" message="Data dashboard tidak tersedia buat masa ini." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Pusat Operasi" subtitle="Ringkasan keadaan marin hari ini" />

      <HeaderSummary data={data} />

      <section aria-label="Status operasi hari ini" className="mb-6">
        <SectionTitle>Status Operasi Hari Ini</SectionTitle>
        <OperationalStatusCard
          variant={mapStatusVariant(data.operationalStatus)}
          title={data.operationalStatus}
          subtitle={`Skor: ${data.overallScore}`}
        />
      </section>

      <SummaryCards data={data} />

      <section aria-label="Cadangan operasi" className="mb-6">
        <SectionTitle>Cadangan Operasi</SectionTitle>
        {data.recommendation && data.recommendation !== '—' ? (
          <OperationalRecommendationCard
            variant="information"
            title="Cadangan Operasi"
            message={data.recommendation}
          />
        ) : (
          <EmptyState
            title="Tiada Cadangan"
            message="Cadangan operasi tidak tersedia buat masa ini."
          />
        )}
        {data.warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {data.warnings.map((w, i) => (
              <div
                key={i}
                className="rounded-lg border border-warning-400/30 bg-warning-400/5 px-4 py-2 text-sm text-warning-400"
              >
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}
        {data.advisories.length > 0 && (
          <div className="mt-3 space-y-1">
            {data.advisories.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border border-marine-600 px-4 py-2 text-sm text-text-secondary"
              >
                ℹ️ {a}
              </div>
            ))}
          </div>
        )}
      </section>

      <QuickNav />
    </div>
  );
}
