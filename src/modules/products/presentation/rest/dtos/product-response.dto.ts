import { ApiProperty } from '@nestjs/swagger';

import { Product } from '../../../domain/entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mouse Sem Fio' })
  description: string;

  @ApiProperty({ example: 89.9, description: 'Net unit price' })
  netUnitPrice: number;

  @ApiProperty({ example: 20, description: 'Quantity currently available in stock' })
  stockQuantity: number;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    const primitives = product.toPrimitives();

    dto.id = primitives.id;
    dto.description = primitives.description;
    dto.netUnitPrice = primitives.netUnitPrice;
    dto.stockQuantity = primitives.stockQuantity;

    return dto;
  }
}
