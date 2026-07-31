import { Module, Global } from '@nestjs/common';
import configuration from './configuration';

@Global()
@Module({
  providers: [
    {
      provide: 'CONFIG',
      useFactory: configuration,
    },
  ],
  exports: ['CONFIG'],
})
export class ConfigModule {}
