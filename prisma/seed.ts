import { PrismaClient } from '@prisma/client';

import coupons from './data/coupons.json';
import products from './data/products.json';

const prisma = new PrismaClient();

async function seedProducts(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        description: product.description,
        netUnitPrice: product.netUnitPrice,
        stockQuantity: product.stockQuantity,
      },
      create: product,
    });
  }
}

async function seedCoupons(): Promise<void> {
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { id: coupon.id },
      update: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      },
      create: coupon,
    });
  }
}

async function main(): Promise<void> {
  await seedProducts();
  await seedCoupons();
}

main()
  .then(() => {
    console.log('Seed completed successfully.');
    return prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed.', error);
    await prisma.$disconnect();
    process.exit(1);
  });
