-- AlterTable
ALTER TABLE "stock_adjustments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);
