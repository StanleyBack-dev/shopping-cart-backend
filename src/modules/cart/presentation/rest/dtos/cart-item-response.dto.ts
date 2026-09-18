import { ApiProperty } from '@nestjs/swagger';

import { CartItem } from '../../../domain/entities/cart-item.entity';

export class CartItemResponseDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Mouse Sem Fio' })
  description: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 89.9, description: 'Net unit price' })
  unitPrice: number;

  @ApiProperty({ example: 179.8, description: 'unitPrice * quantity' })
  lineTotal: number;

  @ApiProperty({ example: 20, description: 'Quantity currently available in stock' })
  availableStock: number;

  static fromDomain(item: CartItem): CartItemResponseDto {
    const dto = new CartItemResponseDto();
    const primitives = item.toPrimitives();

    dto.productId = primitives.productId;
    dto.description = primitives.description;
    dto.quantity = primitives.quantity;
    dto.unitPrice = primitives.unitPrice;
    dto.lineTotal = primitives.lineTotal;
    dto.availableStock = primitives.availableStock;

    return dto;
  }
}
