/* ── Section 1: Header ── */
function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
        Pasang Surut
      </h1>
      <p className="mt-2 text-lg text-text-secondary">
        Maklumat pasang surut air laut mengikut stesen dan tarikh.
      </p>
    </div>
  );
}

/* ── Section 2: Today's Summary ── */
function TodaySummary() {
  const cards = [
    { label: 'Jenis Air', value: '—', icon: '🌊' },
    { label: 'Fasa Bulan', value: '—', icon: '🌙' },
    { label: 'Tarikh Hijrah', value: '—', icon: '📅' },
    { label: 'Status Operasi', value: '—', icon: '📋' },
  ];

  return (
    <section aria-label="Ringkasan hari ini" className="mb-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="tide-info-card">
            <span aria-hidden="true" className="text-2xl mb-1 block">{card.icon}</span>
            <p className="tide-info-label">{card.label}</p>
            <p className="tide-info-value">{card.value}</p>
          </div>
        ))}
      </div>
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

  /* Placeholder rows — 7 days */
  const rows = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    hari: '—',
    tarikh: '—',
    hijrah: '—',
    fasaBulan: '—',
    jenisAir: '—',
    pasangPagi: '—',
    surutPagi: '—',
    pasangPetang: '—',
    surutMalam: '—',
    cadangan: '—',
    rowClass: '',
  }));

  return (
    <section aria-label="Jadual pasang surut" className="mb-8">
      <h2 className="section-heading">Jadual Pasang Surut</h2>
      <div className="tide-table-wrapper">
        <table className="tide-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.rowClass}>
                <td>{row.hari}</td>
                <td>{row.tarikh}</td>
                <td>{row.hijrah}</td>
                <td>{row.fasaBulan}</td>
                <td>{row.jenisAir}</td>
                <td>{row.pasangPagi}</td>
                <td>{row.surutPagi}</td>
                <td>{row.pasangPetang}</td>
                <td>{row.surutMalam}</td>
                <td>{row.cadangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Section 4: Legend ── */
function Legend() {
  const items = [
    { color: 'legend-dot-safe', label: 'Sesuai' },
    { color: 'legend-dot-caution', label: 'Berwaspada' },
    { color: 'legend-dot-danger', label: 'Tidak Disyorkan' },
  ];

  return (
    <section aria-label="Petunjuk status" className="mb-8">
      <div className="card-flat">
        <h2 className="section-heading mb-3">Petunjuk Status</h2>
        <div className="flex flex-wrap gap-4">
          {items.map((item) => (
            <span key={item.label} className="inline-flex items-center text-sm text-text-secondary">
              <span className={`legend-dot ${item.color}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 5: Information Panel ── */
function InfoPanel() {
  const panels = [
    {
      title: 'Apa itu Air Besar',
      text: 'Air Besar berlaku apabila paras air laut berada di tahap tertinggi dalam kitaran pasang surut. Pada masa ini, air laut naik ke paras maksimum sebelum mula surut semula. Air Besar penting untuk mengetahui paras air maksimum yang boleh dijangkakan bagi tujuan pelayaran dan operasi di laut.',
    },
    {
      title: 'Apa itu Air Mati',
      text: 'Air Mati berlaku apabila paras air laut berada di tahap terendah dalam kitaran pasang surut. Pada masa ini, air laut surut ke paras minimum sebelum mula pasang semula. Air Mati penting untuk mengetahui paras air minimum yang boleh dijangkakan bagi tujuan pelayaran dan operasi di laut.',
    },
    {
      title: 'Mengapa Penting kepada Operasi Laut',
      text: 'Pengetahuan tentang pasang surut adalah penting untuk keselamatan pelayaran, perancangan operasi perikanan, dan aktiviti maritim. Paras air yang mencukupi diperlukan untuk laluan selamat kapal, manakala waktu surut mempengaruhi akses ke kawasan cetek dan muara sungai. Perancangan operasi yang mengambil kira pasang surut dapat mengurangkan risiko kandas dan memastikan keselamatan anak kapal.',
    },
  ];

  return (
    <section aria-label="Maklumat pasang surut" className="mb-8">
      <h2 className="section-heading">Maklumat Pasang Surut</h2>
      <div className="space-y-4">
        {panels.map((panel) => (
          <div key={panel.title} className="info-panel">
            <h3 className="info-panel-title">{panel.title}</h3>
            <p className="info-panel-text">{panel.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Section 6: Future Integration Placeholder ── */
function FutureIntegration() {
  const items = [
    { label: 'Cuaca', icon: '🌤️' },
    { label: 'Angin', icon: '💨' },
    { label: 'Ombak', icon: '🌊' },
    { label: 'Cadangan AI', icon: '🤖' },
  ];

  return (
    <section aria-label="Integrasi masa depan" className="mb-8">
      <h2 className="section-heading">Integrasi Masa Depan</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="future-box">
            <span className="future-box-icon" aria-hidden="true">{item.icon}</span>
            <span className="future-box-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export function PasangSurutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader />
      <TodaySummary />
      <TideTable />
      <Legend />
      <InfoPanel />
      <FutureIntegration />
    </div>
  );
}
