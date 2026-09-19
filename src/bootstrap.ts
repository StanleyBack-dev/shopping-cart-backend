import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet, { contentSecurityPolicy } from 'helmet';

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

  app.use(
    helmet({
      // The default 'self'-only script-src would block the Swagger UI
      // bundle loaded from jsdelivr below (see the /docs setup further down).
      contentSecurityPolicy: {
        directives: {
          ...contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        },
      },
    }),
  );
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

  // swagger-ui-dist's local static assets don't make it into the Vercel
  // serverless function bundle (only files reachable via require()/import()
  // are traced in; express.static's runtime directory read isn't), which
  // left /docs rendering blank in production. Loading them from a CDN,
  // pinned to the installed swagger-ui-dist version, sidesteps that
  // entirely and works the same locally and on Vercel.
  const SWAGGER_UI_VERSION = '5.32.13';
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customCssUrl: `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.min.css`,
    customJs: [
      `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`,
      `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js`,
    ],
  });
}
