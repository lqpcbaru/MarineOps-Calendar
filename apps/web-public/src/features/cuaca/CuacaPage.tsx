import {
  PageHeader,
  AppCard,
  SectionTitle,
  AppTable,
  InfoPanel,
  EmptyState,
} from '../../shared/components';

/* ── Section 2: Ringkasan Hari Ini ── */
function RingkasanHariIni() {
  const items = [
    { label: 'Keadaan Cuaca', value: '—', icon: '🌤️' },
    { label: 'Suhu', value: '—', icon: '🌡️' },
    { label: 'Kelembapan', value: '—', icon: '💧' },
    { label: 'Jarak Penglihatan', value: '—', icon: '👁️' },
  ];

  return (
    <section aria-label="Ringkasan cuaca hari ini" className="mb-8">
      <SectionTitle>Ringkasan Hari Ini</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <AppCard key={item.label} variant="flat">
            <div className="text-center">
              <span aria-hidden="true" className="mb-1 block text-2xl">
                {item.icon}
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold text-text-primary">
                {item.value}
              </p>
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

/* ── Section 3: Ramalan Cuaca ── */
function RamalanCuaca() {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    hari: '—',
    tarikh: '—',
    cuaca: '—',
    suhuMin: '—',
    suhuMax: '—',
    hujan: '—',
    cadangan: '—',
  }));

  return (
    <section aria-label="Ramalan cuaca" className="mb-8">
      <SectionTitle>Ramalan Cuaca</SectionTitle>
      <AppTable>
        <AppTable.Head>
          <AppTable.Row>
            <AppTable.Th>Hari</AppTable.Th>
            <AppTable.Th>Tarikh</AppTable.Th>
            <AppTable.Th>Cuaca</AppTable.Th>
            <AppTable.Th>Suhu Minimum</AppTable.Th>
            <AppTable.Th>Suhu Maksimum</AppTable.Th>
            <AppTable.Th>Kebarangkalian Hujan</AppTable.Th>
            <AppTable.Th>Cadangan Operasi</AppTable.Th>
          </AppTable.Row>
        </AppTable.Head>
        <AppTable.Body>
          {rows.map((row) => (
            <AppTable.Row key={row.id}>
              <AppTable.Td>{row.hari}</AppTable.Td>
              <AppTable.Td>{row.tarikh}</AppTable.Td>
              <AppTable.Td>{row.cuaca}</AppTable.Td>
              <AppTable.Td>{row.suhuMin}</AppTable.Td>
              <AppTable.Td>{row.suhuMax}</AppTable.Td>
              <AppTable.Td>{row.hujan}</AppTable.Td>
              <AppTable.Td>{row.cadangan}</AppTable.Td>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </section>
  );
}

/* ── Main Page ── */
export function CuacaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. PageHeader */}
      <PageHeader
        title="Cuaca Marin"
        subtitle="Keadaan cuaca semasa dan ramalan ringkas untuk operasi laut."
      />

      {/* 2. Ringkasan Hari Ini */}
      <RingkasanHariIni />

      {/* 3. Ramalan Cuaca */}
      <RamalanCuaca />

      {/* 4. InfoPanel */}
      <section aria-label="Maklumat cuaca" className="mb-8">
        <InfoPanel title="Mengapa Cuaca Penting kepada Operasi Laut">
          <p>
            Cuaca adalah faktor utama yang mempengaruhi keselamatan dan kejayaan
            operasi di laut. Keadaan cuaca buruk seperti ribut, hujan lebat, dan
            kabus tebal boleh mengurangkan jarak penglihatan, meningkatkan risiko
            kemalangan, dan membahayakan nyawa anak kapal.
          </p>
          <p className="mt-3">
            Perubahan cuaca yang mendadak juga boleh menjejaskan kestabilan kapal
            dan mengganggu aktiviti perikanan. Oleh itu, pemantauan cuaca yang
            berterusan dan ramalan yang tepat adalah penting untuk memastikan
            operasi laut dijalankan dengan selamat dan cekap.
          </p>
        </InfoPanel>
      </section>

      {/* 5. EmptyState — future integration */}
      <section aria-label="Integrasi masa depan">
        <EmptyState
          title="Integrasi Pembekal Cuaca"
          message="Maklumat akan dipaparkan selepas modul ini disepadukan."
        />
      </section>
    </div>
  );
}
