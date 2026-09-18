import { Coupon } from '../../domain/entities/coupon.entity';

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');

export interface CouponRepositoryPort {
  findAll(): Promise<Coupon[]>;
  findByCode(code: string): Promise<Coupon | null>;
  findById(id: number): Promise<Coupon | null>;
}
