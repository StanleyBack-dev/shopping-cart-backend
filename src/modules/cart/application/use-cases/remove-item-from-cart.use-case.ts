import { Inject, Injectable } from '@nestjs/common';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';
import { GetCartUseCase } from './get-cart.use-case';

@Injectable()
export class RemoveItemFromCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort,
    private readonly getCartUseCase: GetCartUseCase,
  ) {}

  async execute(cartId: string, productId: number): Promise<Cart> {
    const cart = await this.getCartUseCase.execute(cartId);

    cart.removeItem(productId);

    return this.cartRepository.save(cart);
  }
}
