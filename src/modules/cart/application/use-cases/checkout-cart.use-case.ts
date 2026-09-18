import { Inject, Injectable } from '@nestjs/common';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';
import { GetCartUseCase } from './get-cart.use-case';

@Injectable()
export class CheckoutCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort,
    private readonly getCartUseCase: GetCartUseCase,
  ) {}

  async execute(cartId: string): Promise<Cart> {
    const cart = await this.getCartUseCase.execute(cartId);

    cart.checkout();

    return this.cartRepository.save(cart);
  }
}
