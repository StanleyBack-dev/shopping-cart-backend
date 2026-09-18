import { Inject, Injectable } from '@nestjs/common';

import { APP_ERRORS } from '@common/exceptions/app-errors.catalog';
import { AppException } from '@common/exceptions/app-exception';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class GetCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort) {}

  async execute(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw AppException.from(APP_ERRORS.CART.NOT_FOUND, { cartId });
    }

    return cart;
  }
}
