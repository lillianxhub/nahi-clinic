/*
  Warnings:

  - Added the required column `income_type` to the `incomes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('service', 'supply', 'drug', 'other');

-- DropForeignKey
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_visit_id_fkey";

-- AlterTable
ALTER TABLE "incomes" ADD COLUMN     "income_type" "IncomeType" NOT NULL,
ALTER COLUMN "visit_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE SET NULL ON UPDATE CASCADE;
