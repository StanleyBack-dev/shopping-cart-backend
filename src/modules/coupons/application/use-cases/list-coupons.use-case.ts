import { Inject, Injectable } from '@nestjs/common';

import { Coupon } from '../../domain/entities/coupon.entity';
import { COUPON_REPOSITORY, CouponRepositoryPort } from '../ports/coupon-repository.port';

@Injectable()
export class ListCouponsUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly couponRepository: CouponRepositoryPort) {}

  async execute(): Promise<Coupon[]> {
    return this.couponRepository.findAll();
  }
}
