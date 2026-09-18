import { Injectable } from '@nestjs/common';
import { Product as ProductModel } from '@prisma/client';

import { PrismaService } from '@database/prisma.service';

import { ProductRepositoryPort } from '../../../application/ports/product-repository.port';
import { Product } from '../../../domain/entities/product.entity';

@Injectable()
export class ProductPrismaRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ orderBy: { id: 'asc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: number): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: ProductModel): Product {
    return Product.create({
      id: row.id,
      description: row.description,
      netUnitPrice: Number(row.netUnitPrice),
      stockQuantity: row.stockQuantity,
    });
  }
}
