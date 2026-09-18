import { ApiProperty } from '@nestjs/swagger';

import { Coupon } from '../../../domain/entities/coupon.entity';

export class CouponResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '10OFF' })
  code: string;

  @ApiProperty({ example: 10, description: 'Percentage discount applied over the subtotal' })
  discountPercentage: number;

  static fromDomain(coupon: Coupon): CouponResponseDto {
    const dto = new CouponResponseDto();
    const primitives = coupon.toPrimitives();

    dto.id = primitives.id;
    dto.code = primitives.code;
    dto.discountPercentage = primitives.discountPercentage;

    return dto;
  }
}
