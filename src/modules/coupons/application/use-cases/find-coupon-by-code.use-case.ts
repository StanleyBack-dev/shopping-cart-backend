import { Inject, Injectable } from '@nestjs/common';

import { APP_ERRORS } from '@common/exceptions/app-errors.catalog';
import { AppException } from '@common/exceptions/app-exception';

import { Coupon } from '../../domain/entities/coupon.entity';
import { COUPON_REPOSITORY, CouponRepositoryPort } from '../ports/coupon-repository.port';

@Injectable()
export class FindCouponByCodeUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly couponRepository: CouponRepositoryPort) {}

  async execute(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(code);

    if (!coupon) {
      throw AppException.from(APP_ERRORS.COUPON.NOT_FOUND, { code });
    }

    return coupon;
  }
}
