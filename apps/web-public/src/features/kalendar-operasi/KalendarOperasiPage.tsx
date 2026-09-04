import { useState } from 'react';
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
} from '../../shared/components';
import { getCalendar, type DailyOperationalRecord } from './kalendar-operasi.api';
import { formatStationTime } from '../../shared/format/station-time';
import { getStations } from '../stesen/stesen.api';

const DAYS_BM = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS_BM[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAYS_BM[d.getDay()] || dateStr;
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ── Summary Cards ── */
function RingkasanHariIni({ record }: { record: DailyOperationalRecord | null }) {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard
          icon="📅"
          title="Tarikh Masihi"
          value={record?.date ?? '—'}
          subtitle={record ? formatDate(record.date) : ''}
        />
        <MarineConditionCard
          icon="🕌"
          title="Tarikh Hijrah"
          value={record?.hijriDate !== '—' ? record!.hijriDate : 'Tidak Tersedia'}
        />
        <MarineConditionCard
          icon="🌙"
          title="Fasa Bulan"
          value={record?.moon?.phaseName ?? 'Tidak Tersedia'}
          subtitle={record?.moon ? `${record.moon.illumination}%` : ''}
        />
        <MarineConditionCard
          icon="🌊"
          title="Jenis Air"
          value={record?.tide?.type ?? 'Tidak Tersedia'}
        />
      </MarineSummaryGrid>
    </section>
  );
}

function RingkasanKeadaanLaut({
  record,
  timezone,
}: {
  record: DailyOperationalRecord | null;
  timezone: string | undefined;
}) {
  return (
    <section aria-label="Ringkasan keadaan laut" className="mb-8">
      <SectionTitle>Ringkasan Keadaan Laut</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard
          icon="🌦️"
          title="Cuaca"
          value={record?.weather?.conditions ?? 'Tidak Tersedia'}
          subtitle={record?.weather ? `${record.weather.temperature}°C` : ''}
        />
        <MarineConditionCard
          icon="💨"
          title="Angin"
          value={record?.windWave ? `${record.windWave.windSpeed} kn` : 'Tidak Tersedia'}
          subtitle={record?.windWave?.windDirection ?? ''}
        />
        <MarineConditionCard
          icon="🌊"
          title="Ombak"
          value={record?.windWave ? `${record.windWave.waveHeight} m` : 'Tidak Tersedia'}
        />
        <MarineConditionCard
          icon="☀️"
          title="Matahari"
          value={
            record?.sun
              ? `${formatStationTime(record.sun.sunrise, timezone)} → ${formatStationTime(record.sun.sunset, timezone)}`
              : 'Tidak Tersedia'
          }
        />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Main Table ── */
function JadualOperasiHarian({
  data,
  timezone,
}: {
  data: DailyOperationalRecord[];
  timezone: string | undefined;
}) {
  if (data.length === 0) {
    return (
      <section aria-label="Jadual operasi harian" className="mb-8">
        <SectionTitle>Jadual Operasi Harian</SectionTitle>
        <EmptyState
          title="Tiada Data"
          message="Data kalendar operasi tidak tersedia buat masa ini."
        />
      </section>
    );
  }

  return (
    <section aria-label="Jadual operasi harian" className="mb-8">
      <SectionTitle>Jadual Operasi Harian</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Hari</AppTable.Th>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Pasang Surut</AppTable.Th>
            <AppTable.Th>Fasa Bulan</AppTable.Th>
            <AppTable.Th>Cuaca</AppTable.Th>
            <AppTable.Th>Angin</AppTable.Th>
            <AppTable.Th>Ombak</AppTable.Th>
            <AppTable.Th>Matahari</AppTable.Th>
          </AppTable.Row>
        </AppTable.Head>
        <AppTable.Body>
          {data.map((r) => (
            <AppTable.Row key={r.date}>
              <AppTable.Td>{formatDay(r.date)}</AppTable.Td>
              <AppTable.Td>{r.date}</AppTable.Td>
              <AppTable.Td>
                {r.tide
                  ? r.tide.nextHigh
                    ? `${r.tide.nextHigh.height}m @ ${r.tide.nextHigh.time}`
                    : r.tide.type
                  : '—'}
              </AppTable.Td>
              <AppTable.Td>
                {r.moon ? `${r.moon.phaseName} ${r.moon.illumination}%` : '—'}
              </AppTable.Td>
              <AppTable.Td>
                {r.weather ? `${r.weather.conditions} ${r.weather.temperature}°C` : '—'}
              </AppTable.Td>
              <AppTable.Td>
                {r.windWave ? `${r.windWave.windDirection} ${r.windWave.windSpeed}kn` : '—'}
              </AppTable.Td>
              <AppTable.Td>{r.windWave ? `${r.windWave.waveHeight}m` : '—'}</AppTable.Td>
              <AppTable.Td>
                {r.sun
                  ? `${formatStationTime(r.sun.sunrise, timezone)} → ${formatStationTime(r.sun.sunset, timezone)}`
                  : '—'}
              </AppTable.Td>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Info Panels ── */
function InfoPanels() {
  return (
    <section aria-label="Maklumat kalendar operasi" className="mb-8 space-y-4">
      <InfoPanel title="Bagaimana Menggunakan Kalendar Operasi">
        <p>
          Kalendar Operasi menggabungkan maklumat pasang surut, fasa bulan, cuaca, angin, ombak dan
          waktu matahari dalam satu paparan harian. Pegawai boleh menyemak keadaan laut yang
          dijangkakan sebelum merancang rondaan atau operasi.
        </p>
      </InfoPanel>
      <InfoPanel title="Merancang Rondaan dan Operasi">
        <p>
          Gunakan Jadual Operasi Harian untuk menyemak maklumat keadaan marin yang dijangkakan.
          Rujuk data pasang surut, kelajuan angin dan ketinggian ombak sebagai maklumat sokongan
          sebelum merancang operasi.
        </p>
      </InfoPanel>
    </section>
  );
}

/* ── Main Page ── */
export function KalendarOperasiPage() {
  const today = new Date();
  const dateFrom = toLocalDateString(today);
  const dateTo = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 6);
    return toLocalDateString(d);
  })();

  // The calendar's sun and moon columns are computed from the station's
  // coordinates, so without one they can only ever read "Tidak Tersedia" —
  // which is what this page showed for data that was in fact available.
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

  const stationPicker =
    stations.length > 0 ? (
      <div className="card-flat mb-6">
        <label htmlFor="calendar-station" className="mb-1 block text-sm text-text-secondary">
          Stesen
        </label>
        <select
          id="calendar-station"
          className="w-full rounded-lg border border-marine-600 bg-surface-raised px-3 py-2 text-text-primary focus:border-ocean-400 focus:outline-none sm:max-w-sm"
          value={selectedStationId ?? ''}
          onChange={(e) => setStationId(e.target.value)}
        >
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.code} — {station.name}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  if (stationsQuery.isLoading || (isLoading && Boolean(selectedStationId))) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Kalendar Operasi"
          subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
        />
        <LoadingState lines={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
      </div>
    );
  }

  const records = data?.data ?? [];
  const firstRecord = records[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Kalendar Operasi"
        subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
      />
      {stationPicker}
      <RingkasanHariIni record={firstRecord} />
      <RingkasanKeadaanLaut record={firstRecord} timezone={selectedTimezone} />
      <JadualOperasiHarian data={records} timezone={selectedTimezone} />
      <InfoPanels />
    </div>
  );
}
