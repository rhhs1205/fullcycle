import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function configurarApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:4200'),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}

export function criarDocumentoSwagger(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Gestor de Tarefas')
      .setDescription('API de tarefas, categorias e indicadores')
      .setVersion('1.0')
      .build(),
  );
}

export function configurarSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, criarDocumentoSwagger(app));
}
