import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggingService } from './platform/logging.service';

async function bootstrap() {
  const logger = new LoggingService('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  logger.log(`MarineOps Hub API started on port ${port}`);
}

bootstrap();
