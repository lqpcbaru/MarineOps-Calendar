# API Contract — MarineOps Hub (OpenAPI 3.1)

**Version:** 2.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline (Frozen)  
**Authorised by:** ADR-0011  
**Related:** [API_VERSIONING](../architecture/API_VERSIONING.md), [ROUTES](../architecture/ROUTES.md), [AUTHENTICATION](../architecture/AUTHENTICATION.md), [AUTHORIZATION](../architecture/AUTHORIZATION.md)

This document is the **OpenAPI-first** contract for both surfaces. The YAML below is a single valid OpenAPI 3.1 document — extract the fenced block to `apps/api/openapi.yaml` at implementation time. Implementation must conform to this contract; contract changes require a docs update + (for the public surface) an ADR on major bumps.

---

## 1. Conventions

- Two servers: `PUBLIC_BASE` (`/api/public`) and `ADMIN_BASE` (`/api/v1`).
- All list endpoints paginated via `page` + `pageSize` query params; response wraps `data[]` + `total`.
- All sourced-data responses include a `freshness` envelope; computable responses omit it.
- Error envelope (both surfaces): `{ code, message, details?, correlationId? }`.
- Auth: `/api/public` — none. `/api/v1` — `Authorization: Bearer <jwt>` except the four auth routes.

---

## 2. OpenAPI 3.1 document

```yaml
openapi: 3.1.0
info:
  title: MarineOps Hub API
  version: 2.0.0
  description: |
    Two-surface API for MarineOps Hub.
    - /api/public : read-only, anonymous (Public Portal)
    - /api/v1     : JWT + RBAC (Admin Portal)
  contact:
    name: Lead Software Architect
servers:
  - url: /api/public
    description: Public surface (no auth)
  - url: /api/v1
    description: Admin surface (JWT + RBAC)

tags:
  - name: public-tide
  - name: public-weather
  - name: public-wind
  - name: public-wave
  - name: public-wind-wave
  - name: public-moon
  - name: public-sun
  - name: public-hijri
  - name: public-calendar
  - name: public-dashboard
  - name: public-alerts
  - name: public-stations
  - name: public-about
  - name: auth
  - name: users
  - name: roles
  - name: dashboard
  - name: calendar-admin
  - name: stations-admin
  - name: alerts-admin
  - name: audit
  - name: settings
  - name: health

security: []

paths:
  # ───────────────────────── HEALTH (platform, root) ─────────────────────────
  /health/live:
    get:
      tags: [health]
      summary: Liveness probe
      security: []
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema: { $ref: '#/components/schemas/HealthResponse' }
  /health/ready:
    get:
      tags: [health]
      summary: Readiness probe
      security: []
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema: { $ref: '#/components/schemas/HealthResponse' }

  # ───────────────────────── PUBLIC SURFACE (/api/public) ─────────────────────
  /tide:
    get:
      tags: [public-tide]
      summary: Tide data for a station and date range
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
      responses:
        '200':
          description: Tide data with freshness
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TideResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /weather:
    get:
      tags: [public-weather]
      summary: Marine weather forecast for a station and date range
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
      responses:
        '200':
          description: Weather data with freshness
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WeatherResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /wind:
    get:
      tags: [public-wind]
      summary: Wind data (speed, direction, gusts)
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
      responses:
        '200':
          description: Wind data with freshness
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WindResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /wave:
    get:
      tags: [public-wave]
      summary: Wave height data
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
      responses:
        '200':
          description: Wave data with freshness
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WaveResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /wind-wave:
    get:
      tags: [public-wind-wave]
      summary: Combined wind and wave data
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
      responses:
        '200':
          description: Combined wind and wave data with freshness
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WindWaveResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }
        '503': { $ref: '#/components/responses/ProviderUnavailable' }

  /moon:
    get:
      tags: [public-moon]
      summary: Moon phase for a date (computed)
      security: []
      parameters:
        - { name: date, in: query, required: true, schema: { type: string, format: date } }
      responses:
        '200':
          description: Moon phase
          content:
            application/json:
              schema: { $ref: '#/components/schemas/MoonResponse' }

  /sun:
    get:
      tags: [public-sun]
      summary: Sunrise/sunset for a station and date (computed)
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { name: date, in: query, required: true, schema: { type: string, format: date } }
      responses:
        '200':
          description: Sunrise/sunset
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SunResponse' }

  /hijri:
    get:
      tags: [public-hijri]
      summary: Convert Gregorian date to Hijri (computed)
      security: []
      parameters:
        - { name: date, in: query, required: true, schema: { type: string, format: date } }
      responses:
        '200':
          description: Hijri date
          content:
            application/json:
              schema: { $ref: '#/components/schemas/HijriResponse' }

  /calendar:
    get:
      tags: [public-calendar]
      summary: Unified marine calendar projection for a station and date range
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/DateFromQuery' }
        - { $ref: '#/components/parameters/DateToQuery' }
        - { name: view, in: query, schema: { type: string, enum: [day, week, month] } }
      responses:
        '200':
          description: Calendar projection
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CalendarResponse' }

  /dashboard:
    get:
      tags: [public-dashboard]
      summary: Public dashboard summary — today's key marine conditions
      security: []
      parameters:
        - {
            name: stationId,
            in: query,
            required: false,
            schema: { type: string },
            description: 'Defaults to org default station if omitted',
          }
      responses:
        '200':
          description: Public dashboard summary
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PublicDashboardResponse' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /alerts:
    get:
      tags: [public-alerts]
      summary: Published, non-expired marine alerts
      security: []
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/Pagination' }
      responses:
        '200':
          description: Paginated published alerts
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AlertsPublicList' }

  /stations:
    get:
      tags: [public-stations]
      summary: List active stations (public projection)
      security: []
      parameters:
        - { $ref: '#/components/parameters/Pagination' }
      responses:
        '200':
          description: Paginated active stations
          content:
            application/json:
              schema: { $ref: '#/components/schemas/StationsPublicList' }

  /stations/{id}:
    get:
      tags: [public-stations]
      summary: View a single active station (public projection)
      security: []
      parameters:
        - { $ref: '#/components/parameters/IdPath' }
      responses:
        '200':
          description: Station (public)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/StationPublic' }
        '404': { $ref: '#/components/responses/NotFound' }

  /about:
    get:
      tags: [public-about]
      summary: Static About content
      security: []
      responses:
        '200':
          description: About content
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AboutResponse' }

  # ───────────────────────── ADMIN SURFACE (/api/v1) ──────────────────────────
  /auth/login:
    post:
      tags: [auth]
      summary: Admin login (admin/officer only)
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/LoginRequest' }
      responses:
        '200':
          description: Access token issued; refresh token set as httpOnly cookie
          headers:
            Set-Cookie:
              schema: { type: string }
              description: mops_rt=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AccessTokenResponse' }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /auth/refresh:
    post:
      tags: [auth]
      summary: Rotate refresh token; issue new access token
      security: []
      responses:
        '200':
          description: New access token; new refresh cookie
          headers:
            Set-Cookie:
              schema: { type: string }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AccessTokenResponse' }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /auth/logout:
    post:
      tags: [auth]
      summary: Revoke refresh token and clear cookie
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logged out
          content:
            application/json:
              schema: { $ref: '#/components/schemas/OkResponse' }

  /auth/me:
    get:
      tags: [auth]
      summary: Current principal
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Principal
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Principal' }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /users:
    get:
      tags: [users]
      summary: List users
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Pagination' }
      responses:
        '200':
          description: Paginated users
          content:
            application/json:
              schema: { $ref: '#/components/schemas/UsersList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      tags: [users]
      summary: Create user
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UserCreate' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /users/{id}:
    get:
      tags: [users]
      summary: Get user
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      responses:
        '200':
          description: User
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '403': { $ref: '#/components/responses/Forbidden' }
    patch:
      tags: [users]
      summary: Update user (incl. status, roles)
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UserUpdate' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /roles:
    get:
      tags: [roles]
      summary: List roles
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Pagination' }
      responses:
        '200':
          description: Paginated roles
          content:
            application/json:
              schema: { $ref: '#/components/schemas/RolesList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      tags: [roles]
      summary: Create role
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/RoleCreate' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Role' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /roles/{id}:
    patch:
      tags: [roles]
      summary: Update role (incl. permission codes)
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/RoleUpdate' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Role' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /dashboard:
    get:
      tags: [dashboard]
      summary: Admin dashboard summary
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
      responses:
        '200':
          description: Dashboard summary
          content:
            application/json:
              schema: { $ref: '#/components/schemas/DashboardSummary' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /calendar:
    get:
      tags: [calendar-admin]
      summary: List calendar entries (admin)
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/Pagination' }
      responses:
        '200':
          description: Paginated calendar entries
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CalendarEntriesList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      tags: [calendar-admin]
      summary: Create calendar entry
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CalendarEntryCreate' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CalendarEntry' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /calendar/{id}:
    patch:
      tags: [calendar-admin]
      summary: Update calendar entry
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CalendarEntryUpdate' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CalendarEntry' }
        '403': { $ref: '#/components/responses/Forbidden' }
    delete:
      tags: [calendar-admin]
      summary: Archive calendar entry (soft delete)
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      responses:
        '204': { description: Archived }
        '403': { $ref: '#/components/responses/Forbidden' }

  /stations:
    get:
      tags: [stations-admin]
      summary: List stations (admin, includes archived)
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Pagination' }
        - { name: status, in: query, schema: { type: string, enum: [ACTIVE, ARCHIVED] } }
      responses:
        '200':
          description: Paginated stations (admin)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/StationsAdminList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      tags: [stations-admin]
      summary: Create station
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/StationCreate' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/StationAdmin' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /stations/{id}:
    patch:
      tags: [stations-admin]
      summary: Update station
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/StationUpdate' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/StationAdmin' }
        '403': { $ref: '#/components/responses/Forbidden' }
    delete:
      tags: [stations-admin]
      summary: Archive station (soft delete)
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      responses:
        '204': { description: Archived }
        '403': { $ref: '#/components/responses/Forbidden' }

  /alerts:
    get:
      tags: [alerts-admin]
      summary: List alerts (admin, all statuses)
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/StationIdQuery' }
        - { $ref: '#/components/parameters/Pagination' }
        - { name: status, in: query, schema: { type: string } }
      responses:
        '200':
          description: Paginated alerts (admin)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AlertsAdminList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      tags: [alerts-admin]
      summary: Create alert
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AlertCreate' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AlertAdmin' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /alerts/{id}:
    patch:
      tags: [alerts-admin]
      summary: Update alert (incl. publish/unpublish)
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/IdPath' }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AlertUpdate' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AlertAdmin' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /audit:
    get:
      tags: [audit]
      summary: Query audit trail
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Pagination' }
        - { name: entityType, in: query, schema: { type: string } }
        - { name: entityId, in: query, schema: { type: string } }
        - { name: actorId, in: query, schema: { type: string } }
        - { name: from, in: query, schema: { type: string, format: date-time } }
        - { name: to, in: query, schema: { type: string, format: date-time } }
      responses:
        '200':
          description: Paginated audit events
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuditList' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /settings:
    get:
      tags: [settings]
      summary: List settings (API keys redacted)
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Settings
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SettingsList' }
        '403': { $ref: '#/components/responses/Forbidden' }
    patch:
      tags: [settings]
      summary: Update settings
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SettingsUpdate' }
      responses:
        '200':
          description: Updated settings
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SettingsList' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /tide/refresh:
    post:
      tags: [settings]
      summary: Manually trigger tide cache refresh for a station
      security: [{ bearerAuth: [] }]
      parameters: [{ $ref: '#/components/parameters/StationIdQuery' }]
      responses:
        '202': { description: Refresh scheduled }
        '403': { $ref: '#/components/responses/Forbidden' }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    Pagination:
      name: pagination
      in: query
      description: 'page and pageSize, e.g. page=1&pageSize=20'
      schema: { type: object }
    StationIdQuery:
      name: stationId
      in: query
      required: true
      schema: { type: string }
    DateFromQuery:
      name: dateFrom
      in: query
      required: true
      schema: { type: string, format: date }
    DateToQuery:
      name: dateTo
      in: query
      required: true
      schema: { type: string, format: date }
    IdPath:
      name: id
      in: path
      required: true
      schema: { type: string }

  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    NotFound:
      description: Not found
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    RateLimited:
      description: Too many requests
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    ProviderUnavailable:
      description: External data provider unavailable and no cached data
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }

  schemas:
    HealthResponse:
      type: object
      properties:
        status: { type: string, enum: [ok] }
        timestamp: { type: string, format: date-time }
        checks: { type: object }
    OkResponse:
      type: object
      properties:
        ok: { type: boolean }

    ErrorEnvelope:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
        details: { type: object }
        correlationId: { type: string }

    Freshness:
      type: object
      properties:
        status: { type: string, enum: [fresh, stale, unavailable] }
        fetchedAt: { type: string, format: date-time }
        validUntil: { type: string, format: date-time }
        source: { type: string }

    PaginatedMeta:
      type: object
      properties:
        total: { type: integer }
        page: { type: integer }
        pageSize: { type: integer }

    # ── Auth ──
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email }
        password: { type: string, minLength: 8, maxLength: 256 }
    AccessTokenResponse:
      type: object
      properties:
        accessToken: { type: string }
        accessTokenExpiresAt: { type: string, format: date-time }
    Principal:
      type: object
      properties:
        userId: { type: string }
        email: { type: string }
        name: { type: string }
        roles: { type: array, items: { type: string } }
        permissionCodes: { type: array, items: { type: string } }

    # ── Sourced data (public + admin read same shape) ──
    TideDataPoint:
      type: object
      properties:
        date: { type: string, format: date }
        time: { type: string, format: date-time }
        height: { type: number, description: 'meters' }
        type: { type: string, enum: [HIGH, LOW] }
    TideResponse:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/TideDataPoint' } }
        freshness: { $ref: '#/components/schemas/Freshness' }
    WeatherDataPoint:
      type: object
      properties:
        date: { type: string, format: date }
        temperature: { type: number, description: '°C' }
        conditions: { type: string }
        visibility:
          {
            type: number,
            nullable: true,
            description: 'km — null apabila sumber tidak menyediakan',
          }
        precipitation:
          {
            type: number,
            nullable: true,
            description: 'mm — null apabila sumber tidak menyediakan',
          }
    WeatherResponse:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/WeatherDataPoint' } }
        freshness: { $ref: '#/components/schemas/Freshness' }
    WindResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            properties:
              date: { type: string, format: date }
              windSpeed: { type: number, description: 'knots' }
              windDirection: { type: string }
              windGusts: { type: number, description: 'knots' }
        freshness: { $ref: '#/components/schemas/Freshness' }
    WaveResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            properties:
              date: { type: string, format: date }
              waveHeight: { type: number, description: 'meters' }
              wavePeriod: { type: number, description: 'seconds' }
        freshness: { $ref: '#/components/schemas/Freshness' }
    WindWaveDataPoint:
      type: object
      properties:
        date: { type: string, format: date }
        windSpeed: { type: number, description: 'knots' }
        windDirection: { type: string }
        windGusts: { type: number, description: 'knots' }
        waveHeight: { type: number, description: 'meters' }
        wavePeriod: { type: number, description: 'seconds' }
    WindWaveResponse:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/WindWaveDataPoint' } }
        freshness: { $ref: '#/components/schemas/Freshness' }

    # ── Computable (no freshness) ──
    MoonResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            phaseName: { type: string }
            illumination: { type: number }
            moonrise: { type: string, format: date-time, nullable: true }
            moonset: { type: string, format: date-time, nullable: true }
    SunResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            sunrise: { type: string, format: date-time }
            sunset: { type: string, format: date-time }
    HijriResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            hijriDate: { type: string }
            gregorianDate: { type: string, format: date }

    CalendarResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            description: Per-day combined projection (tide/weather/wind/wave/moon/sun/hijri)
            properties:
              date: { type: string, format: date }
              hijriDate: { type: string }
              tide: { type: array, items: { $ref: '#/components/schemas/TideDataPoint' } }
              moon:
                type: object
                properties:
                  phaseName: { type: string }
                  illumination: { type: number }
              sun:
                type: object
                properties:
                  sunrise: { type: string, format: date-time }
                  sunset: { type: string, format: date-time }
              weather: { $ref: '#/components/schemas/WeatherDataPoint' }
              windWave: { $ref: '#/components/schemas/WindWaveDataPoint' }
              operationalStatus: { type: string, enum: [SAFE, CAUTION, DANGER, UNKNOWN] }
        freshness: { $ref: '#/components/schemas/Freshness' }

    PublicDashboardResponse:
      type: object
      properties:
        date: { type: string, format: date }
        hijriDate: { type: string }
        station:
          type: object
          properties:
            id: { type: string }
            name: { type: string }
            code: { type: string }
        tide:
          type: object
          properties:
            next: { $ref: '#/components/schemas/TideDataPoint', nullable: true }
            freshness: { $ref: '#/components/schemas/Freshness' }
        weather:
          type: object
          properties:
            current: { $ref: '#/components/schemas/WeatherDataPoint', nullable: true }
            freshness: { $ref: '#/components/schemas/Freshness' }
        windWave:
          type: object
          properties:
            current: { $ref: '#/components/schemas/WindWaveDataPoint', nullable: true }
            freshness: { $ref: '#/components/schemas/Freshness' }
        moon:
          type: object
          properties:
            phaseName: { type: string }
            illumination: { type: number }
        sun:
          type: object
          properties:
            sunrise: { type: string, format: date-time }
            sunset: { type: string, format: date-time }
        activeAlerts:
          type: object
          properties:
            count: { type: integer }
            latest:
              type: object
              nullable: true
              properties:
                id: { type: string }
                severity: { type: string, enum: [INFO, WARNING, CRITICAL] }
                title: { type: string }
                publishAt: { type: string, format: date-time }
        operationalStatus: { type: string, enum: [SAFE, CAUTION, DANGER, UNKNOWN] }

    # ── Stations ──
    StationPublic:
      type: object
      properties:
        id: { type: string }
        code: { type: string }
        name: { type: string }
        latitude: { type: number }
        longitude: { type: number }
        timezone: { type: string }
    StationAdmin:
      allOf:
        - $ref: '#/components/schemas/StationPublic'
        - type: object
          properties:
            status: { type: string, enum: [ACTIVE, ARCHIVED] }
            metadata: { type: object }
            createdAt: { type: string, format: date-time }
            updatedAt: { type: string, format: date-time }
    StationCreate:
      type: object
      required: [code, name, latitude, longitude, timezone]
      properties:
        code: { type: string }
        name: { type: string }
        latitude: { type: number }
        longitude: { type: number }
        timezone: { type: string }
        metadata: { type: object }
    StationUpdate:
      type: object
      properties:
        name: { type: string }
        latitude: { type: number }
        longitude: { type: number }
        timezone: { type: string }
        status: { type: string, enum: [ACTIVE, ARCHIVED] }
        metadata: { type: object }
    StationsPublicList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/StationPublic' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }
    StationsAdminList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/StationAdmin' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }

    # ── Calendar admin ──
    CalendarEntry:
      type: object
      properties:
        id: { type: string }
        stationId: { type: string }
        date: { type: string, format: date }
        title: { type: string }
        payload: { type: object }
        status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    CalendarEntryCreate:
      type: object
      required: [stationId, date, title, payload]
      properties:
        stationId: { type: string }
        date: { type: string, format: date }
        title: { type: string }
        payload: { type: object }
        status: { type: string, enum: [DRAFT, PUBLISHED] }
    CalendarEntryUpdate:
      type: object
      properties:
        title: { type: string }
        payload: { type: object }
        status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
    CalendarEntriesList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/CalendarEntry' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }

    # ── Alerts ──
    AlertPublic:
      type: object
      properties:
        id: { type: string }
        stationId: { type: string, nullable: true }
        severity: { type: string, enum: [INFO, WARNING, CRITICAL] }
        title: { type: string }
        body: { type: string }
        publishAt: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time, nullable: true }
    AlertAdmin:
      allOf:
        - $ref: '#/components/schemas/AlertPublic'
        - type: object
          properties:
            status: { type: string, enum: [DRAFT, PUBLISHED, UNPUBLISHED, EXPIRED] }
            createdAt: { type: string, format: date-time }
            updatedAt: { type: string, format: date-time }
    AlertCreate:
      type: object
      required: [title, body, severity]
      properties:
        stationId: { type: string, nullable: true }
        severity: { type: string, enum: [INFO, WARNING, CRITICAL] }
        title: { type: string }
        body: { type: string }
        status: { type: string, enum: [DRAFT, PUBLISHED] }
        publishAt: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time, nullable: true }
    AlertUpdate:
      type: object
      properties:
        severity: { type: string, enum: [INFO, WARNING, CRITICAL] }
        title: { type: string }
        body: { type: string }
        status: { type: string, enum: [DRAFT, PUBLISHED, UNPUBLISHED, EXPIRED] }
        publishAt: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time, nullable: true }
    AlertsPublicList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/AlertPublic' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }
    AlertsAdminList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/AlertAdmin' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }

    # ── Users / Roles ──
    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string }
        name: { type: string }
        status: { type: string, enum: [ACTIVE, DISABLED] }
        roleIds: { type: array, items: { type: string } }
        timezone: { type: string }
        locale: { type: string }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    UserCreate:
      type: object
      required: [email, name, password]
      properties:
        email: { type: string, format: email }
        name: { type: string }
        password: { type: string, minLength: 8 }
        roleIds: { type: array, items: { type: string } }
    UserUpdate:
      type: object
      properties:
        name: { type: string }
        status: { type: string, enum: [ACTIVE, DISABLED] }
        roleIds: { type: array, items: { type: string } }
        timezone: { type: string }
        locale: { type: string }
    UsersList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/User' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }
    Role:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        permissionCodes: { type: array, items: { type: string } }
    RoleCreate:
      type: object
      required: [name, permissionCodes]
      properties:
        name: { type: string }
        permissionCodes: { type: array, items: { type: string } }
    RoleUpdate:
      type: object
      properties:
        name: { type: string }
        permissionCodes: { type: array, items: { type: string } }
    RolesList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/Role' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }

    # ── Dashboard / Audit / Settings / About ──
    DashboardSummary:
      type: object
      properties:
        todayConditions: { type: array, items: { type: object } }
        activeAlerts: { type: integer }
        freshnessAlerts: { type: array, items: { type: object } }
    AuditEvent:
      type: object
      properties:
        id: { type: string }
        actorId: { type: string, nullable: true }
        action: { type: string }
        entityType: { type: string }
        entityId: { type: string }
        payload: { type: object }
        at: { type: string, format: date-time }
    AuditList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/AuditEvent' } }
        meta: { $ref: '#/components/schemas/PaginatedMeta' }
    SettingItem:
      type: object
      properties:
        key: { type: string }
        value: { type: string }
        category: { type: string }
        isSecret: { type: boolean }
    SettingsList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/SettingItem' } }
    SettingsUpdate:
      type: object
      properties:
        settings:
          type: array
          items:
            type: object
            properties:
              key: { type: string }
              value: { type: string }
    AboutResponse:
      type: object
      properties:
        title: { type: string }
        body: { type: string }
```

---

## 3. Notes

- The `Pagination` query parameter is shown conceptually; at implementation it becomes two query params (`page`, `pageSize`) per API_VERSIONING §5.
- All `4xx`/`5xx` responses use `ErrorEnvelope`.
- Sourced-data endpoints (`/api/public/tide|weather|wind|wave`) and the admin refresh endpoints (`/api/v1/<x>/refresh`) share the same module; only the public read shape is shown here. Admin data reads reuse `/api/public/<x>` per API_VERSIONING §2.1.
- This contract is the source of truth for the `packages/api-client` types (public-client + admin-client).

---

## 4. Change log

| Version | Date       | Notes                                                                                                                                                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1.0   | 2026-08-05 | Sprint 3.0: Add `/wind-wave`, `/dashboard` (public); expand DTOs (TideDataPoint, WeatherDataPoint, WindWaveDataPoint, PublicDashboardResponse, CalendarDayEntry); add 503 ProviderUnavailable response |
| 2.0.0   | 2026-07-31 | Initial Hub OpenAPI 3.1 contract (ADR-0011)                                                                                                                                                            |
