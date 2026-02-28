/*
  Warnings:

  - A unique constraint covering the columns `[citizen_number,hospital_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `patients_citizen_number_key` ON `patients`;

-- DropIndex
DROP INDEX `patients_hospital_number_key` ON `patients`;

-- CreateTable
CREATE TABLE `drug_adjustments` (
    `adjustment_id` CHAR(36) NOT NULL,
    `lot_id` CHAR(36) NOT NULL,
    `quantity_lost` INTEGER NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `drug_adjustments_lot_id_fkey`(`lot_id`),
    PRIMARY KEY (`adjustment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `patients_citizen_number_hospital_number_key` ON `patients`(`citizen_number`, `hospital_number`);

-- AddForeignKey
ALTER TABLE `drug_adjustments` ADD CONSTRAINT `drug_adjustments_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `drug_lots`(`lot_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
