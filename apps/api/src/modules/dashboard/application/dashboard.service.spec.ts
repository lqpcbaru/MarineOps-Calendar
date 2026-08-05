import { describe, expect, it } from 'vitest';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns placeholder public dashboard with UNKNOWN status', async () => {
    const service = new DashboardService();
    const result = await service.getPublicDashboard();

    expect(result.operationalStatus).toBe('UNKNOWN');
    expect(result.date).toBeDefined();
    expect(result.station).toBeDefined();
    expect(result.station.id).toBe('—');
    expect(result.tide.next).toBeNull();
    expect(result.tide.freshness.status).toBe('fresh');
    expect(result.weather.current).toBeNull();
    expect(result.windWave.current).toBeNull();
    expect(result.moon.phaseName).toBe('—');
    expect(result.moon.illumination).toBe(0);
    expect(result.sun.sunrise).toBe('—');
    expect(result.activeAlerts.count).toBe(0);
    expect(result.activeAlerts.latest).toBeNull();
  });

  it('accepts optional stationId', async () => {
    const service = new DashboardService();
    const result = await service.getPublicDashboard('st-001');
    expect(result.station.id).toBe('st-001');
  });

  it('returns valid ISO date string', async () => {
    const service = new DashboardService();
    const result = await service.getPublicDashboard();
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns freshness with validUntil 5 minutes ahead', async () => {
    const service = new DashboardService();
    const result = await service.getPublicDashboard();
    const fetchedAt = new Date(result.tide.freshness.fetchedAt).getTime();
    const validUntil = new Date(result.tide.freshness.validUntil).getTime();
    expect(validUntil - fetchedAt).toBe(300_000);
  });
});
