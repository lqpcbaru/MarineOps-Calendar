interface MoonPhaseVisualProps {
  phaseName: string;
  illumination: number;
  size?: number;
}

const PHASE_ICONS: Record<string, string> = {
  'Bulan Baharu': '🌑',
  'Bulan Sabit Muda': '🌒',
  'Suku Pertama': '🌓',
  'Bulan Hampir Penuh': '🌔',
  'Bulan Penuh': '🌕',
  'Bulan Susut Cembung': '🌖',
  'Suku Ketiga': '🌗',
  'Bulan Sabit Tua': '🌘',
};

function emojiForPhase(phaseName: string): string {
  const exact = PHASE_ICONS[phaseName];
  if (exact) return exact;
  for (const [key, emoji] of Object.entries(PHASE_ICONS)) {
    if (phaseName.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🌕';
}

/**
 * A simple, readable moon-phase visual: a large emoji of the current phase
 * plus the illumination percentage. The emoji is the most universally
 * understood representation and needs no image assets.
 */
export function MoonPhaseVisual({ phaseName, illumination, size = 96 }: MoonPhaseVisualProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ fontSize: size, lineHeight: 1 }}
        aria-label={`Fasa bulan: ${phaseName}`}
      >
        {emojiForPhase(phaseName)}
      </div>
      <p className="text-lg font-semibold text-text-primary">{phaseName}</p>
      <p className="text-sm tabular-nums text-text-secondary">Pencahayaan: {illumination}%</p>
    </div>
  );
}
