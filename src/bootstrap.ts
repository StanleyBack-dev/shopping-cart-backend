import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { EnvironmentVariables } from './config/env.validation';

/**
 * Applies every cross-cutting concern (security headers, CORS, versioning,
 * validation, error formatting, Swagger) to a Nest application instance.
 * Shared by `main.ts` (traditional long-running server) and `api/index.ts`
 * (Vercel serverless handler) so both entry points stay in sync.
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL', { infer: true }),
    credentials: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shopping Cart API')
    .setDescription(
      'REST API that simulates a shopping cart: catalog, cart items, coupons and checkout.',
    )
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
}
