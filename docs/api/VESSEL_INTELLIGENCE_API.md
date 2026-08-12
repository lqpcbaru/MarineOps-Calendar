# Vessel Intelligence API

**Version:** 1.0.0  

---

## Endpoints

### `GET /api/public/vessels/search`

Search vessels by name, MMSI, IMO, or callsign.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `page` | number | No | Default: 1 |
| `pageSize` | number | No | Default: 20, max: 100 |

**Response:** `VesselSearchResult`

```json
{
  "vessels": [{
    "id": "v-1",
    "name": "Test Vessel",
    "mmsi": "123456789",
    "imo": "IMO123",
    "flag": "MY",
    "vesselType": "fishing",
    "source": "gfw",
    "dataStatus": "KNOWN",
    "lastKnownPosition": { "latitude": 3.0, "longitude": 101.0, "speed": 5, "course": 90, "heading": 85, "timestamp": "2026-08-07T00:00:00Z" },
    "lastPositionAt": "2026-08-07T00:00:00Z",
    "observedAt": "2026-08-07T00:00:00Z",
    "retrievedAt": "2026-08-07T12:00:00Z"
  }],
  "total": 1, "page": 1, "pageSize": 20,
  "retrievedAt": "2026-08-07T12:00:00Z",
  "source": "gfw"
}
```

### `GET /api/public/vessels/:vesselId`

Retrieve vessel profile with identity and recent events.

**Response:** `VesselProfile`

### `GET /api/public/vessels/:vesselId/events`

Retrieve vessel events.

| Param | Type | Required |
|-------|------|----------|
| `dateFrom` | date | No |
| `dateTo` | date | No |

**Response:** `VesselEventsResult`
