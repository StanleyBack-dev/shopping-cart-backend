import { Module } from '@nestjs/common';

import { CouponsModule } from '@modules/coupons/coupons.module';
import { ProductsModule } from '@modules/products/products.module';

import { CART_REPOSITORY } from './application/ports/cart-repository.port';
import { AddItemToCartUseCase } from './application/use-cases/add-item-to-cart.use-case';
import { ApplyCouponToCartUseCase } from './application/use-cases/apply-coupon-to-cart.use-case';
import { CheckoutCartUseCase } from './application/use-cases/checkout-cart.use-case';
import { CreateCartUseCase } from './application/use-cases/create-cart.use-case';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { RemoveCouponFromCartUseCase } from './application/use-cases/remove-coupon-from-cart.use-case';
import { RemoveItemFromCartUseCase } from './application/use-cases/remove-item-from-cart.use-case';
import { UpdateItemQuantityUseCase } from './application/use-cases/update-item-quantity.use-case';
import { CartPrismaRepository } from './infrastructure/persistence/prisma/cart-prisma.repository';
import { CartController } from './presentation/rest/controllers/cart.controller';

@Module({
  imports: [ProductsModule, CouponsModule],
  controllers: [CartController],
  providers: [
    CreateCartUseCase,
    GetCartUseCase,
    AddItemToCartUseCase,
    UpdateItemQuantityUseCase,
    RemoveItemFromCartUseCase,
    ApplyCouponToCartUseCase,
    RemoveCouponFromCartUseCase,
    CheckoutCartUseCase,
    { provide: CART_REPOSITORY, useClass: CartPrismaRepository },
  ],
})
export class CartModule {}
