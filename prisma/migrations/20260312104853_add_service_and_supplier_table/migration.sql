/*
  Warnings:

  - Added the required column `supplier_id` to the `inventory_lots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_id` to the `visit_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('none', 'current', 'ex', 'occasional');

-- CreateEnum
CREATE TYPE "DrinkingStatus" AS ENUM ('none', 'social', 'regular', 'heavy', 'ex');

-- AlterTable
ALTER TABLE "inventory_lots" ADD COLUMN     "supplier_id" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "visit_items" ADD COLUMN     "service_id" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "drinking_status" "DrinkingStatus" DEFAULT 'none',
ADD COLUMN     "smoking_status" "SmokingStatus" DEFAULT 'none';

-- CreateTable
CREATE TABLE "services" (
    "service_id" CHAR(36) NOT NULL,
    "service_name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3),
    "delete_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" CHAR(36) NOT NULL,
    "supplier_name" VARCHAR(150) NOT NULL,
    "contract" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3),
    "delete_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;
