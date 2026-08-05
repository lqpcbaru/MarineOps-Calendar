import { Link } from '@tanstack/react-router';
import {
  PageHeader,
  SectionTitle,
  AppCard,
  MarineSummaryGrid,
  MarineConditionCard,
  OperationalStatusCard,
  OperationalRecommendationCard,
} from '../../shared/components';

/* ── Section 1: Header Summary ── */
function HeaderSummary() {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-6">
      <AppCard variant="flat">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-muted">Hari</p>
            <p className="text-xl font-bold text-text-primary">—</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Tarikh</p>
            <p className="text-xl font-bold text-text-primary">—</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Tarikh Hijrah</p>
            <p className="text-xl font-bold text-text-primary">—</p>
          </div>
        </div>
      </AppCard>
    </section>
  );
}

/* ── Section 3–7: Summary Cards ── */
function SummaryCards() {
  return (
    <section aria-label="Ringkasan modul" className="mb-6">
      <MarineSummaryGrid columns={3}>
        <MarineConditionCard
          icon="🌊"
          title="Ringkasan Pasang Surut"
          value="—"
          subtitle="Data pasang surut akan dipaparkan di sini."
        />
        <MarineConditionCard
          icon="🌤️"
          title="Ringkasan Cuaca"
          value="—"
          subtitle="Data cuaca akan dipaparkan di sini."
        />
        <MarineConditionCard
          icon="💨"
          title="Ringkasan Angin"
          value="—"
          subtitle="Data angin akan dipaparkan di sini."
        />
        <MarineConditionCard
          icon="🌊"
          title="Ringkasan Ombak"
          value="—"
          subtitle="Data ombak akan dipaparkan di sini."
        />
        <MarineConditionCard
          icon="🌙"
          title="Fasa Bulan"
          value="—"
          subtitle="Data fasa bulan akan dipaparkan di sini."
        />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 9: Quick Navigation ── */
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
            <span className="quick-nav-btn-icon" aria-hidden="true">{item.icon}</span>
            <span className="quick-nav-btn-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Pusat Operasi"
        subtitle="Ringkasan keadaan marin hari ini"
      />

      {/* 2. Header Summary */}
      <HeaderSummary />

      {/* 3. Status Operasi */}
      <section aria-label="Status operasi hari ini" className="mb-6">
        <SectionTitle>Status Operasi Hari Ini</SectionTitle>
        <OperationalStatusCard variant="kuning" />
      </section>

      {/* 4–8. Summary Cards */}
      <SummaryCards />

      {/* 9. Cadangan Operasi */}
      <section aria-label="Cadangan operasi" className="mb-6">
        <SectionTitle>Cadangan Operasi</SectionTitle>
        <OperationalRecommendationCard variant="placeholder" />
      </section>

      {/* 10. Quick Navigation */}
      <QuickNav />
    </div>
  );
}
