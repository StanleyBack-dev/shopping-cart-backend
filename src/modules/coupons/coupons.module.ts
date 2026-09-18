import { Module } from '@nestjs/common';

import { COUPON_REPOSITORY } from './application/ports/coupon-repository.port';
import { FindCouponByCodeUseCase } from './application/use-cases/find-coupon-by-code.use-case';
import { ListCouponsUseCase } from './application/use-cases/list-coupons.use-case';
import { CouponPrismaRepository } from './infrastructure/persistence/prisma/coupon-prisma.repository';
import { CouponsController } from './presentation/rest/controllers/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [
    ListCouponsUseCase,
    FindCouponByCodeUseCase,
    { provide: COUPON_REPOSITORY, useClass: CouponPrismaRepository },
  ],
  exports: [COUPON_REPOSITORY, FindCouponByCodeUseCase],
})
export class CouponsModule {}
