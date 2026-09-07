/**
 * Validation and planning for station → external-provider mappings.
 *
 * Sourced data needs two things: an API credential, and a per-station code
 * telling the provider WHICH of its locations this station corresponds to.
 * The seed creates one inactive, empty mapping row per station per data
 * type; supplying the codes is the operator's job, because they are
 * external data that this repository does not and must not guess.
 *
 * Until now that job meant hand-writing UPDATE statements against
 * station_provider_mappings, and getting it wrong is unusually punishing:
 *
 * - each data type reads a DIFFERENT key out of the `config` JSON, so the
 *   right code under the wrong key silently yields no data at all;
 * - a mistyped station code updates a row that exists, for the wrong
 *   place, and the API then serves confident forecasts for somewhere else
 *   — the failure the runbook singles out, since nothing downstream can
 *   detect it;
 * - a value that is really our own station UUID would be sent verbatim to
 *   MET Malaysia or JUPEM.
 *
 * This module turns a declarative file into a checked plan, so those
 * mistakes are refused before anything is written rather than discovered
 * from the wrong weather. It performs no I/O; the caller supplies the
 * station list and applies the result.
 */

/** The data types that require an external mapping. */
export const MAPPABLE_DATA_TYPES = ['tide', 'weather', 'wind'] as const;

export type MappableDataType = (typeof MAPPABLE_DATA_TYPES)[number];

/**
 * Where each provider looks for its code.
 *
 * Read straight off the providers: jupem-tide reads `config.stationCode`,
 * met-malaysia-weather and marine-forecast read `config.marineArea`, each
 * falling back to the `providerStationId` column. Getting this pairing
 * wrong is invisible at write time and produces a configuration error at
 * read time, so it lives in one place rather than in an operator's head.
 */
export const CONFIG_KEY_BY_DATA_TYPE: Record<MappableDataType, string> = {
  tide: 'stationCode',
  weather: 'marineArea',
  wind: 'marineArea',
};

/**
 * The provider each data type is actually served by, used to replace the
 * seed's `*_PLACEHOLDER` names once a real code is supplied. These match
 * the providerName each adapter reports in its own errors and metrics.
 */
export const PROVIDER_NAME_BY_DATA_TYPE: Record<MappableDataType, string> = {
  tide: 'JUPEM',
  weather: 'MetMalaysia',
  wind: 'MarineForecast',
};

/** A station as the database knows it. */
export interface KnownStation {
  id: string;
  code: string;
  status: string;
}

/** One line of the operator-supplied mapping file. */
export interface ProviderMappingEntry {
  stationCode: string;
  dataType: string;
  code: string;
  /** Optional override; defaults to the provider that serves this type. */
  providerName?: string;
}

/** A validated mapping, ready to write. */
export interface PlannedMapping {
  stationId: string;
  stationCode: string;
  dataType: MappableDataType;
  providerName: string;
  providerStationId: string;
  config: Record<string, string>;
}

export interface MappingPlan {
  plan: PlannedMapping[];
  errors: string[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Values that look like an unfilled template rather than a real code.
 *
 * The shipped example file is deliberately full of these so that running
 * the tool against it can never half-configure a live database: it fails
 * with a list of what still needs filling in.
 */
const PLACEHOLDER_PATTERN =
  /^(<.*>|change[_-]?me|changeme|todo|tbd|example|xxx+|placeholder|\?+)$/i;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates the operator's file against the stations that actually exist
 * and produces the rows to write.
 *
 * Collects every problem rather than stopping at the first, so one run
 * tells the operator everything they need to correct.
 */
export function buildProviderMappingPlan(raw: unknown, stations: KnownStation[]): MappingPlan {
  const errors: string[] = [];
  const plan: PlannedMapping[] = [];

  if (!Array.isArray(raw)) {
    return { plan: [], errors: ['The mapping file must contain a JSON array of entries.'] };
  }
  if (raw.length === 0) {
    return { plan: [], errors: ['The mapping file is empty — there is nothing to apply.'] };
  }

  const byCode = new Map(stations.map((s) => [s.code.toUpperCase(), s]));
  const seen = new Set<string>();

  raw.forEach((item, index) => {
    const where = `entry ${index + 1}`;
    if (typeof item !== 'object' || item === null) {
      errors.push(`${where}: expected an object.`);
      return;
    }
    const entry = item as Partial<ProviderMappingEntry>;

    if (!isNonEmptyString(entry.stationCode)) {
      errors.push(`${where}: "stationCode" is required.`);
      return;
    }
    const stationCode = entry.stationCode.trim().toUpperCase();

    if (!isNonEmptyString(entry.dataType)) {
      errors.push(`${where} (${stationCode}): "dataType" is required.`);
      return;
    }
    const dataType = entry.dataType.trim().toLowerCase();

    // moon and sun are computed in-process from the station's own
    // coordinates; a mapping for them would be inert, and someone writing
    // one has misunderstood what needs configuring.
    if (dataType === 'moon' || dataType === 'sun') {
      errors.push(
        `${where} (${stationCode}): "${dataType}" is computed locally and needs no provider mapping.`,
      );
      return;
    }
    if (!(MAPPABLE_DATA_TYPES as readonly string[]).includes(dataType)) {
      errors.push(
        `${where} (${stationCode}): unknown dataType "${entry.dataType}" — expected one of ${MAPPABLE_DATA_TYPES.join(', ')}.`,
      );
      return;
    }
    const typedDataType = dataType as MappableDataType;

    const duplicateKey = `${stationCode}:${typedDataType}`;
    if (seen.has(duplicateKey)) {
      errors.push(`${where}: duplicate entry for ${stationCode} / ${typedDataType}.`);
      return;
    }
    seen.add(duplicateKey);

    const station = byCode.get(stationCode);
    if (!station) {
      // A typo here would otherwise be silent, or worse, land on a real
      // but different station.
      errors.push(`${where}: no station with code "${stationCode}".`);
      return;
    }
    if (station.status !== 'ACTIVE') {
      errors.push(
        `${where}: station ${stationCode} is ${station.status}; activate the station before mapping it.`,
      );
      return;
    }

    if (!isNonEmptyString(entry.code)) {
      errors.push(`${where} (${stationCode}/${typedDataType}): "code" is required.`);
      return;
    }
    const code = entry.code.trim();

    if (PLACEHOLDER_PATTERN.test(code)) {
      errors.push(
        `${where} (${stationCode}/${typedDataType}): "${code}" is a template placeholder, not a real provider code.`,
      );
      return;
    }
    if (UUID_PATTERN.test(code)) {
      // Our own station ids are UUIDs. Sending one upstream is meaningless
      // and the providers refuse it at read time; refuse it at write time.
      errors.push(
        `${where} (${stationCode}/${typedDataType}): "code" looks like an internal station UUID, not a provider code.`,
      );
      return;
    }

    const providerName = isNonEmptyString(entry.providerName)
      ? entry.providerName.trim()
      : PROVIDER_NAME_BY_DATA_TYPE[typedDataType];

    plan.push({
      stationId: station.id,
      stationCode,
      dataType: typedDataType,
      providerName,
      // Both are written: the providers read the config key first and fall
      // back to this column, so keeping them equal means either path
      // resolves to the same code.
      providerStationId: code,
      config: { [CONFIG_KEY_BY_DATA_TYPE[typedDataType]]: code },
    });
  });

  return { plan, errors };
}
