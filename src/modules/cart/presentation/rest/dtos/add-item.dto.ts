import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ example: 1, description: 'Id of the product to add.' })
  @IsInt({ message: 'productId deve ser um número inteiro.' })
  @IsPositive({ message: 'productId deve ser um número positivo.' })
  productId: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Quantity to add. Defaults to 1 when omitted.',
  })
  @IsOptional()
  @IsInt({ message: 'quantity deve ser um número inteiro.' })
  @IsPositive({ message: 'quantity deve ser maior que zero.' })
  quantity: number = 1;
}
