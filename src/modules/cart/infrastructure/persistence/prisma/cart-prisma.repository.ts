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

  async save(cart: Cart): Promise<Cart> {
    const primitives = cart.toPrimitives();

    await this.prisma.$transaction(async (tx) => {
      await tx.cart.upsert({
        where: { id: primitives.id },
        create: {
          id: primitives.id,
          status: primitives.status,
          couponId: primitives.coupon?.id ?? null,
          finalizedAt: primitives.finalizedAt,
        },
        update: {
          status: primitives.status,
          couponId: primitives.coupon?.id ?? null,
          finalizedAt: primitives.finalizedAt,
        },
      });

      const existingItems = await tx.cartItem.findMany({ where: { cartId: primitives.id } });
      const currentProductIds = new Set(primitives.items.map((item) => item.productId));
      const staleItemIds = existingItems
        .filter((item) => !currentProductIds.has(item.productId))
        .map((item) => item.id);

      if (staleItemIds.length > 0) {
        await tx.cartItem.deleteMany({ where: { id: { in: staleItemIds } } });
      }

      for (const item of primitives.items) {
        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: primitives.id, productId: item.productId } },
          create: { cartId: primitives.id, productId: item.productId, quantity: item.quantity },
          update: { quantity: item.quantity },
        });
      }
    });

    const saved = await this.findById(primitives.id);
    if (!saved) {
      throw new Error(`Cart ${primitives.id} could not be reloaded after being saved.`);
    }

    return saved;
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
