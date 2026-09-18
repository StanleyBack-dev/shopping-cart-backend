import { HttpStatus } from '@nestjs/common';

import { AppErrorDefinition } from '../app-error-definition.type';

export const COUPON_ERRORS = {
  NOT_FOUND: {
    code: 'COUPON_NOT_FOUND',
    httpStatus: HttpStatus.NOT_FOUND,
    message: (params: { code: string }) => `O cupom "${params.code}" não existe.`,
  } as AppErrorDefinition<{ code: string }>,
} as const;
