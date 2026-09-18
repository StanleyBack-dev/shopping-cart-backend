-- CreateEnum
CREATE TYPE "cart_status" AS ENUM ('OPEN', 'FINALIZED');

-- CreateTable
CREATE TABLE "tb_products" (
    "idtb_products" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "netUnitPrice" DECIMAL(10,2) NOT NULL,
    "stockQuantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_products_pkey" PRIMARY KEY ("idtb_products")
);

-- CreateTable
CREATE TABLE "tb_coupons" (
    "idtb_coupons" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "discount_percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_coupons_pkey" PRIMARY KEY ("idtb_coupons")
);

-- CreateTable
CREATE TABLE "tb_carts" (
    "idtb_carts" TEXT NOT NULL,
    "status" "cart_status" NOT NULL DEFAULT 'OPEN',
    "idtb_coupons" INTEGER,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_carts_pkey" PRIMARY KEY ("idtb_carts")
);

-- CreateTable
CREATE TABLE "tb_cart_items" (
    "idtb_cart_items" TEXT NOT NULL,
    "idtb_carts" TEXT NOT NULL,
    "idtb_products" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_cart_items_pkey" PRIMARY KEY ("idtb_cart_items")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_coupons_code_key" ON "tb_coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tb_cart_items_idtb_carts_idtb_products_key" ON "tb_cart_items"("idtb_carts", "idtb_products");

-- AddForeignKey
ALTER TABLE "tb_carts" ADD CONSTRAINT "tb_carts_idtb_coupons_fkey" FOREIGN KEY ("idtb_coupons") REFERENCES "tb_coupons"("idtb_coupons") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_cart_items" ADD CONSTRAINT "tb_cart_items_idtb_carts_fkey" FOREIGN KEY ("idtb_carts") REFERENCES "tb_carts"("idtb_carts") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_cart_items" ADD CONSTRAINT "tb_cart_items_idtb_products_fkey" FOREIGN KEY ("idtb_products") REFERENCES "tb_products"("idtb_products") ON DELETE RESTRICT ON UPDATE CASCADE;
