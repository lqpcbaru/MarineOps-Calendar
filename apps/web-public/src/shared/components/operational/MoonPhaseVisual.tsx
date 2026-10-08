interface MoonPhaseVisualProps {
  phaseName: string;
  illumination: number;
  size?: number;
}

interface MoonPhaseDef {
  name: string;
  emoji: string;
  tideLabel: string | null;
}

const MOON_CYCLE: MoonPhaseDef[] = [
  { name: 'Bulan Baharu', emoji: '🌑', tideLabel: 'Air Besar' },
  { name: 'Bulan Sabit Muda', emoji: '🌒', tideLabel: null },
  { name: 'Suku Pertama', emoji: '🌓', tideLabel: 'Air Mati' },
  { name: 'Bulan Hampir Penuh', emoji: '🌔', tideLabel: null },
  { name: 'Bulan Penuh', emoji: '🌕', tideLabel: 'Air Besar' },
  { name: 'Bulan Susut Cembung', emoji: '🌖', tideLabel: null },
  { name: 'Suku Ketiga', emoji: '🌗', tideLabel: 'Air Mati' },
  { name: 'Bulan Sabit Tua', emoji: '🌘', tideLabel: null },
];

function currentPhaseIndex(phaseName: string): number {
  const idx = MOON_CYCLE.findIndex((p) => p.name.toLowerCase() === phaseName.toLowerCase());
  if (idx >= 0) return idx;
  // Fuzzy match
  const fuzzy = MOON_CYCLE.findIndex((p) => phaseName.toLowerCase().includes(p.name.toLowerCase()));
  return fuzzy >= 0 ? fuzzy : 4;
}

/**
 * A full 8-phase lunar cycle, with the current phase highlighted and the
 * spring/neap tide relationship labelled so operators can see at a glance
 * whether it is a "Air Besar" (spring) or "Air Mati" (neap) period.
 */
export function MoonPhaseVisual({ phaseName, illumination, size = 48 }: MoonPhaseVisualProps) {
  const currentIndex = currentPhaseIndex(phaseName);
  const current = MOON_CYCLE[currentIndex];

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Current phase, large */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ fontSize: size * 1.6, lineHeight: 1 }}
          aria-label={`Fasa bulan: ${phaseName}`}
        >
          {current?.emoji ?? '🌕'}
        </div>
        <p className="text-base font-semibold text-text-primary">{phaseName}</p>
        <p className="text-sm tabular-nums text-text-secondary">Pencahayaan {illumination}%</p>
        {current?.tideLabel && (
          <span className="mt-1 rounded-full bg-ocean-900 px-2.5 py-0.5 text-xs font-medium text-ocean-300">
            {current.tideLabel}
          </span>
        )}
      </div>

      {/* Full 8-phase cycle */}
      <div className="grid w-full grid-cols-8 gap-1">
        {MOON_CYCLE.map((phase, i) => {
          const isActive = i === currentIndex;
          const isSpring = phase.tideLabel === 'Air Besar';
          const isNeap = phase.tideLabel === 'Air Mati';
          return (
            <div
              key={phase.name}
              className={`flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5 text-center ${
                isActive ? 'bg-marine-800 ring-1 ring-inset ring-ocean-400' : ''
              }`}
              title={`${phase.name}${phase.tideLabel ? ` — ${phase.tideLabel}` : ''}`}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
                {phase.emoji}
              </span>
              <span className="text-[9px] leading-tight text-text-muted">
                {phase.name.replace('Bulan ', '').replace('Bulan', '')}
              </span>
              {isSpring && (
                <span className="h-1 w-1 rounded-full bg-status-safe" aria-hidden="true" />
              )}
              {isNeap && (
                <span className="h-1 w-1 rounded-full bg-status-caution" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-safe" aria-hidden="true" /> Air Besar
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-caution" aria-hidden="true" /> Air Mati
        </span>
      </div>
    </div>
  );
}
