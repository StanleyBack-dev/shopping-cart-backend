import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { AddItemToCartUseCase } from '../../../application/use-cases/add-item-to-cart.use-case';
import { ApplyCouponToCartUseCase } from '../../../application/use-cases/apply-coupon-to-cart.use-case';
import { CheckoutCartUseCase } from '../../../application/use-cases/checkout-cart.use-case';
import { CreateCartUseCase } from '../../../application/use-cases/create-cart.use-case';
import { GetCartUseCase } from '../../../application/use-cases/get-cart.use-case';
import { RemoveCouponFromCartUseCase } from '../../../application/use-cases/remove-coupon-from-cart.use-case';
import { RemoveItemFromCartUseCase } from '../../../application/use-cases/remove-item-from-cart.use-case';
import { UpdateItemQuantityUseCase } from '../../../application/use-cases/update-item-quantity.use-case';
import { AddItemDto } from '../dtos/add-item.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';
import { CartResponseDto } from '../dtos/cart-response.dto';
import { UpdateItemQuantityDto } from '../dtos/update-item-quantity.dto';

@ApiTags('cart')
@Controller({ path: 'carts', version: '1' })
export class CartController {
  constructor(
    private readonly createCartUseCase: CreateCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly updateItemQuantityUseCase: UpdateItemQuantityUseCase,
    private readonly removeItemFromCartUseCase: RemoveItemFromCartUseCase,
    private readonly applyCouponToCartUseCase: ApplyCouponToCartUseCase,
    private readonly removeCouponFromCartUseCase: RemoveCouponFromCartUseCase,
    private readonly checkoutCartUseCase: CheckoutCartUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: CartResponseDto, description: 'Create a new, empty, open cart.' })
  async create(): Promise<CartResponseDto> {
    const cart = await this.createCartUseCase.execute();
    return CartResponseDto.fromDomain(cart);
  }

  @Get(':id')
  @ApiOkResponse({ type: CartResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CartResponseDto> {
    const cart = await this.getCartUseCase.execute(id);
    return CartResponseDto.fromDomain(cart);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Add a product to the cart, or increase its quantity.',
  })
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.addItemToCartUseCase.execute(id, dto.productId, dto.quantity);
    return CartResponseDto.fromDomain(cart);
  }

  @Patch(':id/items/:productId')
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Set the exact quantity of an existing item.',
  })
  async updateItemQuantity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateItemQuantityDto,
  ): Promise<CartResponseDto> {
    const cart = await this.updateItemQuantityUseCase.execute(id, productId, dto.quantity);
    return CartResponseDto.fromDomain(cart);
  }

  @Delete(':id/items/:productId')
  @ApiOkResponse({ type: CartResponseDto, description: 'Remove a product from the cart.' })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<CartResponseDto> {
    const cart = await this.removeItemFromCartUseCase.execute(id, productId);
    return CartResponseDto.fromDomain(cart);
  }

  @Post(':id/coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Apply a coupon, replacing any previously applied one.',
  })
  async applyCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyCouponDto,
  ): Promise<CartResponseDto> {
    const cart = await this.applyCouponToCartUseCase.execute(id, dto.code);
    return CartResponseDto.fromDomain(cart);
  }

  @Delete(':id/coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Remove the coupon currently applied to the cart.',
  })
  async removeCoupon(@Param('id', ParseUUIDPipe) id: string): Promise<CartResponseDto> {
    const cart = await this.removeCouponFromCartUseCase.execute(id);
    return CartResponseDto.fromDomain(cart);
  }

  @Post(':id/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Finalize the cart. It can no longer be changed afterwards.',
  })
  async checkout(@Param('id', ParseUUIDPipe) id: string): Promise<CartResponseDto> {
    const cart = await this.checkoutCartUseCase.execute(id);
    return CartResponseDto.fromDomain(cart);
  }
}
