export interface AstronomicalSunRawData {
  date: string;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  daylightDuration: string;
  civilTwilightBegin: string | null;
  civilTwilightEnd: string | null;
  nauticalTwilightBegin: string | null;
  nauticalTwilightEnd: string | null;
  astronomicalTwilightBegin: string | null;
  astronomicalTwilightEnd: string | null;
  solarDeclination: number;
  dayLengthMinutes: number;
}
