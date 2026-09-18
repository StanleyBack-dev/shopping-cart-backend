import { GetProductByIdUseCase } from '@modules/products/application/use-cases/get-product-by-id.use-case';
import { Product } from '@modules/products/domain/entities/product.entity';

import { Cart } from '../../domain/entities/cart.entity';
import { CartRepositoryPort } from '../ports/cart-repository.port';
import { AddItemToCartUseCase } from './add-item-to-cart.use-case';
import { GetCartUseCase } from './get-cart.use-case';

describe('AddItemToCartUseCase', () => {
  it('loads the cart and product, applies the domain rule and persists the result', async () => {
    const cart = Cart.createEmpty('cart-1');
    const product = Product.create({
      id: 1,
      description: 'Mouse',
      netUnitPrice: 10,
      stockQuantity: 5,
    });

    const cartRepository: jest.Mocked<CartRepositoryPort> = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation((c: Cart) => Promise.resolve(c)),
    };
    const getCartUseCase = {
      execute: jest.fn().mockResolvedValue(cart),
    } as unknown as GetCartUseCase;
    const getProductByIdUseCase = {
      execute: jest.fn().mockResolvedValue(product),
    } as unknown as GetProductByIdUseCase;

    const useCase = new AddItemToCartUseCase(cartRepository, getCartUseCase, getProductByIdUseCase);
    const result = await useCase.execute('cart-1', 1, 2);

    expect(getCartUseCase.execute).toHaveBeenCalledWith('cart-1');
    expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(cartRepository.save).toHaveBeenCalledWith(cart);
    expect(result.items[0].quantity).toBe(2);
  });
});
