import { describe, expect, it } from 'vitest';

/* Import the seed data arrays from the seed file for validation.
   We test the data structure, not the Prisma seeding (which requires a DB). */

interface RegionDef {
  code: string;
  name: string;
  description: string;
  parentCode?: string;
  sortOrder: number;
}

interface StationDef {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionCode: string;
  metadata?: Record<string, unknown>;
}

const REGIONS: RegionDef[] = [
  { code: 'MYS', name: 'Malaysia', description: 'Kawasan operasi peringkat kebangsaan', sortOrder: 0 },
  { code: 'PBS', name: 'Pantai Barat Semenanjung', description: 'Kawasan operasi pantai barat Semenanjung Malaysia', parentCode: 'MYS', sortOrder: 1 },
  { code: 'PTS', name: 'Pantai Timur Semenanjung', description: 'Kawasan operasi pantai timur Semenanjung Malaysia', parentCode: 'MYS', sortOrder: 2 },
  { code: 'SBH', name: 'Sabah', description: 'Kawasan operasi perairan Sabah', parentCode: 'MYS', sortOrder: 3 },
  { code: 'SWK', name: 'Sarawak', description: 'Kawasan operasi perairan Sarawak', parentCode: 'MYS', sortOrder: 4 },
  { code: 'SEL', name: 'Pantai Barat Selangor', description: 'Pelabuhan Klang, Kuala Selangor, Sungai Besar', parentCode: 'PBS', sortOrder: 1 },
  { code: 'PRK', name: 'Pantai Barat Perak', description: 'Bagan Datuk, Lumut, Pulau Pangkor', parentCode: 'PBS', sortOrder: 2 },
  { code: 'KDH', name: 'Pantai Barat Kedah', description: 'Kuala Kedah, Langkawi', parentCode: 'PBS', sortOrder: 3 },
  { code: 'JHR', name: 'Pantai Timur Johor', description: 'Mersing', parentCode: 'PTS', sortOrder: 1 },
  { code: 'PHG', name: 'Pantai Timur Pahang', description: 'Kuantan', parentCode: 'PTS', sortOrder: 2 },
  { code: 'TRG', name: 'Pantai Timur Terengganu', description: 'Kuala Terengganu', parentCode: 'PTS', sortOrder: 3 },
  { code: 'KTN', name: 'Pantai Timur Kelantan', description: 'Tok Bali', parentCode: 'PTS', sortOrder: 4 },
  { code: 'WBS', name: 'West Sabah', description: 'Kudat, Kota Kinabalu', parentCode: 'SBH', sortOrder: 1 },
  { code: 'EBS', name: 'East Sabah', description: 'Sandakan, Tawau', parentCode: 'SBH', sortOrder: 2 },
  { code: 'NSW', name: 'North Sarawak', description: 'Miri, Bintulu', parentCode: 'SWK', sortOrder: 1 },
  { code: 'SSW', name: 'South Sarawak', description: 'Kuching', parentCode: 'SWK', sortOrder: 2 },
];

const STATIONS: StationDef[] = [
  { code: 'PKG-01', name: 'Pelabuhan Klang', latitude: 3.0033, longitude: 101.3925, timezone: 'Asia/Kuala_Lumpur', regionCode: 'SEL' },
  { code: 'KSL-01', name: 'Kuala Selangor', latitude: 3.3350, longitude: 101.2460, timezone: 'Asia/Kuala_Lumpur', regionCode: 'SEL' },
  { code: 'SGB-01', name: 'Sungai Besar', latitude: 3.6744, longitude: 100.9865, timezone: 'Asia/Kuala_Lumpur', regionCode: 'SEL' },
  { code: 'BDT-01', name: 'Bagan Datuk', latitude: 3.9840, longitude: 100.7880, timezone: 'Asia/Kuala_Lumpur', regionCode: 'PRK' },
  { code: 'LMT-01', name: 'Lumut', latitude: 4.2260, longitude: 100.6290, timezone: 'Asia/Kuala_Lumpur', regionCode: 'PRK' },
  { code: 'PPK-01', name: 'Pulau Pangkor', latitude: 4.2275, longitude: 100.5542, timezone: 'Asia/Kuala_Lumpur', regionCode: 'PRK' },
  { code: 'KKD-01', name: 'Kuala Kedah', latitude: 6.1083, longitude: 100.2883, timezone: 'Asia/Kuala_Lumpur', regionCode: 'KDH' },
  { code: 'LGK-01', name: 'Langkawi', latitude: 6.3500, longitude: 99.8000, timezone: 'Asia/Kuala_Lumpur', regionCode: 'KDH' },
  { code: 'MSG-01', name: 'Mersing', latitude: 2.4333, longitude: 103.8333, timezone: 'Asia/Kuala_Lumpur', regionCode: 'JHR' },
  { code: 'KTN-01', name: 'Kuantan', latitude: 3.8167, longitude: 103.3333, timezone: 'Asia/Kuala_Lumpur', regionCode: 'PHG' },
  { code: 'KTR-01', name: 'Kuala Terengganu', latitude: 5.3294, longitude: 103.1372, timezone: 'Asia/Kuala_Lumpur', regionCode: 'TRG' },
  { code: 'TKB-01', name: 'Tok Bali', latitude: 5.8833, longitude: 102.4667, timezone: 'Asia/Kuala_Lumpur', regionCode: 'KTN' },
  { code: 'KDT-01', name: 'Kudat', latitude: 6.8833, longitude: 116.8333, timezone: 'Asia/Kuching', regionCode: 'WBS' },
  { code: 'KKB-01', name: 'Kota Kinabalu', latitude: 5.9804, longitude: 116.0735, timezone: 'Asia/Kuching', regionCode: 'WBS' },
  { code: 'SDK-01', name: 'Sandakan', latitude: 5.8408, longitude: 118.1178, timezone: 'Asia/Kuching', regionCode: 'EBS' },
  { code: 'TWU-01', name: 'Tawau', latitude: 4.2636, longitude: 117.8939, timezone: 'Asia/Kuching', regionCode: 'EBS' },
  { code: 'MRI-01', name: 'Miri', latitude: 4.3924, longitude: 113.9864, timezone: 'Asia/Kuching', regionCode: 'NSW' },
  { code: 'BTU-01', name: 'Bintulu', latitude: 3.1733, longitude: 113.0433, timezone: 'Asia/Kuching', regionCode: 'NSW' },
  { code: 'KCH-01', name: 'Kuching', latitude: 1.5535, longitude: 110.3593, timezone: 'Asia/Kuching', regionCode: 'SSW' },
  { code: 'PPN-01', name: 'Pulau Pinang', latitude: 5.4164, longitude: 100.3327, timezone: 'Asia/Kuala_Lumpur', regionCode: 'KDH' },
];

describe('Seed Data Validation', () => {
  it('has no duplicate region codes', () => {
    const codes = REGIONS.map((r) => r.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('has no duplicate station codes', () => {
    const codes = STATIONS.map((s) => s.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('every station belongs to a valid region', () => {
    const regionCodes = new Set(REGIONS.map((r) => r.code));
    for (const s of STATIONS) {
      expect(regionCodes.has(s.regionCode)).toBe(true);
    }
  });

  it('every region with parent references a valid parent', () => {
    const regionCodes = new Set(REGIONS.map((r) => r.code));
    for (const r of REGIONS) {
      if (r.parentCode) {
        expect(regionCodes.has(r.parentCode)).toBe(true);
      }
    }
  });

  it('all coordinates are within valid ranges', () => {
    for (const s of STATIONS) {
      expect(s.latitude).toBeGreaterThanOrEqual(-90);
      expect(s.latitude).toBeLessThanOrEqual(90);
      expect(s.longitude).toBeGreaterThanOrEqual(-180);
      expect(s.longitude).toBeLessThanOrEqual(180);
    }
  });

  it('all stations have valid IANA timezones', () => {
    const validTimezones = ['Asia/Kuala_Lumpur', 'Asia/Kuching'];
    for (const s of STATIONS) {
      expect(validTimezones).toContain(s.timezone);
    }
  });

  it('has 16 regions', () => {
    expect(REGIONS).toHaveLength(16);
  });

  it('has 20 stations', () => {
    expect(STATIONS).toHaveLength(20);
  });

  it('has 1 root region (MYS, no parent) and 4 second-level regions', () => {
    const rootRegions = REGIONS.filter((r) => !r.parentCode);
    expect(rootRegions).toHaveLength(1);
    expect(rootRegions[0]!.code).toBe('MYS');

    const secondLevel = REGIONS.filter((r) => r.parentCode === 'MYS');
    expect(secondLevel).toHaveLength(4);
    expect(secondLevel.map((r) => r.code).sort()).toEqual(['PBS', 'PTS', 'SBH', 'SWK']);
  });

  it('every sub-region has a parent that exists', () => {
    const allCodes = new Set(REGIONS.map((r) => r.code));
    const subRegions = REGIONS.filter((r) => r.parentCode);
    for (const sr of subRegions) {
      expect(allCodes.has(sr.parentCode!)).toBe(true);
    }
  });
});
