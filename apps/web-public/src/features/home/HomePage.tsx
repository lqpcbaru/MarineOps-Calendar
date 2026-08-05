import { Link } from '@tanstack/react-router';

/* ── Section 1: Header Summary ── */
function HeaderSummary() {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-6">
      <div className="card-flat">
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
      </div>
    </section>
  );
}

/* ── Section 2: Status Operasi ── */
function StatusOperasi() {
  return (
    <section aria-label="Status operasi hari ini" className="mb-6">
      <h2 className="section-heading">Status Operasi Hari Ini</h2>
      <div className="status-card status-card-caution">
        <div className="status-card-icon" aria-hidden="true">🟡</div>
        <p className="status-card-title">Berwaspada</p>
        <p className="status-card-subtitle">
          Maklumat status operasi akan dipaparkan di sini.
        </p>
      </div>
    </section>
  );
}

/* ── Section 3–7: Summary Cards ── */
interface SummaryCardProps {
  title: string;
  icon: string;
  placeholder: string;
}

function SummaryCard({ title, icon, placeholder }: SummaryCardProps) {
  return (
    <section aria-label={title}>
      <div className="card-flat">
        <div className="flex items-center gap-2 mb-3">
          <span aria-hidden="true" className="text-xl">{icon}</span>
          <h2 className="section-heading mb-0">{title}</h2>
        </div>
        <div className="placeholder-content">
          <p>{placeholder}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Section 8: Cadangan Operasi ── */
function CadanganOperasi() {
  return (
    <section aria-label="Cadangan operasi" className="mb-6">
      <h2 className="section-heading">Cadangan Operasi</h2>
      <div className="card-flat">
        <div className="placeholder-content">
          <p>Maklumat operasi akan dipaparkan di sini.</p>
        </div>
      </div>
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
      <h2 className="section-heading">Navigasi Pantas</h2>
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
      {/* Page heading */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Pusat Operasi
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          Ringkasan keadaan marin hari ini
        </p>
      </div>

      {/* 1. Header Summary */}
      <HeaderSummary />

      {/* 2. Status Operasi */}
      <StatusOperasi />

      {/* 3–7: Summary Cards Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Ringkasan Pasang Surut"
          icon="🌊"
          placeholder="Data pasang surut akan dipaparkan di sini."
        />
        <SummaryCard
          title="Ringkasan Cuaca"
          icon="🌤️"
          placeholder="Data cuaca akan dipaparkan di sini."
        />
        <SummaryCard
          title="Ringkasan Angin"
          icon="💨"
          placeholder="Data angin akan dipaparkan di sini."
        />
        <SummaryCard
          title="Ringkasan Ombak"
          icon="🌊"
          placeholder="Data ombak akan dipaparkan di sini."
        />
        <SummaryCard
          title="Fasa Bulan"
          icon="🌙"
          placeholder="Data fasa bulan akan dipaparkan di sini."
        />
      </div>

      {/* 8. Cadangan Operasi */}
      <CadanganOperasi />

      {/* 9. Quick Navigation */}
      <QuickNav />
    </div>
  );
}
