import {
  CalendarDays,
  Waves,
  CloudSun,
  Wind,
  Moon,
  MoonStar,
  Sunrise,
  MapPin,
  TriangleAlert,
  Ship,
  Compass,
  Gauge,
  Info,
  ArrowUp,
  ArrowDown,
  Droplets,
  Clock,
  Eye,
  Thermometer,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Monochrome icon set — consistent 1.5px stroke, tinted via `currentColor`.
 * Replaces the emoji previously used across operational UI.
 */

export type IconName =
  | 'calendar'
  | 'tide'
  | 'weather'
  | 'wind'
  | 'moon'
  | 'hijri'
  | 'sun'
  | 'station'
  | 'alert'
  | 'vessel'
  | 'compass'
  | 'gauge'
  | 'info'
  | 'arrow-up'
  | 'arrow-down'
  | 'droplets'
  | 'clock'
  | 'eye'
  | 'thermometer';

const ICONS: Record<IconName, ComponentType<LucideProps>> = {
  calendar: CalendarDays,
  tide: Waves,
  weather: CloudSun,
  wind: Wind,
  moon: Moon,
  hijri: MoonStar,
  sun: Sunrise,
  station: MapPin,
  alert: TriangleAlert,
  vessel: Ship,
  compass: Compass,
  gauge: Gauge,
  info: Info,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  droplets: Droplets,
  clock: Clock,
  eye: Eye,
  thermometer: Thermometer,
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  /** Size in px. Default 18. */
  size?: number;
}

export function Icon({ name, size = 18, strokeWidth = 1.5, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}
