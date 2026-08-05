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
    <section aria-label="Ringkasan angin dan ombak hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🧭" title="Arah Angin" value="—" />
        <MarineConditionCard icon="💨" title="Kelajuan Angin" value="—" />
        <MarineConditionCard icon="🌊" title="Ketinggian Ombak" value="—" />
        <MarineConditionCard icon="⏱️" title="Tempoh Ombak" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 3: Jadual Ramalan ── */
function JadualRamalan() {
  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));

  return (
    <section aria-label="Jadual ramalan angin dan ombak" className="mb-8">
      <SectionTitle>Jadual Ramalan</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Hari</AppTable.Th>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Arah Angin</AppTable.Th>
            <AppTable.Th>Kelajuan</AppTable.Th>
            <AppTable.Th>Ketinggian Ombak</AppTable.Th>
            <AppTable.Th>Tempoh Ombak</AppTable.Th>
            <AppTable.Th>Tahap Risiko</AppTable.Th>
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
              <AppTable.Td>—</AppTable.Td>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Main Page ── */
export function AnginOmbakPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Angin & Ombak"
        subtitle="Maklumat keadaan angin dan ombak untuk membantu operasi di laut."
      />

      {/* 2. Ringkasan Hari Ini */}
      <RingkasanHariIni />

      {/* 3. Jadual Ramalan */}
      <JadualRamalan />

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

      {/* 7. InfoPanel */}
      <section aria-label="Maklumat angin dan ombak" className="mb-8">
        <InfoPanel title="Mengapa Angin dan Ombak Penting kepada Keselamatan Operasi Laut">
          <p>
            Angin dan ombak adalah dua faktor utama yang menentukan keselamatan
            operasi di laut. Angin kencang boleh menghasilkan ombak besar yang
            membahayakan bot kecil dan menyukarkan pergerakan kapal.
          </p>
          <p className="mt-3">
            Ketinggian ombak yang berlebihan boleh menyebabkan kapal terumbang-ambing,
            mengurangkan kestabilan, dan meningkatkan risiko kemasukan air. Tempoh
            ombak yang pendek menandakan ombak yang curam dan berbahaya, manakala
            tempoh yang panjang menandakan ombak yang lebih teratur.
          </p>
          <p className="mt-3">
            Oleh itu, pemantauan arah angin, kelajuan angin, ketinggian ombak, dan
            tempoh ombak adalah penting untuk memastikan keselamatan anak kapal
            dan kejayaan operasi maritim.
          </p>
        </InfoPanel>
      </section>

      {/* 8. EmptyState */}
      <section aria-label="Integrasi masa depan">
        <EmptyState
          title="Data Angin & Ombak Secara Langsung"
          message="Maklumat akan dipaparkan selepas modul ini disepadukan."
        />
      </section>
    </div>
  );
}
