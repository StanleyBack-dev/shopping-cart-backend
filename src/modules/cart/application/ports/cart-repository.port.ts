import { Cart } from '../../domain/entities/cart.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface CartRepositoryPort {
  findById(id: string): Promise<Cart | null>;
  /** Persists the full aggregate state (cart header, items and coupon) and returns it freshly hydrated. */
  save(cart: Cart): Promise<Cart>;
}
