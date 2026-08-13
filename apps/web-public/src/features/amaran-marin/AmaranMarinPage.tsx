import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  SectionTitle,
  AppCard,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '../../shared/components';
import {
  getRecommendation,
  type OperationalRecommendation,
  type RuleResult,
} from './amaran-marin.api';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function statusLabel(status: string): string {
  switch (status) {
    case 'SAFE':
      return 'Selamat';
    case 'CAUTION':
      return 'Berhati-hati';
    case 'WARNING':
      return 'Amaran';
    case 'UNSAFE':
      return 'Tidak Selamat';
    default:
      return 'Tidak Diketahui';
  }
}

function ruleStatusVariant(status: string): 'hijau' | 'kuning' | 'merah' | 'neutral' {
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

function StationContext({ rec }: { rec: OperationalRecommendation }) {
  const stationLabel =
    rec.stationName && rec.stationName !== '—' ? rec.stationName : 'Tidak Diketahui';
  return (
    <div className="mb-4 text-sm text-text-secondary">
      Stesen: <span className="text-text-primary">{stationLabel}</span> · Tarikh:{' '}
      <span className="text-text-primary">{rec.date}</span>
    </div>
  );
}

function RuleDetails({ rules }: { rules: RuleResult[] }) {
  if (!rules || rules.length === 0) return null;
  return (
    <section aria-label="Butiran penilaian" className="mb-6">
      <SectionTitle>Butiran Penilaian</SectionTitle>
      <div className="space-y-2">
        {rules.map((r) => (
          <AppCard key={r.ruleId} variant="flat">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text-primary">{r.ruleName}</p>
                <p className="text-sm text-text-secondary">{r.message}</p>
              </div>
              <StatusBadge variant={ruleStatusVariant(r.status)}>
                {statusLabel(r.status)}
              </StatusBadge>
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

export function AmaranMarinPage() {
  const today = new Date();
  const dateStr = toLocalDateString(today);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-recommendation', dateStr],
    queryFn: () => getRecommendation(undefined, dateStr, dateStr),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Amaran Marin"
        subtitle="Amaran dan notis keselamatan marin yang sedang berkuat kuasa."
      />

      {isLoading && <LoadingState lines={6} />}

      {isError && (
        <ErrorState
          title="Ralat Memuatkan Amaran"
          message={
            error instanceof Error ? error.message : 'Gagal mendapatkan maklumat amaran marin.'
          }
        />
      )}

      {!isLoading && !isError && (!data || data.data.length === 0) && (
        <EmptyState
          title="Tiada Maklumat Amaran"
          message="Tiada maklumat penilaian marin tersedia untuk tarikh ini."
        />
      )}

      {!isLoading &&
        !isError &&
        data &&
        data.data.length > 0 &&
        data.data.map((rec) => (
          <div key={`${rec.stationId}-${rec.date}`} className="mb-6">
            <StationContext rec={rec} />

            {/* Overall status */}
            <section aria-label="Status keseluruhan" className="mb-6">
              <AppCard variant="flat">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Status Semasa</p>
                    <StatusBadge variant={mapStatusVariant(rec.overallStatus)}>
                      {statusLabel(rec.overallStatus)}
                    </StatusBadge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-muted">Skor Penilaian</p>
                    <p className="text-xl font-bold text-text-primary">{rec.overallScore}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {rec.recommendation}
                </p>
              </AppCard>
            </section>

            {/* Warnings */}
            {rec.warnings.length > 0 && (
              <section aria-label="Amaran" className="mb-6">
                <SectionTitle>Amaran</SectionTitle>
                <div className="space-y-2">
                  {rec.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-danger-400/30 bg-danger-400/5 px-4 py-3 text-sm text-text-primary"
                    >
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Advisories */}
            {rec.advisories.length > 0 && (
              <section aria-label="Nasihat" className="mb-6">
                <SectionTitle>Nasihat</SectionTitle>
                <div className="space-y-2">
                  {rec.advisories.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-warning-400/30 bg-warning-400/5 px-4 py-3 text-sm text-text-primary"
                    >
                      ℹ️ {a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No warnings/advisories and SAFE */}
            {rec.warnings.length === 0 &&
              rec.advisories.length === 0 &&
              rec.overallStatus === 'SAFE' && (
                <p className="mb-6 text-sm text-text-secondary">
                  Tiada amaran operasi daripada sistem penilaian.
                </p>
              )}

            {/* Unknown */}
            {rec.overallStatus === 'UNKNOWN' && (
              <p className="mb-6 text-sm text-text-secondary">
                Maklumat tidak mencukupi untuk penilaian.
              </p>
            )}

            <RuleDetails rules={rec.ruleResults} />
          </div>
        ))}
    </div>
  );
}
