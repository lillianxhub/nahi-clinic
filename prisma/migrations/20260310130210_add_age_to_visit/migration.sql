/*
  Warnings:

  - The values [other] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `is_active` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the `drug_adjustments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drug_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drug_lots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drug_usages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drugs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expense_drug_lots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `income_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `procedures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visit_details` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[visit_id]` on the table `incomes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[citizen_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Made the column `visit_id` on table `incomes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `patients` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('drug', 'supply', 'service');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('draft', 'completed', 'cancelled');

-- AlterEnum
ALTER TYPE "ExpenseType" ADD VALUE 'equipment_supply';

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('male', 'female');
ALTER TABLE "patients" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "drug_adjustments" DROP CONSTRAINT "drug_adjustments_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "drug_lots" DROP CONSTRAINT "drug_lots_drug_id_fkey";

-- DropForeignKey
ALTER TABLE "drug_usages" DROP CONSTRAINT "drug_usages_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "drug_usages" DROP CONSTRAINT "drug_usages_visit_id_fkey";

-- DropForeignKey
ALTER TABLE "drugs" DROP CONSTRAINT "drugs_category_id_fkey";

-- DropForeignKey
ALTER TABLE "expense_drug_lots" DROP CONSTRAINT "expense_drug_lots_expense_id_fkey";

-- DropForeignKey
ALTER TABLE "expense_drug_lots" DROP CONSTRAINT "expense_drug_lots_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_category_id_fkey";

-- DropForeignKey
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_visit_id_fkey";

-- DropForeignKey
ALTER TABLE "visit_details" DROP CONSTRAINT "visit_details_drug_id_fkey";

-- DropForeignKey
ALTER TABLE "visit_details" DROP CONSTRAINT "visit_details_procedure_id_fkey";

-- DropForeignKey
ALTER TABLE "visit_details" DROP CONSTRAINT "visit_details_visit_id_fkey";

-- DropIndex
DROP INDEX "incomes_category_id_idx";

-- DropIndex
DROP INDEX "incomes_visit_id_idx";

-- DropIndex
DROP INDEX "visits_patient_id_idx";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "incomes" DROP COLUMN "category_id",
DROP COLUMN "description",
DROP COLUMN "is_active",
ALTER COLUMN "visit_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "citizen_number" VARCHAR(50),
ADD COLUMN     "occupation" VARCHAR(100),
ADD COLUMN     "prefix" VARCHAR(50),
ALTER COLUMN "gender" SET NOT NULL;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "drinking_history" VARCHAR(100),
ADD COLUMN     "smoking_history" VARCHAR(100),
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "temperature" DECIMAL(4,2),
ADD COLUMN     "waistline" DECIMAL(5,2);

-- DropTable
DROP TABLE "drug_adjustments";

-- DropTable
DROP TABLE "drug_categories";

-- DropTable
DROP TABLE "drug_lots";

-- DropTable
DROP TABLE "drug_usages";

-- DropTable
DROP TABLE "drugs";

-- DropTable
DROP TABLE "expense_drug_lots";

-- DropTable
DROP TABLE "income_categories";

-- DropTable
DROP TABLE "procedures";

-- DropTable
DROP TABLE "visit_details";

-- DropEnum
DROP TYPE "DrugStatus";

-- DropEnum
DROP TYPE "ItemType";

-- CreateTable
CREATE TABLE "visit_items" (
    "visit_item_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "visit_items_pkey" PRIMARY KEY ("visit_item_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" CHAR(36) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" CHAR(36) NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "category_id" CHAR(36) NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "lot_id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,
    "lot_no" VARCHAR(100),
    "buy_unit" VARCHAR(50) NOT NULL,
    "conversion_factor" INTEGER NOT NULL DEFAULT 1,
    "buy_price" DECIMAL(10,2) NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,
    "qty_received" INTEGER NOT NULL,
    "qty_remaining" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("lot_id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "adjustment_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity_lost" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("adjustment_id")
);

-- CreateTable
CREATE TABLE "stock_usages" (
    "usage_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_usages_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "expense_inventory_lots" (
    "id" CHAR(36) NOT NULL,
    "expense_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expense_inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incomes_visit_id_key" ON "incomes"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_citizen_number_key" ON "patients"("citizen_number");

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_usages" ADD CONSTRAINT "stock_usages_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_usages" ADD CONSTRAINT "stock_usages_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_inventory_lots" ADD CONSTRAINT "expense_inventory_lots_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("expense_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_inventory_lots" ADD CONSTRAINT "expense_inventory_lots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
