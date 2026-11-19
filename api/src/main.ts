import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp, configurarSwagger } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  configurarSwagger(app);

  const porta = app.get(ConfigService).get<number>('API_PORT', 3000);
  await app.listen(porta);

  const logger = new Logger('Bootstrap');
  logger.log(`API rodando em http://localhost:${porta}`);
  logger.log(`Documentação em http://localhost:${porta}/docs`);
}

void bootstrap();
