export interface CouponProps {
  id: number;
  code: string;
  discountPercentage: number;
}

export class Coupon {
  private constructor(private readonly props: CouponProps) {}

  static create(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  get id(): number {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get discountPercentage(): number {
    return this.props.discountPercentage;
  }

  /** Rounded to 2 decimal places, since it represents a monetary amount. */
  calculateDiscount(subtotal: number): number {
    return Math.round(subtotal * (this.props.discountPercentage / 100) * 100) / 100;
  }

  toPrimitives(): CouponProps {
    return { ...this.props };
  }
}
