import { Module } from '@nestjs/common';

import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { PRODUCT_REPOSITORY } from './application/ports/product-repository.port';
import { ProductPrismaRepository } from './infrastructure/persistence/prisma/product-prisma.repository';
import { ProductsController } from './presentation/rest/controllers/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductByIdUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
  ],
  exports: [PRODUCT_REPOSITORY, GetProductByIdUseCase],
})
export class ProductsModule {}
