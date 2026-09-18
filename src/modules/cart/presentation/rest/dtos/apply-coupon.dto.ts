import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({ example: '10OFF', description: 'Coupon code to apply to the cart.' })
  @IsString({ message: 'code deve ser um texto.' })
  @IsNotEmpty({ message: 'code não pode ser vazio.' })
  code: string;
}
