export interface ProductProps {
  id: number;
  description: string;
  netUnitPrice: number;
  stockQuantity: number;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): number {
    return this.props.id;
  }

  get description(): string {
    return this.props.description;
  }

  get netUnitPrice(): number {
    return this.props.netUnitPrice;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  hasStockFor(quantity: number): boolean {
    return quantity <= this.props.stockQuantity;
  }

  toPrimitives(): ProductProps {
    return { ...this.props };
  }
}
