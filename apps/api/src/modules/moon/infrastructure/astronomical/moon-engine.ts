import type { AstronomicalMoonRawData } from './astronomical-moon-raw-dto';

const PHASE_NAMES = [
  'Bulan Baharu', 'Bulan Sabit Muda', 'Suku Pertama', 'Bulan Hampir Penuh',
  'Bulan Penuh', 'Bulan Hampir Penuh', 'Suku Ketiga', 'Bulan Sabit Tua',
];

export function computeMoonPhase(date: Date): AstronomicalMoonRawData {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const seed = year * 365 + month * 30 + day;
  const ageDays = ((seed * 7 + 3) % 2953) / 100;
  const phaseIndex = Math.floor((ageDays / 29.53) * PHASE_NAMES.length) % PHASE_NAMES.length;
  const illumination = Math.round(Math.sin((ageDays / 29.53) * Math.PI * 2) * 50 + 50);

  return {
    julianDate: 2459200 + seed / 365.25,
    phaseAngle: (ageDays / 29.53) * 360,
    illumination,
    ageDays: Math.round(ageDays * 10) / 10,
    phaseName: PHASE_NAMES[phaseIndex] ?? 'Tidak Diketahui',
    moonrise: `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String((seed * 3 + 6) % 24).padStart(2, '0')}:00:00Z`,
    moonset: `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String((seed * 5 + 10) % 24).padStart(2, '0')}:00:00Z`,
    nextPhase: { name: PHASE_NAMES[(phaseIndex + 1) % PHASE_NAMES.length] ?? 'Tidak Diketahui', date: new Date(date.getTime() + 7 * 86400000).toISOString().slice(0, 10) },
    distanceKm: 384400,
    angularDiameter: 0.52,
  };
}
