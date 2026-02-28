-- AlterTable
ALTER TABLE `visits` ADD COLUMN `age_days` INTEGER NULL,
    ADD COLUMN `age_months` INTEGER NULL,
    ADD COLUMN `age_years` INTEGER NULL,
    ADD COLUMN `blood_pressure` VARCHAR(20) NULL,
    ADD COLUMN `heart_rate` INTEGER NULL,
    ADD COLUMN `height` DECIMAL(5, 2) NULL,
    ADD COLUMN `weight` DECIMAL(5, 2) NULL;
