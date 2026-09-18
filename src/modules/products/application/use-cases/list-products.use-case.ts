import { Inject, Injectable } from '@nestjs/common';

import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}
