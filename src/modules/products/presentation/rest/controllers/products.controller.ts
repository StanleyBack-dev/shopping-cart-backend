import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { GetProductByIdUseCase } from '../../../application/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../../application/use-cases/list-products.use-case';
import { ProductResponseDto } from '../dtos/product-response.dto';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: ProductResponseDto, isArray: true, description: 'List the full catalog.' })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProductsUseCase.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto, description: 'Retrieve a single product by id.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    const product = await this.getProductByIdUseCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  }
}
