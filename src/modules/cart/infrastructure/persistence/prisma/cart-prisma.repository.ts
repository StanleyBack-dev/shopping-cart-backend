import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@database/prisma.service';
import { Coupon } from '@modules/coupons/domain/entities/coupon.entity';

import { CartRepositoryPort } from '../../../application/ports/cart-repository.port';
import { CartItem } from '../../../domain/entities/cart-item.entity';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartStatus } from '../../../domain/enums/cart-status.enum';

const cartWithRelations = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    coupon: true,
    items: { include: { product: true }, orderBy: { createdAt: 'asc' } },
  },
});

type CartWithRelations = Prisma.CartGetPayload<typeof cartWithRelations>;

@Injectable()
export class CartPrismaRepository implements CartRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({ where: { id }, ...cartWithRelations });
    return row ? this.toDomain(row) : null;
  }

  /**
   * Writes the full aggregate in a single round trip to the database,
   * regardless of item count, using one statement with data-modifying
   * CTEs (Postgres always executes every data-modifying CTE in a WITH
   * clause, even ones the final statement doesn't select from — see
   * https://www.postgresql.org/docs/current/queries-with.html). This
   * matters in practice: with a pooled connection sitting a network hop
   * away (e.g. Neon), each additional round trip this method used to make
   * (a `$transaction` alone costs a BEGIN/COMMIT pair, plus one query per
   * item) was directly felt as UI lag on every add/update/remove.
   *
   * The caller's in-memory `cart` already reflects exactly what gets
   * persisted here (its items were hydrated from a prior `findById`, and
   * any touched item was refreshed against the live `Product`), so there's
   * no need to re-read it back from the database afterwards either.
   *
   * Splitting into "has items" / "empty" is only to keep the SQL valid —
   * `INSERT ... VALUES` can't be given zero rows. A cart's row always
   * already exists by the time this is called with a non-empty item list
   * (items are only ever added through a use case that first loads an
   * existing cart), so there's no ordering hazard between the CTEs despite
   * Postgres not guaranteeing execution order among independent ones.
   */
  async save(cart: Cart): Promise<Cart> {
    const primitives = cart.toPrimitives();

    const cartUpsert = Prisma.sql`
      INSERT INTO "tb_carts" ("idtb_carts", "status", "idtb_coupons", "finalized_at", "created_at", "updated_at")
      VALUES (${primitives.id}, ${primitives.status}::"cart_status", ${primitives.coupon?.id ?? null}, ${primitives.finalizedAt}, now(), now())
      ON CONFLICT ("idtb_carts") DO UPDATE SET
        "status" = EXCLUDED."status",
        "idtb_coupons" = EXCLUDED."idtb_coupons",
        "finalized_at" = EXCLUDED."finalized_at",
        "updated_at" = now()
    `;

    if (primitives.items.length === 0) {
      await this.prisma.$executeRaw`
        WITH upsert_cart AS (${cartUpsert})
        DELETE FROM "tb_cart_items" WHERE "idtb_carts" = ${primitives.id}
      `;
      return cart;
    }

    const itemRows = primitives.items.map(
      (item) =>
        Prisma.sql`(${randomUUID()}, ${primitives.id}, ${item.productId}, ${item.quantity}, now(), now())`,
    );
    const currentProductIds = primitives.items.map((item) => item.productId);

    await this.prisma.$executeRaw`
      WITH upsert_cart AS (${cartUpsert}),
      deleted_items AS (
        DELETE FROM "tb_cart_items"
        WHERE "idtb_carts" = ${primitives.id} AND "idtb_products" NOT IN (${Prisma.join(currentProductIds)})
      )
      INSERT INTO "tb_cart_items" ("idtb_cart_items", "idtb_carts", "idtb_products", "quantity", "created_at", "updated_at")
      VALUES ${Prisma.join(itemRows)}
      ON CONFLICT ("idtb_carts", "idtb_products")
      DO UPDATE SET "quantity" = EXCLUDED."quantity", "updated_at" = now()
    `;

    return cart;
  }

  private toDomain(row: CartWithRelations): Cart {
    const items = row.items.map((item) =>
      CartItem.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.product.netUnitPrice),
        description: item.product.description,
        availableStock: item.product.stockQuantity,
      }),
    );

    return Cart.reconstruct({
      id: row.id,
      status: row.status as CartStatus,
      items,
      coupon: row.coupon
        ? Coupon.create({
            id: row.coupon.id,
            code: row.coupon.code,
            discountPercentage: Number(row.coupon.discountPercentage),
          })
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      finalizedAt: row.finalizedAt,
    });
  }
}
