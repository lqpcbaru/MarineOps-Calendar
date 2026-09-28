# MarineOps Design System — Komponen UI

**Versi:** 2.0.0
**Tarikh:** 2026-09-28
**Status:** Aktif
**Bahasa:** Bahasa Melayu

---

## Prinsip Reka Bentuk

- **Profesional** — Konsol operasi marin, bukan templat papan pemuka
- **Ringkas** — Tiada elemen hiasan berlebihan, tiada emoji, tiada kaca/neon
- **Tipografi dahulu** — Hierarki melalui saiz/berat/ruang, bukan hiasan
- **Permukaan, bukan kad** — `surface` (semua sempadan) bukan kad berbingkai untuk segala-galanya
- **Warna untuk makna** — Hijau/Kuning/Merah hanya untuk status; sian untuk tindakan utama
- **Boleh diakses** — WCAG AA, papan kekunci, sasaran sentuhan 44px, reduced-motion
- **Responsif** — Mobile-first

---

## Token Reka Bentuk

Token ditakrifkan dalam `src/styles/index.css` (`@theme`), dan **sama** antara
`web-public` dan `web-admin`.

| Kategori           | Token                                          | Catatan                           |
| ------------------ | ---------------------------------------------- | --------------------------------- |
| Neutrals           | `marine-950…50`                                | Latar, permukaan, sempadan        |
| Permukaan          | `surface`, `surface-raised`, `surface-overlay` | Tiga aras ketinggian              |
| Sempadan           | `border-subtle`, `border-strong`               | Garisan halus                     |
| Teks               | `text-primary`, `text-secondary`, `text-muted` | Tiga aras keutamaan               |
| Aksen              | `ocean-400`                                    | Tindakan utama / pemilihan SAHAJA |
| Status (warna)     | `status-safe/caution/danger`                   | Titik/rel sebenar                 |
| Status (permukaan) | `safe/caution/danger-{bg,border,text}`         | Triple untuk legibility           |
| Jejari             | `radius-sm` (0.375rem), `radius-md` (0.5rem)   | DUA saiz sahaja                   |
| Fon                | `font-sans` = Inter Variable (dimuat sendiri)  | `tabular-nums` untuk data         |

---

## Ikon

Semua ikon UI guna **`<Icon name="…" />`** (`ui/Icon.tsx`) — monokrom SVG
berasaskan `lucide-react`, strok 1.5px, diwarnai melalui `currentColor`.
**Tiada emoji** dalam UI operasi.

Nama ikon tersedia: `calendar`, `tide`, `weather`, `wind`, `moon`, `hijri`,
`sun`, `station`, `alert`, `vessel`, `compass`, `gauge`, `info`, `arrow-up`,
`arrow-down`, `droplets`, `clock`, `eye`, `thermometer`.

---

## Komponen Utama

### AppCard (`ui/AppCard.tsx`)

Permukaan kandungan. Varian: `surface` (lalai), `flat` (hairline),
`accent`/`warning`/`danger` (rel semantik kiri).

### MarineConditionCard (`operational/MarineConditionCard.tsx`)

Metrik marin padat, sejajar kiri, tabular. Prop `icon` menerima `IconName`
(bukan emoji).

### OperationalStatusCard (`operational/OperationalStatusCard.tsx`)

**Wira status**: sepanduk mendatar dengan rel semantik kiri + tajuk +
sebab + metrik skor.

### AppTable (`ui/AppTable.tsx`)

Jadual padat. `TdNumeric`/`ThNumeric` untuk sel angka (sejajar kanan,
tabular). Pengepala melekit.

### StatusBadge (`ui/StatusBadge.tsx`)

Lencana status. Varian: `hijau`/`kuning`/`merah`/`neutral`.

### PageHeader / PageShell

`PageHeader` — tajuk halaman konsisten (garis tunggal). `PageShell`
(`width: narrow|default|wide`) — bekas halaman standard.

### Keadaan (Loading/Empty/Error)

Skeleton (bukan spinner), keadaan kosong & ralat profesional, `role`
yang betul.

---

## Konvensyen

- Gunakan `PageShell` (bukan `mx-auto max-w-*` tulisan tangan).
- Sejajar angka ke kanan dengan `tabular-nums` (masa, koordinat, kelajuan).
- Amaran/notis guna triple `danger-bg/border/text`, bukan alpha `/5`.
- `SectionTitle` ialah eyebrow huruf besar senyap, bukan tajuk besar.
- Pautan "Amaran Marin" kontekstual ialah pautan teks nipis, bukan kad butang.

---

## Aksesibiliti

- WCAG AA, kontras 4.5:1
- `:focus-visible`, skip-link, navigasi papan kekunci
- Sasaran sentuhan 44px
- `prefers-reduced-motion`
- `role="status"` / `role="alert"` pada keadaan
