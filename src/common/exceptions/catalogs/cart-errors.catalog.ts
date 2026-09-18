import { HttpStatus } from '@nestjs/common';

import { AppErrorDefinition } from '../app-error-definition.type';

export const CART_ERRORS = {
  NOT_FOUND: {
    code: 'CART_NOT_FOUND',
    httpStatus: HttpStatus.NOT_FOUND,
    message: (params: { cartId: string }) => `Carrinho com id ${params.cartId} não foi encontrado.`,
  } as AppErrorDefinition<{ cartId: string }>,

  ITEM_NOT_FOUND: {
    code: 'CART_ITEM_NOT_FOUND',
    httpStatus: HttpStatus.NOT_FOUND,
    message: (params: { productId: number }) =>
      `O produto ${params.productId} não está no carrinho.`,
  } as AppErrorDefinition<{ productId: number }>,

  INVALID_QUANTITY: {
    code: 'CART_INVALID_QUANTITY',
    httpStatus: HttpStatus.BAD_REQUEST,
    message: 'A quantidade deve ser maior que zero.',
  } as AppErrorDefinition<never>,

  INSUFFICIENT_STOCK: {
    code: 'CART_INSUFFICIENT_STOCK',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    message: (params: { productId: number; requestedQuantity: number; availableStock: number }) =>
      `Apenas ${params.availableStock} unidade(s) do produto ${params.productId} estão disponíveis em estoque (solicitado: ${params.requestedQuantity}).`,
  } as AppErrorDefinition<{
    productId: number;
    requestedQuantity: number;
    availableStock: number;
  }>,

  ALREADY_FINALIZED: {
    code: 'CART_ALREADY_FINALIZED',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Este carrinho já foi finalizado e não pode mais ser alterado.',
  } as AppErrorDefinition<never>,

  EMPTY_CART_CHECKOUT: {
    code: 'CART_EMPTY_CHECKOUT',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Um carrinho vazio não pode ser finalizado.',
  } as AppErrorDefinition<never>,
} as const;
