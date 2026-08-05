import {
  PageHeader,
  SectionTitle,
  AppTable,
  InfoPanel,
  EmptyState,
  MarineConditionCard,
  MarineSummaryGrid,
  OperationalStatusCard,
  OperationalRecommendationCard,
  OperationalLegend,
} from '../../shared/components';

/* ── Section 2: Ringkasan Hari Ini ── */
function RingkasanHariIni() {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="📅" title="Tarikh Masihi" value="—" />
        <MarineConditionCard icon="🕌" title="Tarikh Hijrah" value="—" />
        <MarineConditionCard icon="🌙" title="Fasa Bulan" value="—" />
        <MarineConditionCard icon="🌊" title="Jenis Air" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 3: Ringkasan Keadaan Laut ── */
function RingkasanKeadaanLaut() {
  return (
    <section aria-label="Ringkasan keadaan laut" className="mb-8">
      <SectionTitle>Ringkasan Keadaan Laut</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌦️" title="Cuaca" value="—" />
        <MarineConditionCard icon="💨" title="Angin" value="—" />
        <MarineConditionCard icon="🌊" title="Ombak" value="—" />
        <MarineConditionCard icon="☀️" title="Matahari" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 6: Jadual Operasi Harian ── */
function JadualOperasiHarian() {
  const headers = [
    'Hari',
    'Tarikh',
    'Hijrah',
    'Pasang Surut',
    'Fasa Bulan',
    'Cuaca',
    'Angin',
    'Ombak',
    'Matahari',
    'Status Operasi',
    'Cadangan Operasi',
  ];

  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));

  return (
    <section aria-label="Jadual operasi harian" className="mb-8">
      <SectionTitle>Jadual Operasi Harian</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            {headers.map((h) => (
              <AppTable.Th key={h}>{h}</AppTable.Th>
            ))}
          </AppTable.Row>
        </AppTable.Head>
        <AppTable.Body>
          {rows.map((row) => (
            <AppTable.Row key={row.id}>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
              <AppTable.Td>—</AppTable.Td>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Section 8: Info Panel ── */
function InfoPanels() {
  return (
    <section aria-label="Maklumat kalendar operasi" className="mb-8 space-y-4">
      <InfoPanel title="Bagaimana Menggunakan Kalendar Operasi">
        <p>
          Kalendar Operasi menggabungkan maklumat pasang surut, fasa bulan, cuaca,
          angin, ombak dan waktu matahari dalam satu paparan harian. Pegawai boleh
          menyemak status operasi harian dan cadangan operasi sebelum merancang
          rondaan atau operasi laut.
        </p>
      </InfoPanel>

      <InfoPanel title="Merancang Rondaan dan Operasi">
        <p>
          Gunakan Jadual Operasi Harian untuk mengenal pasti hari dan waktu yang
          paling sesuai untuk rondaan. Status operasi dan cadangan operasi membantu
          pegawai membuat keputusan yang selamat berdasarkan keadaan laut dan cuaca
          semasa. Sentiasa rujuk petunjuk status untuk memahami tahap keselamatan
          sebelum beroperasi.
        </p>
      </InfoPanel>
    </section>
  );
}

/* ── Section 9: Future Integration ── */
function FutureIntegration() {
  return (
    <section aria-label="Integrasi masa depan" className="space-y-4">
      <EmptyState
        title="API Awam"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Pembekal Cuaca"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Pembekal Pasang Surut"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Pembekal Astronomi"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
    </section>
  );
}

/* ── Main Page ── */
export function KalendarOperasiPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Kalendar Operasi"
        subtitle="Ringkasan harian untuk membantu perancangan operasi laut."
      />

      {/* 2. Ringkasan Hari Ini */}
      <RingkasanHariIni />

      {/* 3. Ringkasan Keadaan Laut */}
      <RingkasanKeadaanLaut />

      {/* 4. OperationalStatusCard */}
      <section aria-label="Status operasi" className="mb-8">
        <OperationalStatusCard variant="neutral" />
      </section>

      {/* 5. OperationalRecommendationCard */}
      <section aria-label="Cadangan operasi" className="mb-8">
        <OperationalRecommendationCard variant="placeholder" />
      </section>

      {/* 6. Jadual Operasi Harian */}
      <JadualOperasiHarian />

      {/* 7. OperationalLegend */}
      <section aria-label="Petunjuk status" className="mb-8">
        <OperationalLegend />
      </section>

      {/* 8. Info Panels */}
      <InfoPanels />

      {/* 9. Future Integration */}
      <FutureIntegration />
    </div>
  );
}
