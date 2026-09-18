import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter';

/**
 * Exercises the full cart flow against a real, running Nest application.
 * Requires a reachable DATABASE_URL (see .env) with the catalog seeded —
 * run `npm run prisma:migrate:dev && npm run prisma:seed` first.
 */
describe('Cart (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a cart, adds an item, applies a coupon and checks out', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const createResponse = await request(httpServer).post('/v1/carts').expect(201);
    const cartId: string = createResponse.body.id;

    const addItemResponse = await request(httpServer)
      .post(`/v1/carts/${cartId}/items`)
      .send({ productId: 1, quantity: 2 })
      .expect(200);
    expect(addItemResponse.body.items).toHaveLength(1);
    expect(addItemResponse.body.subtotal).toBeGreaterThan(0);

    const couponResponse = await request(httpServer)
      .post(`/v1/carts/${cartId}/coupon`)
      .send({ code: '10OFF' })
      .expect(200);
    expect(couponResponse.body.discount).toBeCloseTo(couponResponse.body.subtotal * 0.1, 2);

    const checkoutResponse = await request(httpServer)
      .post(`/v1/carts/${cartId}/checkout`)
      .expect(200);
    expect(checkoutResponse.body.status).toBe('FINALIZED');

    await request(httpServer)
      .post(`/v1/carts/${cartId}/items`)
      .send({ productId: 2, quantity: 1 })
      .expect(422);
  }, 20000);

  it('rejects adding more items than the available stock', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const createResponse = await request(httpServer).post('/v1/carts').expect(201);
    const cartId: string = createResponse.body.id;

    const response = await request(httpServer)
      .post(`/v1/carts/${cartId}/items`)
      .send({ productId: 5, quantity: 999 })
      .expect(422);

    expect(response.body.code).toBe('CART_INSUFFICIENT_STOCK');
  });

  it('returns a treated error for an unknown coupon', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const createResponse = await request(httpServer).post('/v1/carts').expect(201);
    const cartId: string = createResponse.body.id;

    const response = await request(httpServer)
      .post(`/v1/carts/${cartId}/coupon`)
      .send({ code: 'DOES-NOT-EXIST' })
      .expect(404);

    expect(response.body.code).toBe('COUPON_NOT_FOUND');
  });
});
