import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PlatformModule } from './platform/platform.module';
import { HealthModule } from './platform/health.module';

@Module({
  imports: [ConfigModule, PlatformModule, HealthModule],
})
export class AppModule {}
