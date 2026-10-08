interface WaveVisualProps {
  height: number;
  period?: number;
}

/**
 * A simple wave-height visual: a row of wave bars whose height scales with
 * the reported wave height, giving an at-a-glance sense of sea state without
 * reading the number.
 */
export function WaveVisual({ height, period }: WaveVisualProps) {
  // Clamp visual scale so extreme values don't blow out the layout.
  const scaled = Math.min(Math.max(height, 0), 4);
  const barHeight = Math.round(8 + (scaled / 4) * 64);

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <svg width="200" height="80" role="img" aria-label={`Ketinggian ombak ${height} m`}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const baseY = 40 + (i % 2 === 0 ? 0 : 14);
          return (
            <path
              key={i}
              d={`M ${i * 34} ${baseY} q 8.5 -${barHeight} 17 0 q 8.5 ${barHeight} 17 0`}
              fill="none"
              stroke="var(--color-ocean-400, #38bdf8)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <p className="text-base font-semibold text-text-primary">{height} m</p>
      {period !== undefined && (
        <p className="text-xs tabular-nums text-text-muted">Tempoh {period}s</p>
      )}
    </div>
  );
}
