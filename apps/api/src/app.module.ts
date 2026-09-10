import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PlatformModule } from './platform/platform.module';
import { PrismaModule } from './platform/prisma.module';
import { HealthModule } from './platform/health.module';
import { AuthenticationModule } from './modules/authentication/api/authentication.module';
import { UsersModule } from './modules/users/api/users.module';
import { RolesModule } from './modules/roles/api/roles.module';
import { AuditModule } from './modules/audit/api/audit.module';
import { DashboardModule } from './modules/dashboard/api/dashboard.module';
import { WeatherModule } from './modules/weather/api/weather.module';
import { TideModule } from './modules/tide/api/tide.module';
import { WindWaveModule } from './modules/wind-wave/api/wind-wave.module';
import { MoonModule } from './modules/moon/api/moon.module';
import { SunModule } from './modules/sun/api/sun.module';
import { StationsModule } from './modules/stations/api/stations.module';
import { OperationalCalendarModule } from './modules/operational-calendar/api/operational-calendar.module';
import { RecommendationModule } from './modules/recommendation/api/recommendation.module';
import { AisModule } from './modules/ais/api/ais.module';
import { VesselIntelligenceModule } from './modules/vessel-intelligence/api/vessel-intelligence.module';
import { AuthController } from './api/admin/auth.controller';
import { UsersController } from './api/admin/users.controller';
import { RolesController } from './api/admin/roles.controller';
import { AuditController } from './api/admin/audit.controller';
import { PublicDashboardController } from './api/public/public-dashboard.controller';
import { PublicWeatherController } from './api/public/public-weather.controller';
import { PublicTideController } from './api/public/public-tide.controller';
import { PublicWindWaveController } from './api/public/public-wind-wave.controller';
import { PublicMoonController } from './api/public/public-moon.controller';
import { PublicSunController } from './api/public/public-sun.controller';
import { PublicStationsController } from './api/public/public-stations.controller';
import { AdminStationsController } from './api/admin/admin-stations.controller';
import { PublicCalendarController } from './api/public/public-calendar.controller';
import { PublicRecommendationController } from './api/public/public-recommendation.controller';
import { PublicVesselsController } from './api/public/public-vessels.controller';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainExceptionFilter } from './platform/domain-exception.filter';
import { JwtAuthGuard } from './modules/authentication/api/jwt-auth.guard';
import { PermissionsGuard } from './modules/authentication/api/permissions.guard';

@Module({
  imports: [
    ConfigModule,
    PlatformModule,
    PrismaModule,
    HealthModule,
    AuthenticationModule,
    UsersModule,
    RolesModule,
    AuditModule,
    DashboardModule,
    WeatherModule,
    TideModule,
    WindWaveModule,
    MoonModule,
    SunModule,
    StationsModule,
    OperationalCalendarModule,
    RecommendationModule,
    AisModule,
    VesselIntelligenceModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    AuditController,
    PublicDashboardController,
    PublicWeatherController,
    PublicTideController,
    PublicWindWaveController,
    PublicMoonController,
    PublicSunController,
    PublicStationsController,
    AdminStationsController,
    PublicCalendarController,
    PublicRecommendationController,
    PublicVesselsController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    // Order matters: JwtAuthGuard resolves the principal onto the request,
    // and PermissionsGuard reads it. APP_GUARD instances run in the order
    // they are registered.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global so that @RequirePermissions is enforced wherever it appears.
    // It used to be applied per-controller via @UseGuards, which fails
    // OPEN in the one case that matters: a new controller that carries
    // @RequirePermissions but forgets @UseGuards(PermissionsGuard) reads
    // as protected and enforces nothing, because the decorator is only
    // metadata and nothing is left to act on it. Registering it here means
    // the decorator alone is sufficient. It returns true when a handler
    // has no @RequirePermissions metadata, so unannotated and @Public()
    // routes are unaffected.
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
