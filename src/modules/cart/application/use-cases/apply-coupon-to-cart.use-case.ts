import { Inject, Injectable } from '@nestjs/common';

import { FindCouponByCodeUseCase } from '@modules/coupons/application/use-cases/find-coupon-by-code.use-case';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';
import { GetCartUseCase } from './get-cart.use-case';

@Injectable()
export class ApplyCouponToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly findCouponByCodeUseCase: FindCouponByCodeUseCase,
  ) {}

  async execute(cartId: string, code: string): Promise<Cart> {
    const cart = await this.getCartUseCase.execute(cartId);
    const coupon = await this.findCouponByCodeUseCase.execute(code);

    cart.applyCoupon(coupon);

    return this.cartRepository.save(cart);
  }
}
