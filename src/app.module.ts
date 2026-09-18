import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [AppConfigModule, PrismaModule, ProductsModule, CouponsModule, CartModule],
  controllers: [AppController],
})
export class AppModule {}
