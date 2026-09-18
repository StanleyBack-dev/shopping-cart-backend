import { HttpStatus } from '@nestjs/common';

import { AppErrorDefinition } from '../app-error-definition.type';

export const PRODUCT_ERRORS = {
  NOT_FOUND: {
    code: 'PRODUCT_NOT_FOUND',
    httpStatus: HttpStatus.NOT_FOUND,
    message: (params: { productId: number }) =>
      `Produto com id ${params.productId} não foi encontrado.`,
  } as AppErrorDefinition<{ productId: number }>,
} as const;
