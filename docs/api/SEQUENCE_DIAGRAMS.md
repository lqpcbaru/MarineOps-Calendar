# Sequence Diagrams — MarineOps Hub

**Version:** 2.0.0  
**Last updated:** 2026-07-31  
**Status:** Baseline (Frozen)  
**Authorised by:** ADR-0011  
**Related:** [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md), [AUTHENTICATION](../architecture/AUTHENTICATION.md), [ROUTES](../architecture/ROUTES.md), [OPENAPI](OPENAPI.md)

Diagrams are written in **Mermaid** so they render in any Markdown viewer that supports Mermaid (GitHub, GitLab, IDE preview). Each diagram maps to SRS requirement IDs.

---

## 1. Admin Login (FR-AUTH-001, FR-AUTH-002, FR-AUTH-006)

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin Browser
    participant C as AuthController (/api/v1/auth)
    participant L as LoginUseCase
    participant IDP as UserIdentityProvider
    participant H as PasswordHasher (argon2id)
    participant T as TokenService (JWT)
    participant R as RefreshTokenRepository
    participant E as DomainEventBus

    A->>C: POST /api/v1/auth/login {email, password}
    C->>L: execute(LoginCommand)
    L->>L: Zod validate command
    L->>IDP: findByEmail(email)
    IDP-->>L: UserAuthRecord | null
    alt no user
        L-->>C: throw InvalidCredentialsError
        C-->>A: 401 AUTH_INVALID_CREDENTIALS
    else user found
        L->>H: verify(password, passwordHash)
        H-->>L: boolean
        alt wrong password
            L-->>C: throw InvalidCredentialsError
            C-->>A: 401 AUTH_INVALID_CREDENTIALS
        else status == DISABLED
            L-->>C: throw UserDisabledError
            C-->>A: 403 AUTH_USER_DISABLED
        else credentials OK
            L->>IDP: toPrincipal(user)
            L->>T: mintAccessToken(principal)
            T-->>L: AccessToken
            L->>T: generateRefreshToken(userId)
            T-->>L: IssuedRefreshToken {rawToken, hash}
            L->>R: save(RefreshToken {hash, familyId, expiresAt})
            L->>E: publish(UserLoggedIn)
            L-->>C: LoginResult {accessToken, refreshToken}
            C->>C: setRefreshCookie(httpOnly, Secure, SameSite=Lax)
            C-->>A: 200 {accessToken, accessTokenExpiresAt} + Set-Cookie
        end
    end
```

---

## 2. Refresh Token Rotation + Reuse Detection (FR-AUTH-003, FR-AUTH-004)

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin Browser
    participant C as AuthController
    participant U as RefreshUseCase
    participant T as TokenService
    participant R as RefreshTokenRepository
    participant IDP as UserIdentityProvider
    participant E as DomainEventBus

    Note over A,C: refresh token carried in httpOnly cookie
    A->>C: POST /api/v1/auth/refresh (cookie: mops_rt)
    C->>U: execute(RefreshCommand)
    U->>T: hashRefreshToken(rawToken)
    U->>R: findByHash(hash)
    R-->>U: RefreshToken | null

    alt no record
        U-->>C: throw RefreshTokenNotFoundError
        C-->>A: 401 + clear cookie
    else record revoked (reuse detected)
        U->>R: revokeFamily(familyId)
        U->>E: publish(RefreshTokenReused)
        U-->>C: throw RefreshTokenReusedError
        C-->>A: 401 + clear cookie
    else expired
        U-->>C: throw RefreshTokenExpiredError
        C-->>A: 401 + clear cookie
    else valid
        U->>IDP: findById(userId)
        IDP-->>U: UserAuthRecord (ACTIVE)
        U->>IDP: toPrincipal(user)
        U->>R: save(existing.revoke().markReplacedBy(newId))
        U->>T: mintAccessToken(principal)
        U->>T: generateRefreshToken(userId) (same familyId)
        U->>R: save(new RefreshToken)
        U->>E: publish(RefreshTokenRotated)
        U-->>C: RefreshResult {accessToken, refreshToken}
        C->>C: setRefreshCookie(new rawToken)
        C-->>A: 200 {accessToken, accessTokenExpiresAt} + Set-Cookie
    end
```

---

## 3. Public Calendar Read (FR-CAL-001, FR-CAL-002, FR-TID/WEA/WND/WAV/MON/SUN/HIJ-001)

No authentication. Read-through projection across multiple modules.

```mermaid
sequenceDiagram
    autonumber
    actor V as Anonymous Visitor
    participant PC as PublicCalendarController (/api/public/calendar)
    participant MC as MarineCalendar (read projection)
    participant T as Tide query port
    participant W as Weather query port
    participant WN as Wind query port
    participant WV as Wave query port
    participant M as MoonPhase (pure)
    participant S as SunriseSunset (pure)
    participant HZ as HijriCalendar (pure)

    V->>PC: GET /api/public/calendar?stationId&dateFrom&dateTo
    PC->>MC: getPublicEntry(stationId, dateRange)
    par fan-out reads
        MC->>T: query(stationId, range)
        T-->>MC: tide[] + freshness
    and
        MC->>W: query(stationId, range)
        W-->>MC: weather[] + freshness
    and
        MC->>WN: query(stationId, range)
        WN-->>MC: wind[] + freshness
    and
        MC->>WV: query(stationId, range)
        WV-->>MC: wave[] + freshness
    and
        MC->>M: computeMoonPhase(date)
        M-->>MC: MoonPhaseData (instant)
    and
        MC->>S: computeSunriseSunset(lat,long,date)
        S-->>MC: SunriseSunsetData (instant)
    and
        MC->>HZ: convertToHijri(date)
        HZ-->>MC: HijriDateData (instant)
    end
    MC-->>PC: PublicCalendarDTO (subset, no PII)
    PC-->>V: 200 { data: [...], freshness: {...} }
    Note over V,PC: Cache-Control: public, max-age=<sec to validUntil>
```

> Sourced modules (Tide/Weather/Wind/Wave) internally check their cache first; on stale they attempt an external fetch and fall back to cached-with-`stale` flag per ADR-0008 (see diagram 5).

---

## 4. Admin Station CRUD with Audit (FR-STN-001..004, FR-AUD-001..002)

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant G as JwtAuthGuard + PermissionsGuard
    participant C as StationsController (/api/v1/stations)
    participant U as StationAdmin use-case
    participant AZ as AuthorizeUseCase
    participant R as StationsRepository
    participant E as DomainEventBus
    participant AUD as Audit module (consumer)

    A->>C: POST /api/v1/stations {code,name,lat,long,...}
    C->>G: guard checks Bearer JWT
    G->>G: verify token → AuthPrincipal
    G->>G: PermissionsGuard: require station.write
    alt missing permission
        G-->>A: 403 AUTH_FORBIDDEN
    end
    C->>U: create(StationCreate)
    U->>AZ: requireAll(principal, [station.write])
    alt denied
        U-->>C: throw ForbiddenError
        C-->>A: 403
    end
    U->>U: validate (code unique per org)
    U->>R: insert(stations)
    U->>E: publish(StationCreated)
    E-->>AUD: consume → insert(audit_events)
    U-->>C: StationAdmin
    C-->>A: 201 StationAdmin
```

---

## 5. Sourced Data Refresh (cron) + Stale Fallback (FR-TID-002, FR-TID-003, NFR-REL-002)

```mermaid
sequenceDiagram
    autonumber
    participant CRON as NestJS Schedule (cron)
    participant UC as GetTide use-case
    participant CACHE as TideCacheRepository
    participant PROV as TideProvider (external adapter)
    participant API as External Tide API
    participant E as DomainEventBus

    CRON->>UC: refreshForStation(stationId) [hourly]
    UC->>CACHE: get(stationId, parameter)
    CACHE-->>UC: cache row (validUntil)
    alt now < validUntil (fresh)
        UC-->>CRON: no-op (fresh)
    else nearing/at validUntil
        UC->>PROV: fetch(stationId, range)
        PROV->>API: HTTPS GET /tide?...
        alt success
            API-->>PROV: tide data
            PROV-->>UC: mapped TideData (domain model)
            UC->>CACHE: upsert(stationId, parameter, payload, validUntil)
            UC-->>CRON: refreshed
        else failure / timeout
            PROV-->>UC: error
            UC->>E: publish(DataStaleDetected)
            UC->>CACHE: leave existing row (now stale)
            UC-->>CRON: stale fallback served on next read
        end
    end
```

---

## 6. Public Alert Read vs Admin Alert Publish (FR-ALR-001..004)

Shows the public/admin read-sharing pattern on the same `alerts` table.

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitor
    actor A as Admin
    participant PAC as PublicAlertsController (/api/public/alerts)
    participant AAC as AlertsAdminController (/api/v1/alerts)
    participant M as MarineAlerts module
    participant R as alerts table
    participant E as DomainEventBus
    participant AUD as Audit

    %% Admin write
    A->>AAC: POST /api/v1/alerts {title, severity, status:PUBLISHED}
    AAC->>M: create(AlertCreate) [after RBAC]
    M->>R: INSERT alert (status=PUBLISHED)
    M->>E: publish(AlertPublished)
    E-->>AUD: insert audit_event
    AAC-->>A: 201 AlertAdmin

    %% Public read (same table, filtered projection)
    V->>PAC: GET /api/public/alerts?stationId=...
    PAC->>M: findPublic(stationId)
    M->>R: SELECT WHERE status='PUBLISHED' AND (expires_at IS NULL OR expires_at > now())
    R-->>M: rows
    M-->>PAC: AlertPublic[] (no internal fields)
    PAC-->>V: 200 { data, meta }
```

---

## 7. Request lifecycle: public vs admin gating (NFR-SEC-001)

```mermaid
sequenceDiagram
    autonumber
    participant HTTP as HTTP request
    participant GW as JwtAuthGuard (global)
    participant CTRL as Controller
    participant UC as Use-case

    HTTP->>GW: arrives
    alt path starts /api/public OR /health OR /api/v1/auth/{login,refresh}
        GW->>GW: @Public → skip auth
    else /api/v1/*
        GW->>GW: verify Bearer JWT
        alt invalid/missing
            GW-->>HTTP: 401 AUTH_UNAUTHORIZED
        end
        GW->>GW: attach AuthPrincipal
        GW->>CTRL: proceed (PermissionsGuard checks @RequirePermissions)
    end
    CTRL->>UC: invoke
    UC->>UC: AuthorizeUseCase (authoritative RBAC)
    UC-->>CTRL: result / DomainError
    CTRL-->>HTTP: 2xx / 4xx (ErrorEnvelope)
```

---

## 9. Sourced Data Read — Cache + Stale Fallback (FR-TID-001..003, NFR-REL-002)

Detailed flow inside a single sourced-data module (Tide shown as example). Applies to Weather, Wind, Wave identically.

```mermaid
sequenceDiagram
    autonumber
    actor V as Anonymous Visitor
    participant PC as PublicController (/api/public/tide)
    participant QP as TideQueryPort
    participant CS as TideCacheService
    participant CR as TideCacheRepository
    participant P as TideProvider (adapter)
    participant API as External Tide API

    V->>PC: GET /api/public/tide?stationId&dateFrom&dateTo
    PC->>QP: query(stationId, range)
    QP->>CS: get(stationId, range)
    CS->>CR: findValid(stationId, parameter, range)
    CR-->>CS: cacheRow | null

    alt cache FRESH (now < validUntil)
        CS-->>QP: { data, freshness: { status: "fresh" } }
        QP-->>PC: TideResponse
        PC-->>V: 200 { data, freshness } + Cache-Control: public, max-age=N
    else cache STALE (now >= validUntil)
        CS->>P: fetch(stationId, range)
        alt provider success
            P->>API: HTTPS GET /tide?...
            API-->>P: tide data
            P-->>CS: TideDataPoint[] (domain-mapped)
            CS->>CR: upsert(stationId, payload, validUntil)
            CS-->>QP: { data, freshness: { status: "fresh" } }
            QP-->>PC: TideResponse
            PC-->>V: 200 + Cache-Control: public, max-age=N
        else provider failure / timeout
            P-->>CS: error
            CS-->>QP: { data: cachedData, freshness: { status: "stale" } }
            QP-->>PC: TideResponse (stale)
            PC-->>V: 200 + Cache-Control: max-age=0, stale-while-revalidate=60
            Note over PC,V: X-Data-Freshness: stale
        end
    else cache MISS (no row)
        CS->>P: fetch(stationId, range)
        alt provider success
            P-->>CS: TideDataPoint[]
            CS->>CR: insert(stationId, payload, validUntil)
            CS-->>QP: { data, freshness: { status: "fresh" } }
            QP-->>PC: TideResponse
            PC-->>V: 200 + Cache-Control
        else provider failure
            P-->>CS: error
            CS-->>QP: null
            QP-->>PC: throw ProviderUnavailableError
            PC-->>V: 503 PROVIDER_UNAVAILABLE
        end
    end
```

---

## 10. Public Dashboard Fan-Out (FR-DSH-001..002)

Single API call aggregates today's conditions from all modules. No auth, 5-minute CDN cache.

```mermaid
sequenceDiagram
    autonumber
    actor V as Anonymous Visitor
    participant PD as PublicDashboardController (/api/public/dashboard)
    participant DASH as Dashboard (read projection)
    participant T as Tide query port
    participant W as Weather query port
    participant WW as Wind/Wave query port
    participant M as MoonPhase (pure)
    participant S as SunriseSunset (pure)
    participant HZ as HijriCalendar (pure)
    participant AL as MarineAlerts query port

    V->>PD: GET /api/public/dashboard?stationId=...
    PD->>DASH: getPublicDashboard(stationId)
    par fan-out reads
        DASH->>T: query(stationId, today)
        T-->>DASH: tide + freshness
    and
        DASH->>W: query(stationId, today)
        W-->>DASH: weather + freshness
    and
        DASH->>WW: query(stationId, today)
        WW-->>DASH: windWave + freshness
    and
        DASH->>M: computeMoonPhase(today)
        M-->>DASH: MoonPhaseData (instant)
    and
        DASH->>S: computeSunriseSunset(lat, long, today)
        S-->>DASH: SunriseSunsetData (instant)
    and
        DASH->>HZ: convertToHijri(today)
        HZ-->>DASH: HijriDateData (instant)
    and
        DASH->>AL: findPublic(stationId)
        AL-->>DASH: published alerts (count + latest)
    end
    DASH-->>PD: PublicDashboardResponse
    PD-->>V: 200 { date, station, tide, weather, windWave, moon, sun, activeAlerts, operationalStatus }
    Note over PD,V: Cache-Control: public, max-age=300
```

---

## 11. Change log

| Version | Date       | Notes                                    |
| ------- | ---------- | ---------------------------------------- |
| 2.1.0   | 2026-08-05 | Sprint 3.0: Add diagrams 9 (sourced data read with cache + stale fallback) and 10 (public dashboard fan-out) |
| 2.0.0   | 2026-07-31 | Initial Hub sequence diagrams (ADR-0011) |
