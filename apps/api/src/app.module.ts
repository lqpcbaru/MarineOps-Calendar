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
import { AuthController } from './api/admin/auth.controller';
import { UsersController } from './api/admin/users.controller';
import { RolesController } from './api/admin/roles.controller';
import { AuditController } from './api/admin/audit.controller';
import { PublicDashboardController } from './api/public/public-dashboard.controller';
import { PublicWeatherController } from './api/public/public-weather.controller';
import { PublicTideController } from './api/public/public-tide.controller';
import { PublicWindWaveController } from './api/public/public-wind-wave.controller';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainExceptionFilter } from './platform/domain-exception.filter';
import { JwtAuthGuard } from './modules/authentication/api/jwt-auth.guard';

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
  ],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
