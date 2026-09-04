import type { AstronomicalSunRawData } from './astronomical-sun-raw-dto';

/**
 * Renders a decimal hour offset from UTC midnight of `date`.
 *
 * Takes the decimal hour directly rather than a pre-split hours/minutes
 * pair. Callers used to split it with `Math.floor(h)` and `(h % 1) * 60`,
 * which is wrong whenever the value is negative — and east of Greenwich
 * sunrise IS negative, because it falls on the previous UTC day. For
 * h = -0.86, floor gives -1 while `%` gives -0.86 rather than the +0.14
 * that pairs with it, so the negative was counted twice and every sunrise
 * came out about an hour early. Adding milliseconds sidesteps the
 * decomposition entirely and rolls across day boundaries on its own.
 */
function formatTime(date: Date, decimalHours: number): string {
  const midnightUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const d = new Date(midnightUtc + Math.round(decimalHours * 3600) * 1000);
  d.setUTCSeconds(0, 0);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function computeSunData(
  latitude: number,
  longitude: number,
  date: Date,
): AstronomicalSunRawData {
  // Day of year computed entirely in UTC. The previous form mixed a UTC
  // timestamp with a LOCAL new Date(year, 0, 0), so on any host not set to
  // UTC the day number could come out one off near midnight, and the
  // result depended on where the server happened to be running.
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86400000);
  const latRad = (latitude * Math.PI) / 180;

  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const declRad = (declination * Math.PI) / 180;

  const haRad = Math.acos(
    (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad)),
  );

  const haHours = (haRad * 180) / Math.PI / 15;

  // Equation of time: the difference between apparent and mean solar time,
  // which swings roughly +14 to -16 minutes across the year. Omitting it
  // put every sunrise and sunset out by up to a quarter of an hour, which
  // is material when the times are used to plan departures in daylight.
  const b = ((360 / 365) * (dayOfYear - 81) * Math.PI) / 180;
  const equationOfTimeMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  // Solar noon in UTC is 12:00 MINUS longitude/15 for east-positive
  // longitude: the sun reaches its highest point EARLIER in UTC the
  // further east you are. This read `12 + longitude / 15`, which put every
  // Malaysian station out by 2 x 101/15 = about 13.5 hours — the portal
  // showed sunrise at 20:41 and sunset at 08:50 for Port Klang, i.e. the
  // day inverted, on a page used to plan operations in daylight.
  const solarNoonHours = 12 - longitude / 15 - equationOfTimeMinutes / 60;

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
    sunrise: formatTime(date, sunriseHours),
    sunset: formatTime(date, sunsetHours),
    solarNoon: formatTime(date, solarNoonHours),
    daylightDuration: formatDuration(dayLengthMinutes),
    civilTwilightBegin: formatTime(date, sunriseHours - 0.5),
    civilTwilightEnd: formatTime(date, sunsetHours + 0.5),
    nauticalTwilightBegin: formatTime(date, sunriseHours - 1),
    nauticalTwilightEnd: formatTime(date, sunsetHours + 1),
    astronomicalTwilightBegin: formatTime(date, sunriseHours - 1.5),
    astronomicalTwilightEnd: formatTime(date, sunsetHours + 1.5),
    solarDeclination: Math.round(declination * 100) / 100,
    dayLengthMinutes,
  };
}
