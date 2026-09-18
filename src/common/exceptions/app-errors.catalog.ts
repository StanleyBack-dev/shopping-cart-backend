import { CART_ERRORS } from './catalogs/cart-errors.catalog';
import { COUPON_ERRORS } from './catalogs/coupon-errors.catalog';
import { PRODUCT_ERRORS } from './catalogs/product-errors.catalog';

export const APP_ERRORS = {
  PRODUCT: PRODUCT_ERRORS,
  CART: CART_ERRORS,
  COUPON: COUPON_ERRORS,
} as const;
