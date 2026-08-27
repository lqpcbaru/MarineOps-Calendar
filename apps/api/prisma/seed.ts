import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/* ── Region & Station seed data ── */
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
  /* Main regions */
  {
    code: 'MYS',
    name: 'Malaysia',
    description: 'Kawasan operasi peringkat kebangsaan',
    sortOrder: 0,
  },
  /* Sub-regions */
  {
    code: 'PBS',
    name: 'Pantai Barat Semenanjung',
    description: 'Kawasan operasi pantai barat Semenanjung Malaysia',
    parentCode: 'MYS',
    sortOrder: 1,
  },
  {
    code: 'PTS',
    name: 'Pantai Timur Semenanjung',
    description: 'Kawasan operasi pantai timur Semenanjung Malaysia',
    parentCode: 'MYS',
    sortOrder: 2,
  },
  {
    code: 'SBH',
    name: 'Sabah',
    description: 'Kawasan operasi perairan Sabah',
    parentCode: 'MYS',
    sortOrder: 3,
  },
  {
    code: 'SWK',
    name: 'Sarawak',
    description: 'Kawasan operasi perairan Sarawak',
    parentCode: 'MYS',
    sortOrder: 4,
  },
  /* Operational sub-regions */
  {
    code: 'SEL',
    name: 'Pantai Barat Selangor',
    description: 'Pelabuhan Klang, Kuala Selangor, Sungai Besar',
    parentCode: 'PBS',
    sortOrder: 1,
  },
  {
    code: 'PRK',
    name: 'Pantai Barat Perak',
    description: 'Bagan Datuk, Lumut, Pulau Pangkor',
    parentCode: 'PBS',
    sortOrder: 2,
  },
  {
    code: 'KDH',
    name: 'Pantai Barat Kedah',
    description: 'Kuala Kedah, Langkawi',
    parentCode: 'PBS',
    sortOrder: 3,
  },
  {
    code: 'JHR',
    name: 'Pantai Timur Johor',
    description: 'Mersing',
    parentCode: 'PTS',
    sortOrder: 1,
  },
  {
    code: 'PHG',
    name: 'Pantai Timur Pahang',
    description: 'Kuantan',
    parentCode: 'PTS',
    sortOrder: 2,
  },
  {
    code: 'TRG',
    name: 'Pantai Timur Terengganu',
    description: 'Kuala Terengganu',
    parentCode: 'PTS',
    sortOrder: 3,
  },
  {
    code: 'KTN',
    name: 'Pantai Timur Kelantan',
    description: 'Tok Bali',
    parentCode: 'PTS',
    sortOrder: 4,
  },
  {
    code: 'WBS',
    name: 'West Sabah',
    description: 'Kudat, Kota Kinabalu',
    parentCode: 'SBH',
    sortOrder: 1,
  },
  {
    code: 'EBS',
    name: 'East Sabah',
    description: 'Sandakan, Tawau',
    parentCode: 'SBH',
    sortOrder: 2,
  },
  {
    code: 'NSW',
    name: 'North Sarawak',
    description: 'Miri, Bintulu',
    parentCode: 'SWK',
    sortOrder: 1,
  },
  { code: 'SSW', name: 'South Sarawak', description: 'Kuching', parentCode: 'SWK', sortOrder: 2 },
];

const STATIONS: StationDef[] = [
  /* Pantai Barat Selangor */
  {
    code: 'PKG-01',
    name: 'Pelabuhan Klang',
    latitude: 3.0033,
    longitude: 101.3925,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'SEL',
    metadata: { type: 'coastal', depth: 15 },
  },
  {
    code: 'KSL-01',
    name: 'Kuala Selangor',
    latitude: 3.335,
    longitude: 101.246,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'SEL',
  },
  {
    code: 'SGB-01',
    name: 'Sungai Besar',
    latitude: 3.6744,
    longitude: 100.9865,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'SEL',
  },
  /* Pantai Barat Perak */
  {
    code: 'BDT-01',
    name: 'Bagan Datuk',
    latitude: 3.984,
    longitude: 100.788,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'PRK',
  },
  {
    code: 'LMT-01',
    name: 'Lumut',
    latitude: 4.226,
    longitude: 100.629,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'PRK',
  },
  {
    code: 'PPK-01',
    name: 'Pulau Pangkor',
    latitude: 4.2275,
    longitude: 100.5542,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'PRK',
  },
  /* Pantai Barat Kedah */
  {
    code: 'KKD-01',
    name: 'Kuala Kedah',
    latitude: 6.1083,
    longitude: 100.2883,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'KDH',
  },
  {
    code: 'LGK-01',
    name: 'Langkawi',
    latitude: 6.35,
    longitude: 99.8,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'KDH',
  },
  /* Pantai Timur Johor */
  {
    code: 'MSG-01',
    name: 'Mersing',
    latitude: 2.4333,
    longitude: 103.8333,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'JHR',
  },
  /* Pantai Timur Pahang */
  {
    code: 'KTN-01',
    name: 'Kuantan',
    latitude: 3.8167,
    longitude: 103.3333,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'PHG',
  },
  /* Pantai Timur Terengganu */
  {
    code: 'KTR-01',
    name: 'Kuala Terengganu',
    latitude: 5.3294,
    longitude: 103.1372,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'TRG',
  },
  /* Pantai Timur Kelantan */
  {
    code: 'TKB-01',
    name: 'Tok Bali',
    latitude: 5.8833,
    longitude: 102.4667,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'KTN',
  },
  /* Sabah */
  {
    code: 'KDT-01',
    name: 'Kudat',
    latitude: 6.8833,
    longitude: 116.8333,
    timezone: 'Asia/Kuching',
    regionCode: 'WBS',
  },
  {
    code: 'KKB-01',
    name: 'Kota Kinabalu',
    latitude: 5.9804,
    longitude: 116.0735,
    timezone: 'Asia/Kuching',
    regionCode: 'WBS',
  },
  {
    code: 'SDK-01',
    name: 'Sandakan',
    latitude: 5.8408,
    longitude: 118.1178,
    timezone: 'Asia/Kuching',
    regionCode: 'EBS',
  },
  {
    code: 'TWU-01',
    name: 'Tawau',
    latitude: 4.2636,
    longitude: 117.8939,
    timezone: 'Asia/Kuching',
    regionCode: 'EBS',
  },
  /* Sarawak */
  {
    code: 'MRI-01',
    name: 'Miri',
    latitude: 4.3924,
    longitude: 113.9864,
    timezone: 'Asia/Kuching',
    regionCode: 'NSW',
  },
  {
    code: 'BTU-01',
    name: 'Bintulu',
    latitude: 3.1733,
    longitude: 113.0433,
    timezone: 'Asia/Kuching',
    regionCode: 'NSW',
  },
  {
    code: 'KCH-01',
    name: 'Kuching',
    latitude: 1.5535,
    longitude: 110.3593,
    timezone: 'Asia/Kuching',
    regionCode: 'SSW',
  },
  /* Additional coastal station */
  {
    code: 'PPN-01',
    name: 'Pulau Pinang',
    latitude: 5.4164,
    longitude: 100.3327,
    timezone: 'Asia/Kuala_Lumpur',
    regionCode: 'KDH',
  },
];

const PROVIDER_TYPES = [
  { dataType: 'tide', providerName: 'TIDE_PLACEHOLDER' },
  { dataType: 'weather', providerName: 'MET_PLACEHOLDER' },
  { dataType: 'wind', providerName: 'WIND_PLACEHOLDER' },
  { dataType: 'moon', providerName: 'MOON_PLACEHOLDER' },
  { dataType: 'sun', providerName: 'SUN_PLACEHOLDER' },
];

async function seedRegions(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();

  for (const def of REGIONS) {
    const parentId = def.parentCode ? idMap.get(def.parentCode) : null;

    const region = await prisma.operationRegion.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        description: def.description,
        parentRegionId: parentId ?? null,
        sortOrder: def.sortOrder,
      },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        parentRegionId: parentId ?? null,
        sortOrder: def.sortOrder,
        status: 'ACTIVE',
      },
    });

    idMap.set(def.code, region.id);
  }

  console.info(`Seeded ${idMap.size} operation regions`);
  return idMap;
}

async function seedStations(regionMap: Map<string, string>): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();

  for (const def of STATIONS) {
    const regionId = regionMap.get(def.regionCode);
    if (!regionId) {
      throw new Error(`Region not found for station ${def.code}: ${def.regionCode}`);
    }

    const station = await prisma.station.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        latitude: def.latitude,
        longitude: def.longitude,
        timezone: def.timezone,
        regionId,
        metadata: def.metadata ?? null,
      },
      create: {
        code: def.code,
        name: def.name,
        latitude: def.latitude,
        longitude: def.longitude,
        timezone: def.timezone,
        regionId,
        metadata: def.metadata ?? null,
        status: 'ACTIVE',
      },
    });

    idMap.set(def.code, station.id);
  }

  console.info(`Seeded ${idMap.size} stations`);
  return idMap;
}

async function seedProviderMappings(stationMap: Map<string, string>) {
  let count = 0;

  for (const [, stationId] of stationMap) {
    for (const pt of PROVIDER_TYPES) {
      await prisma.stationProviderMapping.upsert({
        where: {
          // Compound unique key @@unique([stationId, dataType]) — idempotent.
          stationId_dataType: {
            stationId,
            dataType: pt.dataType,
          },
        },
        update: {
          providerName: pt.providerName,
          providerStationId: null,
          config: null,
          isActive: true,
        },
        create: {
          stationId,
          dataType: pt.dataType,
          providerName: pt.providerName,
          providerStationId: null,
          config: null,
          isActive: true,
        },
      });
      count++;
    }
  }

  console.info(
    `Seeded ${count} provider mappings (${STATIONS.length} stations × ${PROVIDER_TYPES.length} providers)`,
  );
}

/**
 * Resolves the seed admin password before any writes happen (fail fast).
 * SEED_ADMIN_PASSWORD is required outside development — no production
 * default is permitted. In development only, an unset var falls back to
 * a fixed local-only password so `pnpm db:seed` keeps working out of the box.
 */
function resolveAdminPassword(): string {
  const nodeEnv = process.env['NODE_ENV'] || 'development';
  const password = process.env['SEED_ADMIN_PASSWORD'];
  if (password) return password;

  if (nodeEnv !== 'development') {
    throw new Error(
      `SEED_ADMIN_PASSWORD is required when NODE_ENV=${nodeEnv}. Refusing to seed an admin user without an explicit password outside development.`,
    );
  }
  return 'admin-password-123';
}

async function main() {
  console.info('Seeding MarineOps Hub database...');

  const adminPassword = resolveAdminPassword();

  /* Existing roles + admin user seed */
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissionCodes: [
        'user.manage',
        'role.manage',
        'station.read',
        'station.write',
        'calendar.read',
        'calendar.write',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
        'settings.read',
        'settings.write',
        'admin.reference',
      ],
    },
    create: {
      name: 'Admin',
      permissionCodes: [
        'user.manage',
        'role.manage',
        'station.read',
        'station.write',
        'calendar.read',
        'calendar.write',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
        'settings.read',
        'settings.write',
        'admin.reference',
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: 'FisheriesOfficer' },
    update: {},
    create: {
      name: 'FisheriesOfficer',
      permissionCodes: [
        'station.read',
        'calendar.read',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: 'Auditor' },
    update: {},
    create: {
      name: 'Auditor',
      permissionCodes: [
        'station.read',
        'calendar.read',
        'alert.read',
        'dashboard.read',
        'audit.read',
        'settings.read',
      ],
    },
  });

  const passwordHash = await argon2.hash(adminPassword);
  await prisma.user.upsert({
    where: { email: 'admin@marineops.local' },
    update: {},
    create: {
      email: 'admin@marineops.local',
      name: 'System Admin',
      passwordHash,
      status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en',
      roles: { create: [{ roleId: adminRole.id }] },
    },
  });

  /* New: Station module seed */
  const regionMap = await seedRegions();
  const stationMap = await seedStations(regionMap);
  await seedProviderMappings(stationMap);

  console.info('Database seeding complete');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
