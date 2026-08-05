# MarineOps Design System — Komponen UI

**Versi:** 1.0.0
**Tarikh:** 2026-08-05
**Status:** Aktif
**Bahasa:** Bahasa Melayu

---

## Prinsip Reka Bentuk

- **Ringkas** — Tiada elemen hiasan berlebihan
- **Profesional** — Gaya kerajaan yang bersih dan teratur
- **Boleh diakses** — WCAG AA, navigasi papan kekunci, sasaran sentuhan besar
- **Responsif** — Mobile-first, berfungsi pada semua saiz skrin
- **Tiada kaca** — Tiada glassmorphism, neon, atau kesan futuristik

---

## 1. AppCard

Kad kandungan standard.

### Varian

| Varian | Kelas CSS | Kegunaan |
|--------|-----------|----------|
| `default` | `.card` | Kad biasa dengan kesan hover |
| `flat` | `.card-flat` | Kad tanpa kesan hover |
| `highlight` | `.card` + border ocean | Kad dengan sempadan aksen |
| `warning` | `.card` + border warning | Kad dengan sempadan amaran |

### Contoh

```tsx
import { AppCard } from '@/shared/components';

<AppCard variant="default">
  <p>Kandungan kad</p>
</AppCard>

<AppCard variant="warning">
  <p>Amaran</p>
</AppCard>
```

---

## 2. StatusBadge

Lencana status dengan warna semantik.

### Varian

| Varian | Warna | Maksud |
|--------|-------|--------|
| `hijau` | Hijau (`--color-status-safe`) | Sesuai |
| `kuning` | Kuning (`--color-status-caution`) | Berwaspada |
| `merah` | Merah (`--color-status-danger`) | Tidak Disyorkan |
| `neutral` | Kelabu | Tiada maksud semantik |

### Contoh

```tsx
import { StatusBadge } from '@/shared/components';

<StatusBadge variant="hijau">Sesuai</StatusBadge>
<StatusBadge variant="kuning">Berwaspada</StatusBadge>
<StatusBadge variant="merah">Tidak Disyorkan</StatusBadge>
```

---

## 3. SectionTitle

Tajuk bahagian standard.

### Contoh

```tsx
import { SectionTitle } from '@/shared/components';

<SectionTitle>Ringkasan Pasang Surut</SectionTitle>
```

---

## 4. EmptyState

Mesej keadaan kosong yang profesional.

### Peraturan

- **Jangan** gunakan "Coming Soon"
- **Gunakan** "Maklumat akan dipaparkan selepas modul ini disepadukan."

### Contoh

```tsx
import { EmptyState } from '@/shared/components';

<EmptyState />
<EmptyState title="Tiada Data" message="Data belum tersedia untuk stesen ini." />
```

---

## 5. LoadingState

Kerangka pemuatan ringkas (skeleton).

### Ciri

- Tiada spinner
- Blok berdenyut (pulse)
- `role="status"` untuk pembaca skrin

### Contoh

```tsx
import { LoadingState } from '@/shared/components';

<LoadingState />
<LoadingState lines={5} />
```

---

## 6. ErrorState

Komponen ralat gaya kerajaan.

### Ciri

- `role="alert"` untuk pembaca skrin
- Butang "Cuba Semula" pilihan
- Warna merah yang jelas

### Contoh

```tsx
import { ErrorState } from '@/shared/components';

<ErrorState />
<ErrorState
  title="Ralat Rangkaian"
  message="Sambungan ke pelayan gagal."
  onRetry={() => window.location.reload()}
/>
```

---

## 7. AppTable

Jadual responsif dengan pengepala melekit.

### Ciri

- Boleh skrol mendatar (overflow-x)
- Pengepala melekit (sticky header)
- Baris hover
- Jarak standard

### Contoh

```tsx
import { AppTable } from '@/shared/components';

<AppTable>
  <AppTable.Head>
    <AppTable.Row>
      <AppTable.Th>Hari</AppTable.Th>
      <AppTable.Th>Tarikh</AppTable.Th>
    </AppTable.Row>
  </AppTable.Head>
  <AppTable.Body>
    <AppTable.Row>
      <AppTable.Td>Isnin</AppTable.Td>
      <AppTable.Td>5 Ogos 2026</AppTable.Td>
    </AppTable.Row>
  </AppTable.Body>
</AppTable>
```

---

## 8. AppButton

Butang standard dengan sasaran sentuhan besar.

### Varian

| Varian | Warna | Kegunaan |
|--------|-------|----------|
| `primary` | Marine 500 | Tindakan utama |
| `secondary` | Marine 800 | Tindakan alternatif |
| `ghost` | Telus | Tindakan ringan |
| `danger` | Merah | Tindakan pemusnahan |

### Ciri

- Minimum ketinggian `2.75rem` (44px) — WCAG sasaran sentuhan
- Fokus yang jelas (`focus-visible`)
- `disabled` state

### Contoh

```tsx
import { AppButton } from '@/shared/components';

<AppButton variant="primary">Simpan</AppButton>
<AppButton variant="secondary">Batal</AppButton>
<AppButton variant="ghost">Lihat</AppButton>
<AppButton variant="danger">Padam</AppButton>
```

---

## 9. InfoPanel

Panel penerangan untuk kandungan maklumat.

### Contoh

```tsx
import { InfoPanel } from '@/shared/components';

<InfoPanel title="Apa itu Air Besar">
  <p>Air Besar berlaku apabila paras air laut berada di tahap tertinggi...</p>
</InfoPanel>
```

---

## 10. PageHeader

Pengepala halaman yang konsisten.

### Props

| Prop | Jenis | Keterangan |
|------|-------|------------|
| `title` | `string` | Tajuk halaman (wajib) |
| `subtitle` | `string?` | Huraian ringkas |
| `action` | `ReactNode?` | Slot tindakan (butang, dsb.) |

### Contoh

```tsx
import { PageHeader, AppButton } from '@/shared/components';

<PageHeader
  title="Pasang Surut"
  subtitle="Maklumat pasang surut air laut mengikut stesen dan tarikh."
/>

<PageHeader
  title="Stesen"
  subtitle="Senarai stesen pemantauan."
  action={<AppButton variant="primary">Tambah Stesen</AppButton>}
/>
```

---

## Aksesibiliti

Semua komponen mematuhi:

- **WCAG AA** — Kontras warna minimum 4.5:1
- **Navigasi papan kekunci** — Semua elemen interaktif boleh difokuskan
- **Focus visible** — Garis panduan fokus yang jelas
- **Sasaran sentuhan** — Minimum 44×44px untuk butang
- **Reduced motion** — Menghormati `prefers-reduced-motion`
- **Pembaca skrin** — `role`, `aria-label`, `aria-hidden` yang betul
