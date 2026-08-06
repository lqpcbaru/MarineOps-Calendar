# Station Module — API Contract

**Version:** 1.0.0  
**Date:** 2026-08-06  
**Status:** Proposed  
**Authorised by:** ADR-0012  
**Related:** [OPENAPI](OPENAPI.md), [PUBLIC_API](PUBLIC_API.md), [STATION_SRS](../requirements/STATION_SRS.md)

---

## 1. Public Endpoints

### 1.1 `GET /api/public/stations`

List active stations (public projection — no admin fields).

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Default: 1 |
| `pageSize` | integer | No | Default: 20, max: 100 |
| `regionId` | string | No | Filter by region (includes sub-regions) |

**Response 200:**

```json
{
  "data": [
    {
      "id": "st-001",
      "code": "PKG-01",
      "name": "Stesen Pemerhatian Pelabuhan Klang",
      "latitude": 3.003300,
      "longitude": 101.392500,
      "timezone": "Asia/Kuala_Lumpur",
      "regionId": "reg-pkg",
      "regionName": "Pelabuhan Klang"
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 20 }
}
```

### 1.2 `GET /api/public/stations/{id}`

View a single active station.

**Response 200:**

```json
{
  "id": "st-001",
  "code": "PKG-01",
  "name": "Stesen Pemerhatian Pelabuhan Klang",
  "latitude": 3.003300,
  "longitude": 101.392500,
  "timezone": "Asia/Kuala_Lumpur",
  "regionId": "reg-pkg",
  "regionName": "Pelabuhan Klang"
}
```

**Response 404:** `ErrorEnvelope` with `code: "NOT_FOUND"`.

### 1.3 `GET /api/public/stations/regions`

List active operation regions with station counts.

**Response 200:**

```json
{
  "data": [
    {
      "id": "reg-pbs",
      "code": "PBS",
      "name": "Pantai Barat Selangor",
      "description": "Kawasan operasi pantai barat Selangor",
      "stationCount": 4,
      "children": [
        {
          "id": "reg-pkg",
          "code": "PKG",
          "name": "Pelabuhan Klang",
          "stationCount": 2,
          "children": []
        }
      ]
    }
  ]
}
```

---

## 2. Admin Endpoints

### 2.1 Station CRUD

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/v1/stations` | `station.read` | List stations (includes archived) |
| `GET` | `/api/v1/stations/{id}` | `station.read` | Get station by ID |
| `POST` | `/api/v1/stations` | `station.write` | Create station |
| `PATCH` | `/api/v1/stations/{id}` | `station.write` | Update station |
| `DELETE` | `/api/v1/stations/{id}` | `station.write` | Archive station (soft delete) |

**POST `/api/v1/stations` request:**

```json
{
  "code": "PKG-03",
  "name": "Stesen Pulau Ketam",
  "latitude": 3.040000,
  "longitude": 101.250000,
  "timezone": "Asia/Kuala_Lumpur",
  "regionId": "reg-pkg",
  "metadata": { "type": "coastal", "depth": 15 }
}
```

**Response 201:**

```json
{
  "id": "st-003",
  "code": "PKG-03",
  "name": "Stesen Pulau Ketam",
  "latitude": 3.040000,
  "longitude": 101.250000,
  "timezone": "Asia/Kuala_Lumpur",
  "status": "ACTIVE",
  "regionId": "reg-pkg",
  "metadata": { "type": "coastal", "depth": 15 },
  "createdAt": "2026-08-06T00:00:00Z",
  "updatedAt": "2026-08-06T00:00:00Z"
}
```

### 2.2 Region CRUD

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/v1/stations/regions` | `station.read` | List regions (admin) |
| `POST` | `/api/v1/stations/regions` | `station.write` | Create region |
| `PATCH` | `/api/v1/stations/regions/{id}` | `station.write` | Update region |
| `DELETE` | `/api/v1/stations/regions/{id}` | `station.write` | Archive region |

### 2.3 Provider Mapping CRUD

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/v1/stations/{id}/providers` | `station.read` | List provider mappings for a station |
| `POST` | `/api/v1/stations/{id}/providers` | `station.write` | Create provider mapping |
| `PATCH` | `/api/v1/stations/{id}/providers/{mappingId}` | `station.write` | Update provider mapping |
| `DELETE` | `/api/v1/stations/{id}/providers/{mappingId}` | `station.write` | Delete provider mapping |

**POST provider mapping request:**

```json
{
  "dataType": "tide",
  "providerName": "JUPEM",
  "providerStationId": "PKCP001",
  "config": {
    "endpoint": "https://api.jupem.gov.my/tide",
    "keyRef": "jupem.api.key"
  }
}
```

---

## 3. Error Responses

All errors use the standard `ErrorEnvelope`:

| HTTP | Code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid input (bad lat/long, bad code format) |
| 404 | `NOT_FOUND` | Station or region ID not found |
| 409 | `STATION_CODE_EXISTS` | Duplicate station code |
| 409 | `REGION_CODE_EXISTS` | Duplicate region code |
| 403 | `AUTH_FORBIDDEN` | Missing `station.read` / `station.write` permission |

---

## 4. DTO Summary

### Public DTO (no admin fields)

```typescript
interface StationPublic {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionId: string | null;
  regionName: string | null;
}
```

### Admin DTO (full)

```typescript
interface StationAdmin extends StationPublic {
  status: 'ACTIVE' | 'ARCHIVED';
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### Region DTO

```typescript
interface OperationRegion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentRegionId: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  sortOrder: number;
  stationCount: number;
  children: OperationRegion[];
}
```

### Provider Mapping DTO

```typescript
interface StationProviderMapping {
  id: string;
  stationId: string;
  dataType: 'tide' | 'weather' | 'wind' | 'wave';
  providerName: string;
  providerStationId: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
}
```

---

## 5. Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-08-06 | Initial Station API contract (ADR-0012) |
