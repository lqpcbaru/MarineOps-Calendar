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

/* ── Section 2: Today's Summary ── */
function TodaySummary() {
  return (
    <section aria-label="Ringkasan hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌊" title="Jenis Air" value="—" />
        <MarineConditionCard icon="🌙" title="Fasa Bulan" value="—" />
        <MarineConditionCard icon="📅" title="Tarikh Hijrah" value="—" />
        <MarineConditionCard icon="📋" title="Status Operasi" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 3: Tide Table ── */
function TideTable() {
  const headers = [
    'Hari',
    'Tarikh',
    'Hijrah',
    'Fasa Bulan',
    'Jenis Air',
    'Pasang Pagi',
    'Surut Pagi',
    'Pasang Petang',
    'Surut Malam',
    'Cadangan Operasi',
  ];

  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));

  return (
    <section aria-label="Jadual pasang surut" className="mb-8">
      <SectionTitle>Jadual Pasang Surut</SectionTitle>
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
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Section 5: Information Panel ── */
function InfoPanels() {
  return (
    <section aria-label="Maklumat pasang surut" className="mb-8 space-y-4">
      <InfoPanel title="Apa itu Air Besar">
        <p>
          Air Besar berlaku apabila paras air laut berada di tahap tertinggi dalam
          kitaran pasang surut. Pada masa ini, air laut naik ke paras maksimum sebelum
          mula surut semula. Air Besar penting untuk mengetahui paras air maksimum
          yang boleh dijangkakan bagi tujuan pelayaran dan operasi di laut.
        </p>
      </InfoPanel>

      <InfoPanel title="Apa itu Air Mati">
        <p>
          Air Mati berlaku apabila paras air laut berada di tahap terendah dalam
          kitaran pasang surut. Pada masa ini, air laut surut ke paras minimum sebelum
          mula pasang semula. Air Mati penting untuk mengetahui paras air minimum
          yang boleh dijangkakan bagi tujuan pelayaran dan operasi di laut.
        </p>
      </InfoPanel>

      <InfoPanel title="Mengapa Penting kepada Operasi Laut">
        <p>
          Pengetahuan tentang pasang surut adalah penting untuk keselamatan pelayaran,
          perancangan operasi perikanan, dan aktiviti maritim. Paras air yang mencukupi
          diperlukan untuk laluan selamat kapal, manakala waktu surut mempengaruhi
          akses ke kawasan cetek dan muara sungai. Perancangan operasi yang mengambil
          kira pasang surut dapat mengurangkan risiko kandas dan memastikan keselamatan
          anak kapal.
        </p>
      </InfoPanel>
    </section>
  );
}

/* ── Section 6: Future Integration ── */
function FutureIntegration() {
  return (
    <section aria-label="Integrasi masa depan" className="mb-8 space-y-4">
      <EmptyState
        title="Cuaca"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Angin"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Ombak"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Cadangan AI"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
    </section>
  );
}

/* ── Main Page ── */
export function PasangSurutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Pasang Surut"
        subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
      />

      {/* 2. Today's Summary */}
      <TodaySummary />

      {/* 3. Tide Table */}
      <TideTable />

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
