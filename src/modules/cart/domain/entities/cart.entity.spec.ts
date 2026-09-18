import { AppException } from '@common/exceptions/app-exception';
import { Coupon } from '@modules/coupons/domain/entities/coupon.entity';
import { Product } from '@modules/products/domain/entities/product.entity';

import { Cart } from './cart.entity';

// jest's `.toThrow(ctor)` requires a public constructor type; AppException's
// constructor is intentionally private (instances are only built via `.from`).
const AppExceptionCtor = AppException as unknown as new (...args: unknown[]) => Error;

function buildProduct(
  overrides: Partial<{
    id: number;
    description: string;
    netUnitPrice: number;
    stockQuantity: number;
  }> = {},
): Product {
  return Product.create({
    id: 1,
    description: 'Wireless Mouse',
    netUnitPrice: 100,
    stockQuantity: 10,
    ...overrides,
  });
}

function buildCoupon(discountPercentage: number, code = '10OFF'): Coupon {
  return Coupon.create({ id: 1, code, discountPercentage });
}

describe('Cart', () => {
  describe('addItem', () => {
    it('adds a new product to an empty cart with the requested quantity', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();

      cart.addItem(product, 2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.subtotal).toBe(200);
    });

    it('sums the requested quantity onto an existing item instead of replacing it', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();

      cart.addItem(product, 1);
      cart.addItem(product, 1);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('rejects a quantity of zero or less', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();

      expect(() => cart.addItem(product, 0)).toThrow(AppExceptionCtor);
      expect(() => cart.addItem(product, -1)).toThrow(AppExceptionCtor);
    });

    it('rejects adding more than the available stock', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct({ stockQuantity: 5 });

      expect(() => cart.addItem(product, 6)).toThrow(AppExceptionCtor);
    });

    it('rejects exceeding stock across two additions of the same product', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct({ stockQuantity: 5 });

      cart.addItem(product, 3);

      expect(() => cart.addItem(product, 3)).toThrow(AppExceptionCtor);
      expect(cart.items[0].quantity).toBe(3);
    });
  });

  describe('updateItemQuantity', () => {
    it('replaces the quantity of an existing item', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct({ stockQuantity: 10 });

      cart.addItem(product, 2);
      cart.updateItemQuantity(product, 7);

      expect(cart.items[0].quantity).toBe(7);
    });

    it('throws when the product is not in the cart', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();

      expect(() => cart.updateItemQuantity(product, 3)).toThrow(AppExceptionCtor);
    });

    it('rejects a new quantity above the available stock', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct({ stockQuantity: 5 });

      cart.addItem(product, 2);

      expect(() => cart.updateItemQuantity(product, 6)).toThrow(AppExceptionCtor);
    });
  });

  describe('removeItem', () => {
    it('removes an existing item', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();

      cart.addItem(product, 1);
      cart.removeItem(product.id);

      expect(cart.items).toHaveLength(0);
    });

    it('throws when removing a product that is not in the cart', () => {
      const cart = Cart.createEmpty('cart-1');

      expect(() => cart.removeItem(999)).toThrow(AppExceptionCtor);
    });
  });

  describe('coupon handling', () => {
    it('has no discount when no coupon is applied', () => {
      const cart = Cart.createEmpty('cart-1');
      cart.addItem(buildProduct(), 1);

      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(cart.subtotal);
    });

    it('replaces a previously applied coupon instead of stacking it', () => {
      const cart = Cart.createEmpty('cart-1');
      cart.addItem(buildProduct({ netUnitPrice: 100 }), 1);

      cart.applyCoupon(buildCoupon(10, '10OFF'));
      cart.applyCoupon(buildCoupon(15, '15OFF'));

      expect(cart.coupon?.code).toBe('15OFF');
      expect(cart.discount).toBe(15);
    });

    it('removes the discount once the coupon is removed', () => {
      const cart = Cart.createEmpty('cart-1');
      cart.addItem(buildProduct({ netUnitPrice: 100 }), 1);
      cart.applyCoupon(buildCoupon(10));

      cart.removeCoupon();

      expect(cart.coupon).toBeNull();
      expect(cart.discount).toBe(0);
    });
  });

  describe('totals', () => {
    it('computes subtotal, discount and total across multiple items', () => {
      const cart = Cart.createEmpty('cart-1');
      cart.addItem(buildProduct({ id: 1, netUnitPrice: 89.9, stockQuantity: 20 }), 3);
      cart.addItem(buildProduct({ id: 2, netUnitPrice: 199.9, stockQuantity: 20 }), 2);
      cart.applyCoupon(buildCoupon(10));

      expect(cart.subtotal).toBe(669.5);
      expect(cart.discount).toBe(66.95);
      expect(cart.total).toBe(602.55);
    });

    it('is all zero for an empty cart', () => {
      const cart = Cart.createEmpty('cart-1');

      expect(cart.subtotal).toBe(0);
      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(0);
    });
  });

  describe('checkout', () => {
    it('finalizes a cart with at least one item', () => {
      const cart = Cart.createEmpty('cart-1');
      cart.addItem(buildProduct(), 1);

      cart.checkout();

      expect(cart.status).toBe('FINALIZED');
    });

    it('rejects finalizing an empty cart', () => {
      const cart = Cart.createEmpty('cart-1');

      expect(() => cart.checkout()).toThrow(AppExceptionCtor);
    });

    it('rejects any further mutation once finalized', () => {
      const cart = Cart.createEmpty('cart-1');
      const product = buildProduct();
      cart.addItem(product, 1);
      cart.checkout();

      expect(() => cart.addItem(product, 1)).toThrow(AppExceptionCtor);
      expect(() => cart.updateItemQuantity(product, 2)).toThrow(AppExceptionCtor);
      expect(() => cart.removeItem(product.id)).toThrow(AppExceptionCtor);
      expect(() => cart.applyCoupon(buildCoupon(10))).toThrow(AppExceptionCtor);
      expect(() => cart.removeCoupon()).toThrow(AppExceptionCtor);
      expect(() => cart.checkout()).toThrow(AppExceptionCtor);
    });
  });
});
