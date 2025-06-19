/*
  Warnings:

  - You are about to drop the column `brand_id` on the `wishlists` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `wishlists` table. All the data in the column will be lost.
  - You are about to drop the column `product_price` on the `wishlists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wishlists" DROP COLUMN "brand_id",
DROP COLUMN "category_id",
DROP COLUMN "product_price";
