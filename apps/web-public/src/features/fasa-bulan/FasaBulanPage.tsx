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
    <section aria-label="Ringkasan fasa bulan hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <MarineSummaryGrid columns={4}>
        <MarineConditionCard icon="🌙" title="Fasa Bulan" value="—" />
        <MarineConditionCard icon="📆" title="Umur Bulan" value="—" />
        <MarineConditionCard icon="✨" title="Pencahayaan Bulan" value="—" />
        <MarineConditionCard icon="🕌" title="Tarikh Hijrah" value="—" />
      </MarineSummaryGrid>
    </section>
  );
}

/* ── Section 3: Jadual Fasa Bulan ── */
function JadualFasaBulan() {
  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));

  return (
    <section aria-label="Jadual fasa bulan" className="mb-8">
      <SectionTitle>Jadual Fasa Bulan</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Hari</AppTable.Th>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Tarikh Hijrah</AppTable.Th>
            <AppTable.Th>Fasa Bulan</AppTable.Th>
            <AppTable.Th>Umur Bulan</AppTable.Th>
            <AppTable.Th>Pencahayaan</AppTable.Th>
            <AppTable.Th>Hubungan Dengan Pasang Surut</AppTable.Th>
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

/* ── Section 7: Info Panels ── */
function InfoPanels() {
  return (
    <section aria-label="Maklumat fasa bulan" className="mb-8 space-y-4">
      <InfoPanel title="Apakah Fasa Bulan">
        <p>
          Fasa bulan merujuk kepada bentuk cahaya bulan yang kelihatan dari bumi
          pada sesuatu masa. Bulan mengambil masa kira-kira 29.5 hari untuk melengkapkan
          satu kitaran penuh, daripada bulan baharu hingga bulan penuh dan kembali
          semula kepada bulan baharu. Kitaran ini dikenali sebagai bulan sinodik.
        </p>
      </InfoPanel>

      <InfoPanel title="Hubungan Fasa Bulan dengan Air Besar">
        <p>
          Air Besar berlaku apabila bulan berada dalam fasa bulan baharu dan bulan
          penuh. Pada masa ini, tarikan graviti bulan dan matahari berada dalam garis
          lurus, menyebabkan pasang surut yang lebih tinggi daripada biasa. Ini dikenali
          sebagai pasang perbani (spring tide).
        </p>
      </InfoPanel>

      <InfoPanel title="Hubungan Fasa Bulan dengan Air Mati">
        <p>
          Air Mati berlaku apabila bulan berada dalam fasa suku pertama dan suku
          ketiga. Pada masa ini, tarikan graviti bulan dan matahari berserenjang,
          menyebabkan pasang surut yang lebih rendah daripada biasa. Ini dikenali
          sebagai pasang surut neap (neap tide).
        </p>
      </InfoPanel>

      <InfoPanel title="Mengapa Penting kepada Operasi Perikanan dan Penguatkuasaan">
        <p>
          Pengetahuan tentang fasa bulan membantu pegawai perikanan dan penguatkuasa
          merancang operasi dengan lebih berkesan. Air Besar membolehkan kapal masuk
          ke kawasan cetek, manakala Air Mati mendedahkan kawasan yang biasanya tenggelam.
          Perancangan operasi yang mengambil kira fasa bulan dapat meningkatkan
          keselamatan dan kejayaan misi.
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
        title="Kalendar Hijrah"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
      <EmptyState
        title="Integrasi Pasang Surut"
        message="Maklumat akan dipaparkan selepas modul ini disepadukan."
      />
    </section>
  );
}

/* ── Main Page ── */
export function FasaBulanPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Fasa Bulan"
        subtitle="Maklumat fasa bulan untuk membantu memahami keadaan pasang surut dan operasi laut."
      />

      {/* 2. Ringkasan Hari Ini */}
      <RingkasanHariIni />

      {/* 3. Jadual Fasa Bulan */}
      <JadualFasaBulan />

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
