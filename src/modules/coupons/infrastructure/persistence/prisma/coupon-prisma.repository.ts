import { Injectable } from '@nestjs/common';
import { Coupon as CouponModel } from '@prisma/client';

import { PrismaService } from '@database/prisma.service';

import { CouponRepositoryPort } from '../../../application/ports/coupon-repository.port';
import { Coupon } from '../../../domain/entities/coupon.entity';

@Injectable()
export class CouponPrismaRepository implements CouponRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Coupon[]> {
    const rows = await this.prisma.coupon.findMany({ orderBy: { id: 'asc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({ where: { code } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: number): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: CouponModel): Coupon {
    return Coupon.create({
      id: row.id,
      code: row.code,
      discountPercentage: Number(row.discountPercentage),
    });
  }
}
