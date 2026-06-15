import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Global ValidationPipe — applied to every incoming request body and param.
   *
   * - whitelist: strips any property not declared in the DTO class (prevents extra fields from leaking into the service).
   * - forbidNonWhitelisted: throws a 400 if the client sends an unrecognised property (strict mode on top of whitelist).
   * - transform: auto-converts plain JSON payloads into the DTO class instances and coerces primitive types
   *   (e.g. a query-string "10" becomes the number 10 when the DTO type is `number`).
   */
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Normalises every error (HttpException subclasses + TypeORM QueryFailedError)
  // into the same { statusCode, timestamp, path, message } envelope.
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger / OpenAPI ────────────────────────────────────────────────────
  // The generated spec is served at GET /api (Swagger UI) and GET /api-json (raw JSON).
  // Every DTO property decorated with @ApiProperty / @ApiPropertyOptional appears in the spec.
  const config = new DocumentBuilder()
      .setVersion('1.0')
      .setTitle('NestJS Project - Blog APP API')
      .addServer("http://localhost:3000")
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // ─────────────────────────────────────────────────────────────────────────

  const configService = app.get(ConfigService);
  await app.listen(configService.get<number>('app.port', 3000));
}
bootstrap();
