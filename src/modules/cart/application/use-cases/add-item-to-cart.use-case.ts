import { Inject, Injectable } from '@nestjs/common';

import { GetProductByIdUseCase } from '@modules/products/application/use-cases/get-product-by-id.use-case';

import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY, CartRepositoryPort } from '../ports/cart-repository.port';
import { GetCartUseCase } from './get-cart.use-case';

@Injectable()
export class AddItemToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepositoryPort,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  async execute(cartId: string, productId: number, quantity: number): Promise<Cart> {
    const cart = await this.getCartUseCase.execute(cartId);
    const product = await this.getProductByIdUseCase.execute(productId);

    cart.addItem(product, quantity);

    return this.cartRepository.save(cart);
  }
}
