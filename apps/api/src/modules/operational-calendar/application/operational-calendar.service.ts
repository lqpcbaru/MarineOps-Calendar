import { Inject, Injectable } from '@nestjs/common';
import type { DailyOperationalRecord, CalendarResponse, Freshness, WeatherSummary, TideSummary, WindWaveSummary, MoonSummary, SunSummary } from '../domain';
import { WeatherService } from '../../weather/application/weather.service';
import { TideService } from '../../tide/application/tide.service';
import { WindWaveService } from '../../wind-wave/application/wind-wave.service';
import { MoonService } from '../../moon/application/moon.service';
import { SunService } from '../../sun/application/sun.service';
import { CacheService } from '../../../shared/cache/cache.service';
import { buildCacheKey } from '../../../shared/cache/cache-policy';
import { STATIONS_QUERY_PORT } from '../../stations/api/stations.module';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

@Injectable()
export class OperationalCalendarService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly tideService: TideService,
    private readonly windWaveService: WindWaveService,
    private readonly moonService: MoonService,
    private readonly sunService: SunService,
    @Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService<DailyOperationalRecord[]>,
  ) {}

  async getCalendar(stationId: string, dateFrom?: string, dateTo?: string): Promise<CalendarResponse> {
    const now = new Date();
    const from = dateFrom || now.toISOString().slice(0, 10);
    const to = dateTo || from;
    const cacheKey = buildCacheKey('operational', 'calendar', stationId, from);

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.buildRecords(stationId, from, to),
      'operational',
      stationId,
    );

    const freshness: Freshness = {
      status: result.status === 'FRESH' ? 'fresh' : 'stale',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 86_400_000).toISOString(),
      source: result.source === 'cache' ? 'cache' : 'operational',
    };

    return { data: result.data, freshness };
  }

  private async buildRecords(stationId: string, dateFrom: string, dateTo: string): Promise<DailyOperationalRecord[]> {
    const station = await this.stationPort.findPublicById(stationId);
    const stationName = station?.name ?? stationId;
    const stationCode = station?.code ?? stationId;
    const regionName = station?.regionName ?? null;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);

    const records: DailyOperationalRecord[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 86_400_000);
      const dateStr = d.toISOString().slice(0, 10);

      const [weatherResult, tideResult, windWaveResult, moonResult, sunResult] = await Promise.allSettled([
        this.weatherService.getWeather(stationId, dateStr, dateStr),
        this.tideService.getTide(stationId, dateStr, dateStr),
        this.windWaveService.getWindWave(stationId, dateStr, dateStr),
        this.moonService.getMoonPhase(stationId, dateStr),
        this.sunService.getSunData(stationId, dateStr),
      ]);

      records.push({
        stationId,
        stationName,
        stationCode,
        regionName,
        date: dateStr,
        hijriDate: '—',
        weather: this.extractWeather(weatherResult),
        tide: this.extractTide(tideResult),
        windWave: this.extractWindWave(windWaveResult),
        moon: this.extractMoon(moonResult),
        sun: this.extractSun(sunResult),
        freshness: {
          status: 'fresh',
          fetchedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86_400_000).toISOString(),
          source: 'operational',
        },
        generatedAt: new Date().toISOString(),
      });
    }

    return records;
  }

  private extractWeather(result: PromiseSettledResult<unknown>): WeatherSummary | null {
    if (result.status !== 'fulfilled') return null;
    const r = result.value as { data?: { conditions?: string; temperature?: number; visibility?: number; precipitation?: number }[] };
    if (!r.data?.[0]) return null;
    return { conditions: r.data[0].conditions ?? '—', temperature: r.data[0].temperature ?? 0, visibility: r.data[0].visibility ?? 0, precipitation: r.data[0].precipitation ?? 0 };
  }

  private extractTide(result: PromiseSettledResult<unknown>): TideSummary | null {
    if (result.status !== 'fulfilled') return null;
    const r = result.value as { data?: { type?: string; time?: string; height?: number }[] };
    if (!r.data?.length) return null;
    const highs = r.data.filter((p) => p.type === 'HIGH');
    const lows = r.data.filter((p) => p.type === 'LOW');
    return {
      nextHigh: highs[0] ? { time: highs[0].time!, height: highs[0].height! } : null,
      nextLow: lows[0] ? { time: lows[0].time!, height: lows[0].height! } : null,
      type: r.data[0]?.type ?? 'UNKNOWN',
    };
  }

  private extractWindWave(result: PromiseSettledResult<unknown>): WindWaveSummary | null {
    if (result.status !== 'fulfilled') return null;
    const r = result.value as { data?: { windSpeed?: number; windDirection?: string; windGusts?: number; waveHeight?: number; wavePeriod?: number }[] };
    if (!r.data?.[0]) return null;
    return { windSpeed: r.data[0].windSpeed ?? 0, windDirection: r.data[0].windDirection ?? '—', windGusts: r.data[0].windGusts ?? 0, waveHeight: r.data[0].waveHeight ?? 0, wavePeriod: r.data[0].wavePeriod ?? 0 };
  }

  private extractMoon(result: PromiseSettledResult<unknown>): MoonSummary | null {
    if (result.status !== 'fulfilled') return null;
    const r = result.value as { data?: { phaseName?: string; illumination?: number; moonrise?: string | null; moonset?: string | null } };
    if (!r.data) return null;
    return { phaseName: r.data.phaseName ?? '—', illumination: r.data.illumination ?? 0, moonrise: r.data.moonrise ?? null, moonset: r.data.moonset ?? null };
  }

  private extractSun(result: PromiseSettledResult<unknown>): SunSummary | null {
    if (result.status !== 'fulfilled') return null;
    const r = result.value as { data?: { sunrise?: string; sunset?: string; daylightDuration?: string } };
    if (!r.data) return null;
    return { sunrise: r.data.sunrise ?? '—', sunset: r.data.sunset ?? '—', dayLength: r.data.daylightDuration ?? '—' };
  }
}
