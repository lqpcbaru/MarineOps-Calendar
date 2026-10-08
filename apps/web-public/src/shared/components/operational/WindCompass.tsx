interface WindCompassProps {
  direction: string;
  speed: number;
  gusts?: number;
  size?: number;
}

const DIRECTION_DEGREES: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

function degreesFor(direction: string): number {
  const upper = direction.toUpperCase();
  if (DIRECTION_DEGREES[upper] !== undefined) return DIRECTION_DEGREES[upper]!;
  return 0;
}

/**
 * A simple compass showing wind direction (arrow rotated to the direction the
 * wind is coming FROM) plus speed/gusts. Pure SVG, no image assets.
 */
export function WindCompass({ direction, speed, gusts, size = 120 }: WindCompassProps) {
  const deg = degreesFor(direction);
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const arrowAngle = (deg - 90) * (Math.PI / 180);
  const arrowLen = radius - 10;
  const tipX = cx + Math.cos(arrowAngle) * arrowLen;
  const tipY = cy + Math.sin(arrowAngle) * arrowLen;
  const tailX = cx - Math.cos(arrowAngle) * arrowLen;
  const tailY = cy - Math.sin(arrowAngle) * arrowLen;

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <svg width={size} height={size} role="img" aria-label={`Arah angin ${direction}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle, #2a3444)"
          strokeWidth={1.5}
        />
        {/* cardinal labels */}
        <text
          x={cx}
          y={cy - radius + 12}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted, #94a3b8)"
        >
          N
        </text>
        <text
          x={cx}
          y={cy + radius - 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted, #94a3b8)"
        >
          S
        </text>
        <text
          x={cx - radius + 12}
          y={cy + 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted, #94a3b8)"
        >
          W
        </text>
        <text
          x={cx + radius - 12}
          y={cy + 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted, #94a3b8)"
        >
          E
        </text>
        {/* arrow pointing to where wind is coming FROM */}
        <line
          x1={tailX}
          y1={tailY}
          x2={tipX}
          y2={tipY}
          stroke="var(--color-ocean-400, #38bdf8)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="var(--color-ocean-400, #38bdf8)" />
      </svg>
      <p className="text-base font-semibold text-text-primary">{direction}</p>
      <p className="text-sm tabular-nums text-text-secondary">{speed} kn</p>
      {gusts !== undefined && (
        <p className="text-xs tabular-nums text-text-muted">Gust {gusts} kn</p>
      )}
    </div>
  );
}
