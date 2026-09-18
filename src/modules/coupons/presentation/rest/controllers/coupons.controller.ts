import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ListCouponsUseCase } from '../../../application/use-cases/list-coupons.use-case';
import { CouponResponseDto } from '../dtos/coupon-response.dto';

@ApiTags('coupons')
@Controller({ path: 'coupons', version: '1' })
export class CouponsController {
  constructor(private readonly listCouponsUseCase: ListCouponsUseCase) {}

  @Get()
  @ApiOkResponse({
    type: CouponResponseDto,
    isArray: true,
    description: 'List the available coupons.',
  })
  async findAll(): Promise<CouponResponseDto[]> {
    const coupons = await this.listCouponsUseCase.execute();
    return coupons.map((coupon) => CouponResponseDto.fromDomain(coupon));
  }
}
