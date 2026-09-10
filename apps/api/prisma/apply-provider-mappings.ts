/**
 * Applies operator-supplied station → provider codes.
 *
 * The seed creates one INACTIVE, empty mapping row per station per data
 * type. Turning sourced data on means filling in the external code for
 * each one — data this repository does not hold and must not guess. This
 * script is the safe way to do that: it validates the whole file against
 * the stations that actually exist, prints what it would change, and only
 * writes when told to.
 *
 *   # see what is configured now
 *   pnpm db:mappings:status
 *
 *   # check a file without touching anything (default)
 *   MAPPINGS_FILE=./infrastructure/provider-mappings/production.json \
 *     pnpm db:mappings:plan
 *
 *   # write it
 *   MAPPINGS_FILE=./infrastructure/provider-mappings/production.json \
 *     pnpm db:mappings:apply
 *
 * Writing is deliberately opt-in and idempotent: re-running with the same
 * file reports every row as unchanged.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  buildProviderMappingPlan,
  CONFIG_KEY_BY_DATA_TYPE,
  MAPPABLE_DATA_TYPES,
  type KnownStation,
  type PlannedMapping,
} from '../src/modules/stations/application/provider-mapping-plan';

const prisma = new PrismaClient();

type Mode = 'status' | 'plan' | 'apply';

function parseMode(): Mode {
  const argv = process.argv.slice(2);
  if (argv.includes('--status')) return 'status';
  if (argv.includes('--apply')) return 'apply';
  return 'plan';
}

async function loadStations(): Promise<KnownStation[]> {
  const rows = await prisma.station.findMany({ select: { id: true, code: true, status: true } });
  return rows.map((r) => ({ id: r.id, code: r.code, status: String(r.status) }));
}

/** What is configured right now, by data type. */
async function printStatus(): Promise<void> {
  const rows = await prisma.stationProviderMapping.findMany({
    where: { dataType: { in: [...MAPPABLE_DATA_TYPES] } },
    select: {
      dataType: true,
      isActive: true,
      providerStationId: true,
      providerName: true,
      station: { select: { code: true, name: true, status: true } },
    },
    orderBy: [{ dataType: 'asc' }],
  });

  console.info('=== Station provider mappings ===\n');

  for (const dataType of MAPPABLE_DATA_TYPES) {
    const forType = rows.filter((r) => r.dataType === dataType);
    const active = forType.filter((r) => r.isActive && r.providerStationId);
    console.info(
      `${dataType.padEnd(8)} ${String(active.length).padStart(3)} / ${forType.length} configured  (reads config.${CONFIG_KEY_BY_DATA_TYPE[dataType]})`,
    );
    for (const row of active) {
      console.info(
        `           ${row.station.code.padEnd(10)} ${row.providerName.padEnd(16)} ${row.providerStationId}`,
      );
    }
  }

  const unconfigured = rows.filter((r) => !r.isActive || !r.providerStationId).length;
  console.info('');
  if (unconfigured > 0) {
    console.info(
      `${unconfigured} mapping(s) still unconfigured. Those endpoints return 503 PROVIDER_CONFIG_ERROR,`,
    );
    console.info('which is the expected state until real provider codes are supplied.');
  } else {
    console.info('Every mappable station/data-type pair has a provider code.');
  }
}

/** Walks up from the working directory to the workspace root, if any. */
function findWorkspaceRoot(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Resolves MAPPINGS_FILE against the workspace root as well as the
 * working directory.
 *
 * `pnpm db:mappings:plan` runs with cwd set to apps/api, so the
 * repository-relative path an operator naturally writes — and that the
 * README documents — would not resolve from cwd alone. Both are tried,
 * and a failure names every path attempted so the mistake is obvious
 * rather than mysterious.
 */
function readMappingFile(): { path: string; parsed: unknown } {
  const given = process.env['MAPPINGS_FILE'];
  if (!given) {
    throw new Error(
      [
        'MAPPINGS_FILE is required. Point it at your mapping file, e.g.',
        '  MAPPINGS_FILE=./infrastructure/provider-mappings/production.json',
      ].join('\n'),
    );
  }

  const workspaceRoot = findWorkspaceRoot();
  const candidates = isAbsolute(given)
    ? [given]
    : [resolve(process.cwd(), given), ...(workspaceRoot ? [resolve(workspaceRoot, given)] : [])];

  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) {
    throw new Error(
      [`Could not find ${given}. Tried:`, ...candidates.map((c) => `  ${c}`)].join('\n'),
    );
  }

  try {
    return { path, parsed: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${(error as Error).message}`);
  }
}

/**
 * Compares each planned row against what is stored, so the operator sees
 * a diff rather than a count. Reporting "unchanged" is what makes a
 * re-run safe to do without thinking about it.
 */
async function classify(planned: PlannedMapping[]) {
  const created: PlannedMapping[] = [];
  const updated: Array<{ entry: PlannedMapping; from: string }> = [];
  const unchanged: PlannedMapping[] = [];

  for (const entry of planned) {
    const existing = await prisma.stationProviderMapping.findUnique({
      where: {
        stationId_dataType: { stationId: entry.stationId, dataType: entry.dataType },
      },
      select: { providerStationId: true, providerName: true, isActive: true, config: true },
    });

    if (!existing) {
      created.push(entry);
      continue;
    }
    const configKey = CONFIG_KEY_BY_DATA_TYPE[entry.dataType];
    const currentCode =
      ((existing.config as Record<string, unknown> | null)?.[configKey] as string | undefined) ??
      existing.providerStationId ??
      '';
    const same =
      currentCode === entry.providerStationId &&
      existing.providerName === entry.providerName &&
      existing.isActive;

    if (same) unchanged.push(entry);
    else updated.push({ entry, from: currentCode || '(unset)' });
  }

  return { created, updated, unchanged };
}

async function main(): Promise<void> {
  const mode = parseMode();

  if (mode === 'status') {
    await printStatus();
    return;
  }

  const { path, parsed } = readMappingFile();
  const stations = await loadStations();
  const { plan, errors } = buildProviderMappingPlan(parsed, stations);

  console.info(`=== Provider mappings from ${path} ===\n`);

  if (errors.length > 0) {
    console.error(`${errors.length} problem(s) found — nothing was written:\n`);
    for (const error of errors) console.error(`  - ${error}`);
    console.error('');
    process.exitCode = 1;
    return;
  }

  const { created, updated, unchanged } = await classify(plan);

  for (const entry of created) {
    console.info(
      `  CREATE  ${entry.stationCode.padEnd(10)} ${entry.dataType.padEnd(8)} -> ${entry.providerStationId}`,
    );
  }
  for (const { entry, from } of updated) {
    console.info(
      `  UPDATE  ${entry.stationCode.padEnd(10)} ${entry.dataType.padEnd(8)} ${from} -> ${entry.providerStationId}`,
    );
  }
  for (const entry of unchanged) {
    console.info(
      `  ok      ${entry.stationCode.padEnd(10)} ${entry.dataType.padEnd(8)} ${entry.providerStationId}`,
    );
  }

  console.info(
    `\n${created.length} to create, ${updated.length} to update, ${unchanged.length} already correct.`,
  );

  if (mode === 'plan') {
    console.info('\nThis was a dry run. Re-run with --apply to write these changes.');
    return;
  }

  if (created.length === 0 && updated.length === 0) {
    console.info('\nNothing to do.');
    return;
  }

  for (const entry of plan) {
    await prisma.stationProviderMapping.upsert({
      where: {
        stationId_dataType: { stationId: entry.stationId, dataType: entry.dataType },
      },
      create: {
        stationId: entry.stationId,
        dataType: entry.dataType,
        providerName: entry.providerName,
        providerStationId: entry.providerStationId,
        config: entry.config,
        isActive: true,
      },
      update: {
        providerName: entry.providerName,
        providerStationId: entry.providerStationId,
        config: entry.config,
        isActive: true,
      },
    });
  }

  console.info(`\nApplied ${created.length + updated.length} mapping(s).`);
  console.info('Cached responses may still be served until their TTL expires.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
