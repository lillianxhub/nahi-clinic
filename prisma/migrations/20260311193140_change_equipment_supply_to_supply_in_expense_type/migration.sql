/*
  Warnings:

  - The values [equipment_supply] on the enum `ExpenseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseType_new" AS ENUM ('drug', 'supply', 'utility', 'general');
ALTER TABLE "expenses" ALTER COLUMN "expense_type" TYPE "ExpenseType_new" USING ("expense_type"::text::"ExpenseType_new");
ALTER TYPE "ExpenseType" RENAME TO "ExpenseType_old";
ALTER TYPE "ExpenseType_new" RENAME TO "ExpenseType";
DROP TYPE "public"."ExpenseType_old";
COMMIT;
