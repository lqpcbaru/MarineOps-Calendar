import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  archiveStation,
  createStation,
  flattenRegions,
  listRegions,
  listStations,
  updateStation,
} from './stations.api';
import type { OperationRegion } from './stations.api';
import { clearAccessToken, setAccessToken } from '../../shared/api/session';
import { resetRefreshStateForTests } from '../../shared/api/http';

const MOCK_STATION = {
  id: 'st-1',
  code: 'PKG-01',
  name: 'Pelabuhan Klang',
  latitude: 3.0033,
  longitude: 101.3925,
  timezone: 'Asia/Kuala_Lumpur',
  regionId: 'reg-1',
  regionName: 'Selangor',
  status: 'ACTIVE',
  metadata: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function lastCall() {
  const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
  return { url: mock.mock.calls[0]![0] as string, init: mock.mock.calls[0]![1] as RequestInit };
}

describe('stations.api', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    setAccessToken('test-token');
    resetRefreshStateForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    resetRefreshStateForTests();
  });

  it('listStations hits the ADMIN surface, not the public one', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(ok({ stations: [MOCK_STATION], total: 1, page: 1, pageSize: 20 }));

    const result = await listStations({ page: 1, pageSize: 20, status: 'ARCHIVED' });

    expect(lastCall().url).toBe('/api/v1/stations?page=1&pageSize=20&status=ARCHIVED');
    expect(result.stations[0]!.code).toBe('PKG-01');
  });

  it('createStation POSTs the full payload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_STATION));

    await createStation({
      code: 'LGK-01',
      name: 'Langkawi',
      latitude: 6.35,
      longitude: 99.8,
      timezone: 'Asia/Kuala_Lumpur',
      regionId: null,
    });

    const { url, init } = lastCall();
    expect(url).toBe('/api/v1/stations');
    expect(init.method).toBe('POST');
    expect((JSON.parse(init.body as string) as { code: string }).code).toBe('LGK-01');
  });

  it('updateStation never sends `code` — updateStationSchema rejects it', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_STATION));

    await updateStation('st-1', { name: 'Renamed', latitude: 1, longitude: 2, timezone: 'UTC' });

    const body = JSON.parse(lastCall().init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('code');
    expect(body['name']).toBe('Renamed');
  });

  it('archiveStation DELETEs and resolves on 204', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);

    await expect(archiveStation('st-1')).resolves.toBeUndefined();
    expect(lastCall().init.method).toBe('DELETE');
  });

  it('surfaces a station code conflict from the API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ code: 'STATION_CODE_EXISTS', message: 'Kod stesen sudah wujud' }),
    } as unknown as Response);

    await expect(
      createStation({
        code: 'PKG-01',
        name: 'Dup',
        latitude: 1,
        longitude: 1,
        timezone: 'UTC',
      }),
    ).rejects.toThrow('Kod stesen sudah wujud');
  });

  it('listRegions reads the public regions endpoint and unwraps data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      ok({
        data: [
          { id: 'reg-1', code: 'SEL', name: 'Selangor', parentRegionId: null, status: 'ACTIVE' },
        ],
      }),
    );

    const regions = await listRegions();

    expect(lastCall().url).toBe('/api/public/stations/regions');
    expect(regions[0]!.name).toBe('Selangor');
  });

  it('listRegions tolerates a missing data array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok({}));
    await expect(listRegions()).resolves.toEqual([]);
  });
});

describe('flattenRegions', () => {
  it('flattens the region tree so the form can render a single select', () => {
    const tree: OperationRegion[] = [
      {
        id: 'r1',
        code: 'MYS',
        name: 'Malaysia',
        parentRegionId: null,
        status: 'ACTIVE',
        children: [
          {
            id: 'r2',
            code: 'PBS',
            name: 'Pantai Barat',
            parentRegionId: 'r1',
            status: 'ACTIVE',
            children: [
              {
                id: 'r3',
                code: 'SEL',
                name: 'Selangor',
                parentRegionId: 'r2',
                status: 'ACTIVE',
              },
            ],
          },
        ],
      },
    ];

    expect(flattenRegions(tree).map((r) => r.code)).toEqual(['MYS', 'PBS', 'SEL']);
  });

  it('handles an empty tree', () => {
    expect(flattenRegions([])).toEqual([]);
  });
});
