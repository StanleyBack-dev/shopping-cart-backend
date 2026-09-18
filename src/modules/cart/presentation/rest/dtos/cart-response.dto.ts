import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CouponResponseDto } from '@modules/coupons/presentation/rest/dtos/coupon-response.dto';

import { Cart } from '../../../domain/entities/cart.entity';
import { CartStatus } from '../../../domain/enums/cart-status.enum';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d' })
  id: string;

  @ApiProperty({ enum: CartStatus, example: CartStatus.OPEN })
  status: CartStatus;

  @ApiProperty({ type: CartItemResponseDto, isArray: true })
  items: CartItemResponseDto[];

  @ApiPropertyOptional({ type: CouponResponseDto, nullable: true })
  coupon: CouponResponseDto | null;

  @ApiProperty({ example: 269.7, description: 'Sum of unitPrice * quantity for every item' })
  subtotal: number;

  @ApiProperty({ example: 26.97, description: 'Amount deducted by the applied coupon, if any' })
  discount: number;

  @ApiProperty({ example: 242.73, description: 'subtotal - discount' })
  total: number;

  @ApiPropertyOptional({ nullable: true })
  finalizedAt: Date | null;

  static fromDomain(cart: Cart): CartResponseDto {
    const dto = new CartResponseDto();
    const primitives = cart.toPrimitives();

    dto.id = primitives.id;
    dto.status = primitives.status;
    dto.items = cart.items.map((item) => CartItemResponseDto.fromDomain(item));
    dto.coupon = cart.coupon ? CouponResponseDto.fromDomain(cart.coupon) : null;
    dto.subtotal = primitives.subtotal;
    dto.discount = primitives.discount;
    dto.total = primitives.total;
    dto.finalizedAt = primitives.finalizedAt;

    return dto;
  }
}
