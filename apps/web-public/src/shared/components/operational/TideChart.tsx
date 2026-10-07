import type { TideDataPoint } from '../../../features/pasang-surut/pasang-surut.api';

interface TideChartProps {
  data: TideDataPoint[];
}

/**
 * Renders the day's tide curve as an SVG line chart.
 *
 * StormGlass returns only the high/low extremes (typically 4 events a day),
 * so the curve between them is a smooth cosine interpolation — the standard
 * shape of a semi-diurnal tide — rather than raw sampled heights. This gives
 * an intuitive "naik-turun" visual without requiring the hourly heights API.
 */
export function TideChart({ data }: TideChartProps) {
  if (data.length < 2) return null;

  const today = data[0]?.date;
  const points = data
    .filter((p) => p.date === today)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  if (points.length < 2) return null;

  const heights = points.map((p) => p.height);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const range = maxH - minH || 1;

  const WIDTH = 640;
  const HEIGHT = 180;
  const PAD_X = 40;
  const PAD_Y = 24;
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  const times = points.map((p) => new Date(p.time).getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);

  const xFor = (time: string) => {
    const t = new Date(time).getTime();
    return PAD_X + ((t - t0) / (t1 - t0 || 1)) * innerW;
  };
  const yFor = (height: number) => PAD_Y + innerH - ((height - minH) / range) * innerH;

  // Sample the cosine interpolation between consecutive extremes.
  const path: string[] = [];
  const N = 24;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    for (let s = 0; s <= N; s++) {
      const frac = s / N;
      const tt = ta + (tb - ta) * frac;
      // cosine ease between the two heights (semi-diurnal approximation)
      const cos = (1 - Math.cos(frac * Math.PI)) / 2;
      const h = a.height + (b.height - a.height) * cos;
      const x = PAD_X + ((tt - t0) / (t1 - t0 || 1)) * innerW;
      const y = yFor(h);
      path.push(`${s === 0 && i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }

  const areaPath = `${path.join(' ')} L ${xFor(points[points.length - 1]!.time).toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} L ${xFor(points[0]!.time).toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Graf pasang surut"
      className="h-auto w-full"
    >
      {/* baseline */}
      <line
        x1={PAD_X}
        y1={PAD_Y + innerH}
        x2={WIDTH - PAD_X}
        y2={PAD_Y + innerH}
        stroke="var(--color-border-subtle, #2a3444)"
        strokeWidth={1}
      />
      {/* area fill */}
      <path d={areaPath} fill="rgba(59,130,246,0.12)" stroke="none" />
      {/* curve */}
      <path
        d={path.join(' ')}
        fill="none"
        stroke="var(--color-ocean-400, #38bdf8)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* markers */}
      {points.map((p) => (
        <g key={p.time}>
          <circle
            cx={xFor(p.time)}
            cy={yFor(p.height)}
            r={4}
            fill={
              p.type === 'HIGH'
                ? 'var(--color-status-safe, #22c55e)'
                : 'var(--color-status-danger, #ef4444)'
            }
          />
          <text
            x={xFor(p.time)}
            y={yFor(p.height) - 10}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-text-secondary, #94a3b8)"
          >
            {p.type === 'HIGH' ? '↑' : '↓'} {p.height.toFixed(1)}m
          </text>
        </g>
      ))}
    </svg>
  );
}
