import { Inject, Injectable } from '@nestjs/common';

import { APP_ERRORS } from '@common/exceptions/app-errors.catalog';
import { AppException } from '@common/exceptions/app-exception';

import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw AppException.from(APP_ERRORS.PRODUCT.NOT_FOUND, { productId: id });
    }

    return product;
  }
}
