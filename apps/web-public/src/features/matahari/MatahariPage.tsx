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
    <section aria-label="Ringkasan waktu matahari hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌅" title="Matahari Terbit" value="—" />
        <MarineConditionCard icon="🌇" title="Matahari Terbenam" value="—" />
        <MarineConditionCard icon="☀️" title="Tempoh Siang" value="—" />
        <MarineConditionCard icon="🌙" title="Tempoh Malam" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 3: Jadual Harian ── */
function JadualHarian() {
  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));

  return (
    <section aria-label="Jadual harian matahari" className="mb-8">
      <SectionTitle>Jadual Harian</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Hari</AppTable.Th>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Matahari Terbit</AppTable.Th>
            <AppTable.Th>Matahari Terbenam</AppTable.Th>
            <AppTable.Th>Tempoh Siang</AppTable.Th>
            <AppTable.Th>Tempoh Malam</AppTable.Th>
            <AppTable.Th>Cadangan Operasi</AppTable.Th>
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
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Section 7: Info Panels ── */
function InfoPanels() {
  return (
    <section aria-label="Maklumat waktu matahari" className="mb-8 space-y-4">
      <InfoPanel title="Mengapa Waktu Matahari Penting kepada Operasi Laut">
        <p>
          Waktu matahari menentukan tempoh cahaya siang yang tersedia untuk operasi
          di laut. Cahaya matahari yang mencukupi adalah penting untuk penglihatan
          yang jelas, navigasi yang selamat, dan koordinasi antara anggota pasukan.
          Operasi yang dijalankan pada waktu siang mempunyai tahap keselamatan yang
          lebih tinggi berbanding operasi malam.
        </p>
      </InfoPanel>

      <InfoPanel title="Hubungan Cahaya Siang dengan Keselamatan Operasi">
        <p>
          Cahaya siang yang baik membolehkan pegawai melihat keadaan laut, mengenal
          pasti bahaya, dan memantau aktiviti di sekeliling dengan lebih berkesan.
          Sebaliknya, operasi pada waktu malam atau cahaya malap memerlukan peralatan
          tambahan seperti lampu navigasi, radar, dan termal untuk menampung kekurangan
          penglihatan semula jadi. Oleh itu, perancangan operasi yang mengambil kira
          waktu matahari terbit dan terbenam dapat meningkatkan keselamatan dan
          keberkesanan misi.
        </p>
      </InfoPanel>

      <InfoPanel title="Perancangan Rondaan Siang dan Malam">
        <p>
          Rondaan siang sesuai untuk pemantauan umum, penguatkuasaan, dan aktiviti
          yang memerlukan penglihatan jelas. Rondaan malam pula sesuai untuk operasi
          khas yang memerlukan kejutan atau pengawasan rahsia. Pemilihan masa operasi
          yang betul mengikut waktu matahari dapat memaksimumkan keberkesanan
          penguatkuasaan dan meminimumkan risiko kepada anggota pasukan.
        </p>
      </InfoPanel>
    </section>
  );
}

/* ── Section 8: Future Integration ── */
function FutureIntegration() {
  return (
    <section aria-label="Integrasi masa depan" className="space-y-4">
      <EmptyState
        title="Data Astronomi"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Sunrise API"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Sunset API"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
    </section>
  );
}

/* ── Main Page ── */
export function MatahariPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Matahari"
        subtitle="Maklumat waktu matahari untuk membantu perancangan operasi laut."
      />

      {/* 2. Ringkasan Hari Ini */}
      <RingkasanHariIni />

      {/* 3. Jadual Harian */}
      <JadualHarian />

      {/* 4. OperationalStatusCard */}
      <section aria-label="Status operasi" className="mb-8">
        <OperationalStatusCard variant="neutral" />
      </section>

      {/* 5. OperationalRecommendationCard */}
      <section aria-label="Cadangan operasi" className="mb-8">
        <OperationalRecommendationCard variant="placeholder" />
      </section>

      {/* 6. OperationalLegend */}
      <section aria-label="Petunjuk status" className="mb-8">
        <OperationalLegend />
      </section>

      {/* 7. InfoPanels */}
      <InfoPanels />

      {/* 8. Future Integration */}
      <FutureIntegration />
    </div>
  );
}
