import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class CreateCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort) {}

  async execute(): Promise<Cart> {
    const cart = Cart.createEmpty(randomUUID());
    return this.cartRepository.save(cart);
  }
}
