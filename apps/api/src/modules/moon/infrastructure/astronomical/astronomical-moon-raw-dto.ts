export interface AstronomicalMoonRawData {
  julianDate: number;
  phaseAngle: number;
  illumination: number;
  ageDays: number;
  phaseName: string;
  moonrise: string | null;
  moonset: string | null;
  nextPhase: {
    name: string;
    date: string;
  } | null;
  distanceKm: number;
  angularDiameter: number;
}
