# Station → provider mappings

Sourced data needs two things, and an API key alone is not enough:

| Requirement                                             | Supplied by                         |
| ------------------------------------------------------- | ----------------------------------- |
| API credential (`METMALAYSIA_API_KEY`, `JUPEM_API_KEY`) | Secret manager                      |
| Per-station external code                               | **You**, per station, per data type |

The seed creates one **inactive, empty** mapping row per station per data
type. Until a real code is supplied, `/api/public/tide`, `/weather` and
`/wind-wave` return `503 PROVIDER_CONFIG_ERROR` — the expected state of a
freshly deployed environment, not a fault.

## The file

Copy `example.json`, fill in the codes you have been issued, and keep it
out of git (`*.json` here is ignored except the example). One entry per
station per data type:

```json
{ "stationCode": "PKG-01", "dataType": "tide", "code": "THE-CODE-YOU-WERE-GIVEN" }
```

`dataType` is one of `tide`, `weather`, `wind`. `moon` and `sun` are
computed in-process from the station's own coordinates and need no
mapping — the tool rejects entries for them.

`providerName` may be set to override the default (`JUPEM`,
`MetMalaysia`, `MarineForecast`), for example when pointing at a staging
endpoint.

## Applying

```bash
# what is configured right now
pnpm db:mappings:status

# validate a file and print the diff, writing nothing
MAPPINGS_FILE=./infrastructure/provider-mappings/production.json pnpm db:mappings:plan

# write it
MAPPINGS_FILE=./infrastructure/provider-mappings/production.json pnpm db:mappings:apply
```

`DATABASE_URL` must be set, as for any other database task. Applying is
idempotent — re-running the same file reports every row as `ok`.

## What the tool refuses

Each check exists because the mistake it prevents is either silent or
actively misleading:

- **An unknown or archived station code.** A typo would otherwise update a
  row that exists, for a different place, and the API would then serve
  confident forecasts for somewhere else — nothing downstream can detect
  that.
- **The wrong `config` key.** Each provider reads a different key out of
  the same JSON column (`tide` → `stationCode`, `weather` and `wind` →
  `marineArea`). The tool writes the right one for you; a correct code
  under the wrong key configures nothing while appearing configured.
- **A value that is really an internal station UUID.** It would be sent
  verbatim to MET Malaysia or JUPEM.
- **Template placeholders** (`<...>`, `CHANGEME`, `TODO`, …). Running the
  tool against `example.json` unedited fails with a list of what still
  needs filling in, rather than half-configuring a live database.
- **Duplicate entries** for the same station and data type.

Every problem in the file is reported in one run.

## After applying

Cached responses may still be served until their TTL expires. Confirm with:

```bash
curl -s "$APP_URL/api/public/weather?stationId=<uuid>&dateFrom=<date>&dateTo=<date>"
```

A `503` with code `PROVIDER_CONFIG_ERROR` means the mapping is still
missing; `502` means the provider was reached and something went wrong
upstream. See the failure-mode table in the production runbook.
