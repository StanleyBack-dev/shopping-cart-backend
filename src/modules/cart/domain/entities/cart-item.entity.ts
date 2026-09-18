export interface CartItemProps {
  productId: number;
  quantity: number;
  /** Always the product's current net unit price — the cart never snapshots a stale price. */
  unitPrice: number;
  description: string;
  /** Quantity currently available in stock for this product, as of the last read. */
  availableStock: number;
}

export class CartItem {
  private constructor(private readonly props: CartItemProps) {}

  static create(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  get productId(): number {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  get description(): string {
    return this.props.description;
  }

  get availableStock(): number {
    return this.props.availableStock;
  }

  get lineTotal(): number {
    return Math.round(this.props.unitPrice * this.props.quantity * 100) / 100;
  }

  changeQuantity(quantity: number): void {
    this.props.quantity = quantity;
  }

  refreshProductSnapshot(unitPrice: number, description: string, availableStock: number): void {
    this.props.unitPrice = unitPrice;
    this.props.description = description;
    this.props.availableStock = availableStock;
  }

  toPrimitives(): CartItemProps & { lineTotal: number } {
    return { ...this.props, lineTotal: this.lineTotal };
  }
}
