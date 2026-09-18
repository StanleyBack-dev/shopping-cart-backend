import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateItemQuantityDto {
  @ApiProperty({ example: 5, description: 'The exact quantity the item should have.' })
  @IsInt({ message: 'quantity deve ser um número inteiro.' })
  @IsPositive({ message: 'quantity deve ser maior que zero.' })
  quantity: number;
}
