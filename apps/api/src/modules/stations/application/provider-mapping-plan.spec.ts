import { describe, expect, it } from 'vitest';
import {
  buildProviderMappingPlan,
  CONFIG_KEY_BY_DATA_TYPE,
  PROVIDER_NAME_BY_DATA_TYPE,
  type KnownStation,
} from './provider-mapping-plan';

const STATIONS: KnownStation[] = [
  { id: 'st-pkg', code: 'PKG-01', status: 'ACTIVE' },
  { id: 'st-kch', code: 'KCH-01', status: 'ACTIVE' },
  { id: 'st-old', code: 'OLD-01', status: 'ARCHIVED' },
];

function planFor(entries: unknown) {
  return buildProviderMappingPlan(entries, STATIONS);
}

describe('buildProviderMappingPlan', () => {
  describe('the config key each data type needs', () => {
    // This is the whole reason the tool exists. Each provider reads a
    // different key out of the same JSON column, so a correct code under
    // the wrong key configures nothing while looking configured.
    it('writes a tide code where the JUPEM provider reads it', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-01', dataType: 'tide', code: 'JPM-KLANG' },
      ]);

      expect(errors).toEqual([]);
      expect(plan[0]!.config).toEqual({ stationCode: 'JPM-KLANG' });
      expect(plan[0]!.providerName).toBe('JUPEM');
    });

    it('writes a weather code where the MET provider reads it', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-01', dataType: 'weather', code: 'MET-AREA-9' },
      ]);

      expect(errors).toEqual([]);
      expect(plan[0]!.config).toEqual({ marineArea: 'MET-AREA-9' });
      expect(plan[0]!.providerName).toBe('MetMalaysia');
    });

    it('writes a wind code where the marine forecast provider reads it', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-01', dataType: 'wind', code: 'MARINE-7' },
      ]);

      expect(errors).toEqual([]);
      expect(plan[0]!.config).toEqual({ marineArea: 'MARINE-7' });
      expect(plan[0]!.providerName).toBe('MarineForecast');
    });

    // The providers read config first and fall back to the column, so the
    // two must agree or a later reader could resolve a stale value.
    it('keeps providerStationId equal to the configured code', () => {
      const { plan } = planFor([{ stationCode: 'PKG-01', dataType: 'tide', code: 'JPM-KLANG' }]);

      const entry = plan[0]!;
      expect(entry.providerStationId).toBe('JPM-KLANG');
      expect(entry.config[CONFIG_KEY_BY_DATA_TYPE.tide]).toBe(entry.providerStationId);
    });

    it('covers every mappable data type in both lookup tables', () => {
      for (const dataType of ['tide', 'weather', 'wind'] as const) {
        expect(CONFIG_KEY_BY_DATA_TYPE[dataType]).toBeTruthy();
        expect(PROVIDER_NAME_BY_DATA_TYPE[dataType]).toBeTruthy();
      }
    });
  });

  describe('refusals', () => {
    // A typo lands on a row that exists, for a different place, and the
    // API then serves confident forecasts for somewhere else. Nothing
    // downstream can detect that, so it has to be caught here.
    it('refuses a station code that does not exist', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-02', dataType: 'tide', code: 'JPM-KLANG' },
      ]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/no station with code "PKG-02"/);
    });

    it('refuses to map an archived station', () => {
      const { plan, errors } = planFor([
        { stationCode: 'OLD-01', dataType: 'tide', code: 'JPM-OLD' },
      ]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/ARCHIVED/);
    });

    // Our own ids are UUIDs; sending one upstream is meaningless, and the
    // providers already refuse it at read time.
    it('refuses a code that is really an internal station UUID', () => {
      const { plan, errors } = planFor([
        {
          stationCode: 'PKG-01',
          dataType: 'weather',
          code: 'a094c076-390b-4176-996c-b22f8f1d0399',
        },
      ]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/internal station UUID/);
    });

    // The shipped example file is full of these, so running the tool
    // against it unedited must fail rather than half-configure.
    it.each(['<MET_AREA_CODE>', 'CHANGEME', 'change-me', 'TODO', 'TBD', 'example', 'xxxx', '???'])(
      'refuses the placeholder %s',
      (code) => {
        const { plan, errors } = planFor([{ stationCode: 'PKG-01', dataType: 'weather', code }]);

        expect(plan).toEqual([]);
        expect(errors.join()).toMatch(/template placeholder/);
      },
    );

    it('refuses a blank code', () => {
      const { plan, errors } = planFor([{ stationCode: 'PKG-01', dataType: 'tide', code: '   ' }]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/"code" is required/);
    });

    // Someone writing one of these has misunderstood what needs
    // configuring: both are computed in-process from the station's own
    // coordinates and reach no provider at all.
    it.each(['moon', 'sun'])('explains that %s needs no mapping', (dataType) => {
      const { plan, errors } = planFor([{ stationCode: 'PKG-01', dataType, code: 'ANYTHING' }]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/computed locally and needs no provider mapping/);
    });

    it('refuses an unknown data type', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-01', dataType: 'humidity', code: 'X-1' },
      ]);

      expect(plan).toEqual([]);
      expect(errors.join()).toMatch(/unknown dataType "humidity"/);
    });

    it('refuses two entries for the same station and data type', () => {
      const { plan, errors } = planFor([
        { stationCode: 'PKG-01', dataType: 'tide', code: 'FIRST' },
        { stationCode: 'PKG-01', dataType: 'tide', code: 'SECOND' },
      ]);

      expect(plan).toHaveLength(1);
      expect(errors.join()).toMatch(/duplicate entry/);
    });

    it('rejects a file that is not an array', () => {
      expect(planFor({ stationCode: 'PKG-01' }).errors.join()).toMatch(/must contain a JSON array/);
    });

    it('rejects an empty file rather than silently doing nothing', () => {
      expect(planFor([]).errors.join()).toMatch(/empty/);
    });
  });

  describe('reporting', () => {
    // One run should tell the operator everything to fix, not the first
    // thing it happened to hit.
    it('collects every problem instead of stopping at the first', () => {
      const { plan, errors } = planFor([
        { stationCode: 'NOPE-01', dataType: 'tide', code: 'A' },
        { stationCode: 'PKG-01', dataType: 'moon', code: 'B' },
        { stationCode: 'PKG-01', dataType: 'weather', code: 'CHANGEME' },
        { stationCode: 'KCH-01', dataType: 'tide', code: 'JPM-KCH' },
      ]);

      expect(errors).toHaveLength(3);
      // The one valid entry still plans, so the operator can see progress.
      expect(plan).toHaveLength(1);
      expect(plan[0]!.stationCode).toBe('KCH-01');
    });

    it('normalises station code case and trims whitespace', () => {
      const { plan, errors } = planFor([
        { stationCode: '  pkg-01 ', dataType: ' Tide ', code: '  JPM-KLANG  ' },
      ]);

      expect(errors).toEqual([]);
      expect(plan[0]!.stationCode).toBe('PKG-01');
      expect(plan[0]!.stationId).toBe('st-pkg');
      expect(plan[0]!.providerStationId).toBe('JPM-KLANG');
    });

    it('honours an explicit providerName override', () => {
      const { plan } = planFor([
        { stationCode: 'PKG-01', dataType: 'tide', code: 'JPM-1', providerName: 'JUPEM-STAGING' },
      ]);

      expect(plan[0]!.providerName).toBe('JUPEM-STAGING');
    });
  });
});
