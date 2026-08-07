import type { AstronomicalSunRawData } from './astronomical-sun-raw-dto';

function formatTime(date: Date, hours: number, minutes: number): string {
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function computeSunData(latitude: number, longitude: number, date: Date): AstronomicalSunRawData {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const latRad = (latitude * Math.PI) / 180;

  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const declRad = (declination * Math.PI) / 180;

  const haRad = Math.acos(
    (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(declRad)) /
    (Math.cos(latRad) * Math.cos(declRad)),
  );

  const haHours = (haRad * 180) / Math.PI / 15;
  const solarNoonHours = 12 + (longitude / 15);

  const sunriseHours = solarNoonHours - haHours;
  const sunsetHours = solarNoonHours + haHours;
  const dayLengthMinutes = Math.round(haHours * 2 * 60);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `PT${h}H${m}M`;
  };

  return {
    date: date.toISOString().slice(0, 10),
    sunrise: formatTime(date, Math.floor(sunriseHours), Math.round((sunriseHours % 1) * 60)),
    sunset: formatTime(date, Math.floor(sunsetHours), Math.round((sunsetHours % 1) * 60)),
    solarNoon: formatTime(date, Math.floor(solarNoonHours), Math.round((solarNoonHours % 1) * 60)),
    daylightDuration: formatDuration(dayLengthMinutes),
    civilTwilightBegin: formatTime(date, Math.floor(sunriseHours - 0.5), Math.round(((sunriseHours - 0.5) % 1) * 60)),
    civilTwilightEnd: formatTime(date, Math.floor(sunsetHours + 0.5), Math.round(((sunsetHours + 0.5) % 1) * 60)),
    nauticalTwilightBegin: formatTime(date, Math.floor(sunriseHours - 1), Math.round(((sunriseHours - 1) % 1) * 60)),
    nauticalTwilightEnd: formatTime(date, Math.floor(sunsetHours + 1), Math.round(((sunsetHours + 1) % 1) * 60)),
    astronomicalTwilightBegin: formatTime(date, Math.floor(sunriseHours - 1.5), Math.round(((sunriseHours - 1.5) % 1) * 60)),
    astronomicalTwilightEnd: formatTime(date, Math.floor(sunsetHours + 1.5), Math.round(((sunsetHours + 1.5) % 1) * 60)),
    solarDeclination: Math.round(declination * 100) / 100,
    dayLengthMinutes,
  };
}
