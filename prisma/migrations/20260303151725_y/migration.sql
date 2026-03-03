/*
  Warnings:

  - You are about to drop the column `income_category` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the column `citizen_number` on the `patients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hospital_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_id` to the `incomes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `incomes` DROP FOREIGN KEY `incomes_visit_id_fkey`;

-- DropIndex
DROP INDEX `patients_citizen_number_hospital_number_key` ON `patients`;

-- AlterTable
ALTER TABLE `incomes` DROP COLUMN `income_category`,
    ADD COLUMN `category_id` CHAR(36) NOT NULL,
    MODIFY `visit_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `patients` DROP COLUMN `citizen_number`;

-- AlterTable
ALTER TABLE `visit_details` ADD COLUMN `procedure_id` CHAR(36) NULL,
    MODIFY `item_type` ENUM('drug', 'service', 'procedure') NOT NULL;

-- CreateTable
CREATE TABLE `procedures` (
    `procedure_id` CHAR(36) NOT NULL,
    `procedure_name` VARCHAR(150) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`procedure_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `income_categories` (
    `category_id` CHAR(36) NOT NULL,
    `category_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `income_categories_category_name_key`(`category_name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `incomes_category_id_fkey` ON `incomes`(`category_id`);

-- CreateIndex
CREATE UNIQUE INDEX `patients_hospital_number_key` ON `patients`(`hospital_number`);

-- CreateIndex
CREATE INDEX `visit_details_procedure_id_fkey` ON `visit_details`(`procedure_id`);

-- AddForeignKey
ALTER TABLE `visit_details` ADD CONSTRAINT `visit_details_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`visit_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `income_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
