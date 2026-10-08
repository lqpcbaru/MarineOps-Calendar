import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageShell,
  PageHeader,
  SectionTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  StationSelect,
  AppButton,
  Icon,
} from '../../shared/components';
import { getCalendar, type DailyOperationalRecord } from './kalendar-operasi.api';
import { formatStationTime } from '../../shared/format/station-time';
import { getStations } from '../stesen/stesen.api';

const DAYS_BM = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const DAYS_BM_SHORT = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
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

const WEEK_DAYS = 7;

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDay(dateStr: string): { dayNum: number; dayShort: string; monthShort: string } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    dayNum: d.getDate(),
    dayShort: DAYS_BM_SHORT[d.getDay()] ?? String(d.getDate()),
    monthShort: (MONTHS_BM[d.getMonth()] ?? '').slice(0, 3),
  };
}

function isToday(dateStr: string): boolean {
  return dateStr === toLocalDateString(new Date());
}

/* ── Semantic data-freshness status, derived from the record's contract ── */
type FreshnessStatus = 'fresh' | 'stale' | 'unavailable';

function freshnessStatus(r: DailyOperationalRecord): FreshnessStatus {
  return r.freshness?.status ?? 'unavailable';
}

function freshnessLabel(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'Data segar';
    case 'stale':
      return 'Data lama';
    case 'unavailable':
      return 'Tiada data';
  }
}

function freshnessDotClass(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'bg-status-safe';
    case 'stale':
      return 'bg-status-caution';
    case 'unavailable':
      return 'bg-text-muted';
  }
}

/* ── Condensed indicator glyph inside a day cell ── */
function CellIndicator({ label, value }: { label?: string; value?: string | null }) {
  if (!value || value === '—') return null;
  return (
    <span className="truncate text-[11px] leading-tight text-text-secondary" title={label}>
      {value}
    </span>
  );
}

/* ── Week strip: the calendar's focal surface ── */
function WeekStrip({
  records,
  selected,
  onSelect,
  timezone,
}: {
  records: DailyOperationalRecord[];
  selected: string;
  onSelect: (date: string) => void;
  timezone: string | undefined;
}) {
  return (
    <div
      className="grid grid-cols-7 gap-px overflow-x-auto rounded-md border border-border-subtle bg-border-subtle"
      role="listbox"
      aria-label="Minggu operasi"
    >
      {records.map((r) => {
        const { dayNum, dayShort, monthShort } = parseDay(r.date);
        const active = r.date === selected;
        const today = isToday(r.date);
        const fresh = freshnessStatus(r);

        return (
          <button
            key={r.date}
            type="button"
            role="option"
            aria-selected={active}
            aria-label={`${dayShort} ${dayNum} ${monthShort}${today ? ' (hari ini)' : ''}`}
            onClick={() => onSelect(r.date)}
            className={`flex min-w-[5.25rem] flex-col gap-1 bg-surface-raised px-2 py-2.5 text-left transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ocean-400 ${
              active ? 'bg-marine-800 ring-1 ring-inset ring-ocean-400' : 'hover:bg-marine-800/60'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span
                className={`text-[11px] font-medium uppercase ${
                  today ? 'text-ocean-400' : 'text-text-muted'
                }`}
              >
                {dayShort}
              </span>
              <span className="text-sm font-semibold tabular-nums text-text-primary">{dayNum}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-text-muted">
              {monthShort}
            </span>

            <div className="mt-1 flex flex-col gap-0.5">
              {r.tide?.nextHigh && (
                <CellIndicator
                  label="Pasang tinggi"
                  value={`▲ ${formatStationTime(r.tide.nextHigh.time, timezone)} ${r.tide.nextHigh.height}m`}
                />
              )}
              {r.tide?.nextLow && (
                <CellIndicator
                  label="Surut rendah"
                  value={`▼ ${formatStationTime(r.tide.nextLow.time, timezone)} ${r.tide.nextLow.height}m`}
                />
              )}
              {r.windWave && (
                <CellIndicator
                  label="Angin / ombak"
                  value={`${r.windWave.windSpeed}kn · ${r.windWave.waveHeight}m`}
                />
              )}
              {r.weather && <CellIndicator label="Suhu" value={`${r.weather.temperature}°C`} />}
              {r.moon && (
                <CellIndicator
                  label="Bulan"
                  value={`${r.moon.phaseName} ${r.moon.illumination}%`}
                />
              )}
              {r.sun && (
                <CellIndicator
                  label="Matahari terbenam"
                  value={formatStationTime(r.sun.sunset, timezone)}
                />
              )}
            </div>

            {/* Footer: today marker + semantic data-freshness dot */}
            <span className="mt-auto flex items-center gap-1 pt-1">
              <span
                className={`h-1.5 w-1.5 rounded-full ${freshnessDotClass(fresh)}`}
                title={freshnessLabel(fresh)}
                aria-hidden="true"
              />
              {today && <span className="h-0.5 w-5 rounded-full bg-ocean-400" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Selected-day detail ── */
function DayDetail({
  record,
  timezone,
}: {
  record: DailyOperationalRecord;
  timezone: string | undefined;
}) {
  const { dayNum, monthShort } = parseDay(record.date);
  const fullDay = DAYS_BM[new Date(record.date + 'T00:00:00').getDay()] ?? '';
  const rows: { label: string; value: string }[] = [
    { label: 'Tarikh Masihi', value: `${fullDay}, ${dayNum} ${monthShort}` },
    {
      label: 'Tarikh Hijrah',
      value: record.hijriDate !== '—' ? record.hijriDate : 'Tidak Tersedia',
    },
    {
      label: 'Pasang Surut',
      value: record.tide
        ? record.tide.nextHigh
          ? `Pasang ${record.tide.nextHigh.height}m @ ${formatStationTime(record.tide.nextHigh.time, timezone)}`
          : record.tide.type
        : '—',
    },
    {
      label: 'Cuaca',
      value: record.weather
        ? `${record.weather.conditions} · ${record.weather.temperature}°C`
        : '—',
    },
    {
      label: 'Angin',
      value: record.windWave
        ? `${record.windWave.windDirection} ${record.windWave.windSpeed} kn (gust ${record.windWave.windGusts} kn)`
        : '—',
    },
    {
      label: 'Ombak',
      value: record.windWave
        ? `${record.windWave.waveHeight} m · tempoh ${record.windWave.wavePeriod}s`
        : '—',
    },
    {
      label: 'Fasa Bulan',
      value: record.moon ? `${record.moon.phaseName} · ${record.moon.illumination}%` : '—',
    },
    {
      label: 'Matahari',
      value: record.sun
        ? `${formatStationTime(record.sun.sunrise, timezone)} → ${formatStationTime(record.sun.sunset, timezone)}`
        : '—',
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label} className="bg-surface-raised px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-text-muted">{row.label}</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Week-range label (e.g. "08 — 14 September 2026") ── */
function formatWeekRange(from: string, to: string): string {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} — ${b.getDate()} ${MONTHS_BM[a.getMonth()]} ${a.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} ${MONTHS_BM[a.getMonth()]} — ${b.getDate()} ${MONTHS_BM[b.getMonth()]} ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS_BM[a.getMonth()]} ${a.getFullYear()} — ${b.getDate()} ${
    MONTHS_BM[b.getMonth()]
  } ${b.getFullYear()}`;
}

export function KalendarOperasiPage() {
  // The visible week is anchored on a movable date, defaulting to today.
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const anchorDate = toLocalDateString(anchor);

  const dateFrom = anchorDate;
  const dateTo = (() => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + (WEEK_DAYS - 1));
    return toLocalDateString(d);
  })();

  const [stationId, setStationId] = useState<string | undefined>(undefined);

  const stationsQuery = useQuery({
    queryKey: ['public-stations', 'for-calendar'],
    queryFn: () => getStations(1, 100),
  });
  const stations = stationsQuery.data?.stations ?? [];
  const selectedStationId = stationId ?? stations[0]?.id;
  const selectedTimezone = stations.find((s) => s.id === selectedStationId)?.timezone;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-calendar', selectedStationId, dateFrom, dateTo],
    queryFn: () => getCalendar(selectedStationId, dateFrom, dateTo),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(selectedStationId),
  });

  const records = data?.data ?? [];
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const selectedRecord = records.find((r) => r.date === selectedDate) ?? records[0] ?? null;

  const weekLabel =
    records.length > 0 ? formatWeekRange(records[0]!.date, records[records.length - 1]!.date) : '';

  const shiftWeek = (delta: number) => {
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * WEEK_DAYS);
      return next;
    });
    setSelectedDate(undefined);
  };

  const goToToday = () => {
    setAnchor(new Date());
    setSelectedDate(undefined);
  };

  const isCurrentWeek = useMemo(() => anchorDate === toLocalDateString(new Date()), [anchorDate]);

  if (stationsQuery.isLoading || (isLoading && Boolean(selectedStationId))) {
    return (
      <PageShell width="wide">
        <PageHeader
          title="Kalendar Operasi"
          subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
        />
        <LoadingState lines={8} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell width="wide">
        <PageHeader
          title="Kalendar Operasi"
          subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
        />
        <ErrorState
          title="Ralat Memuatkan Kalendar"
          message={
            error instanceof Error ? error.message : 'Gagal mendapatkan data kalendar operasi.'
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title="Kalendar Operasi"
        subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
      />

      {/* Station + week navigation controls */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {stations.length > 0 && (
          <div>
            <label
              htmlFor="calendar-station"
              className="mb-1 block text-xs uppercase tracking-wide text-text-muted"
            >
              Stesen
            </label>
            <StationSelect
              id="calendar-station"
              stations={stations}
              value={selectedStationId ?? ''}
              onChange={(e) => setStationId(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <AppButton variant="secondary" size="sm" onClick={() => shiftWeek(-1)}>
            <Icon name="chevron-left" size={16} />
            <span className="sr-only sm:not-sr-only">Minggu lepas</span>
          </AppButton>
          <AppButton variant="secondary" size="sm" onClick={() => shiftWeek(1)}>
            <span className="sr-only sm:not-sr-only">Minggu depan</span>
            <Icon name="chevron-right" size={16} />
          </AppButton>
          <AppButton variant="ghost" size="sm" onClick={goToToday} disabled={isCurrentWeek}>
            Hari Ini
          </AppButton>
        </div>
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="Tiada Data"
          message="Data kalendar operasi tidak tersedia buat masa ini."
        />
      ) : (
        <>
          <section aria-label="Minggu operasi" className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
              <SectionTitle>Minggu Operasi</SectionTitle>
              <span className="text-xs text-text-muted">{weekLabel}</span>
            </div>
            <WeekStrip
              records={records}
              selected={selectedRecord?.date ?? ''}
              onSelect={setSelectedDate}
              timezone={selectedTimezone}
            />
          </section>

          {selectedRecord && (
            <section aria-label="Butiran hari" className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="calendar" size={14} className="text-text-muted" />
                <SectionTitle>Butiran Hari Terpilih</SectionTitle>
              </div>
              <DayDetail record={selectedRecord} timezone={selectedTimezone} />
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
