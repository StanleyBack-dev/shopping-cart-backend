import { APP_ERRORS } from '@common/exceptions/app-errors.catalog';
import { AppException } from '@common/exceptions/app-exception';
import { Coupon } from '@modules/coupons/domain/entities/coupon.entity';
import { Product } from '@modules/products/domain/entities/product.entity';

import { CartStatus } from '../enums/cart-status.enum';
import { CartItem } from './cart-item.entity';

export interface CartProps {
  id: string;
  status: CartStatus;
  items: CartItem[];
  coupon: Coupon | null;
  createdAt?: Date;
  updatedAt?: Date;
  finalizedAt?: Date | null;
}

export class Cart {
  private constructor(private props: CartProps) {}

  static createEmpty(id: string): Cart {
    return new Cart({ id, status: CartStatus.OPEN, items: [], coupon: null, finalizedAt: null });
  }

  static reconstruct(props: CartProps): Cart {
    return new Cart(props);
  }

  get id(): string {
    return this.props.id;
  }

  get status(): CartStatus {
    return this.props.status;
  }

  get items(): readonly CartItem[] {
    return this.props.items;
  }

  get coupon(): Coupon | null {
    return this.props.coupon;
  }

  get subtotal(): number {
    const total = this.props.items.reduce((sum, item) => sum + item.lineTotal, 0);
    return Math.round(total * 100) / 100;
  }

  get discount(): number {
    return this.props.coupon ? this.props.coupon.calculateDiscount(this.subtotal) : 0;
  }

  get total(): number {
    return Math.round((this.subtotal - this.discount) * 100) / 100;
  }

  addItem(product: Product, quantity: number): void {
    this.ensureOpen();
    this.ensurePositiveQuantity(quantity);

    const existing = this.findItem(product.id);
    const newQuantity = existing ? existing.quantity + quantity : quantity;
    this.ensureStockAvailable(product, newQuantity);

    if (existing) {
      existing.changeQuantity(newQuantity);
      existing.refreshProductSnapshot(
        product.netUnitPrice,
        product.description,
        product.stockQuantity,
      );
    } else {
      this.props.items.push(
        CartItem.create({
          productId: product.id,
          quantity: newQuantity,
          unitPrice: product.netUnitPrice,
          description: product.description,
          availableStock: product.stockQuantity,
        }),
      );
    }
  }

  updateItemQuantity(product: Product, quantity: number): void {
    this.ensureOpen();
    this.ensurePositiveQuantity(quantity);

    const existing = this.findItem(product.id);
    if (!existing) {
      throw AppException.from(APP_ERRORS.CART.ITEM_NOT_FOUND, { productId: product.id });
    }

    this.ensureStockAvailable(product, quantity);
    existing.changeQuantity(quantity);
    existing.refreshProductSnapshot(
      product.netUnitPrice,
      product.description,
      product.stockQuantity,
    );
  }

  removeItem(productId: number): void {
    this.ensureOpen();

    const existing = this.findItem(productId);
    if (!existing) {
      throw AppException.from(APP_ERRORS.CART.ITEM_NOT_FOUND, { productId });
    }

    this.props.items = this.props.items.filter((item) => item.productId !== productId);
  }

  /** Only one coupon may be active at a time — applying a new one replaces the previous. */
  applyCoupon(coupon: Coupon): void {
    this.ensureOpen();
    this.props.coupon = coupon;
  }

  removeCoupon(): void {
    this.ensureOpen();
    this.props.coupon = null;
  }

  checkout(): void {
    this.ensureOpen();

    if (this.props.items.length === 0) {
      throw AppException.from(APP_ERRORS.CART.EMPTY_CART_CHECKOUT);
    }

    this.props.status = CartStatus.FINALIZED;
    this.props.finalizedAt = new Date();
  }

  private findItem(productId: number): CartItem | undefined {
    return this.props.items.find((item) => item.productId === productId);
  }

  private ensureOpen(): void {
    if (this.props.status === CartStatus.FINALIZED) {
      throw AppException.from(APP_ERRORS.CART.ALREADY_FINALIZED);
    }
  }

  private ensurePositiveQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw AppException.from(APP_ERRORS.CART.INVALID_QUANTITY);
    }
  }

  private ensureStockAvailable(product: Product, requestedQuantity: number): void {
    if (!product.hasStockFor(requestedQuantity)) {
      throw AppException.from(APP_ERRORS.CART.INSUFFICIENT_STOCK, {
        productId: product.id,
        requestedQuantity,
        availableStock: product.stockQuantity,
      });
    }
  }

  toPrimitives() {
    return {
      id: this.props.id,
      status: this.props.status,
      items: this.props.items.map((item) => item.toPrimitives()),
      coupon: this.props.coupon?.toPrimitives() ?? null,
      subtotal: this.subtotal,
      discount: this.discount,
      total: this.total,
      createdAt: this.props.createdAt ?? null,
      updatedAt: this.props.updatedAt ?? null,
      finalizedAt: this.props.finalizedAt ?? null,
    };
  }
}
