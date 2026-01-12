/*
  Warnings:

  - You are about to drop the `clinic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `finance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medicine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medicinepurchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `treatment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `treatmentmedicine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `finance` DROP FOREIGN KEY `Finance_clinic_id_fkey`;

-- DropForeignKey
ALTER TABLE `finance` DROP FOREIGN KEY `Finance_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `Medicine_clinic_id_fkey`;

-- DropForeignKey
ALTER TABLE `medicinepurchase` DROP FOREIGN KEY `MedicinePurchase_medicine_id_fkey`;

-- DropForeignKey
ALTER TABLE `patient` DROP FOREIGN KEY `Patient_clinic_id_fkey`;

-- DropForeignKey
ALTER TABLE `treatment` DROP FOREIGN KEY `Treatment_clinic_id_fkey`;

-- DropForeignKey
ALTER TABLE `treatment` DROP FOREIGN KEY `Treatment_patient_id_fkey`;

-- DropForeignKey
ALTER TABLE `treatment` DROP FOREIGN KEY `Treatment_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `treatmentmedicine` DROP FOREIGN KEY `TreatmentMedicine_medicine_id_fkey`;

-- DropForeignKey
ALTER TABLE `treatmentmedicine` DROP FOREIGN KEY `TreatmentMedicine_treatment_id_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_clinic_id_fkey`;

-- DropTable
DROP TABLE `clinic`;

-- DropTable
DROP TABLE `finance`;

-- DropTable
DROP TABLE `medicine`;

-- DropTable
DROP TABLE `medicinepurchase`;

-- DropTable
DROP TABLE `patient`;

-- DropTable
DROP TABLE `treatment`;

-- DropTable
DROP TABLE `treatmentmedicine`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `user_id` CHAR(36) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `patient_id` CHAR(36) NOT NULL,
    `hospital_number` VARCHAR(50) NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `birth_date` DATETIME(3) NULL,
    `phone` VARCHAR(50) NULL,
    `address` VARCHAR(255) NULL,
    `allergy` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`patient_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visits` (
    `visit_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `visit_date` DATETIME(3) NOT NULL,
    `symptom` TEXT NULL,
    `diagnosis` TEXT NULL,
    `note` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`visit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_details` (
    `visit_detail_id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `item_type` ENUM('drug', 'service') NOT NULL,
    `drug_id` CHAR(36) NULL,
    `description` VARCHAR(255) NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`visit_detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drug_categories` (
    `category_id` CHAR(36) NOT NULL,
    `category_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drugs` (
    `drug_id` CHAR(36) NOT NULL,
    `drug_name` VARCHAR(150) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `sell_price` DECIMAL(10, 2) NOT NULL,
    `min_stock` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`drug_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drug_lots` (
    `lot_id` CHAR(36) NOT NULL,
    `drug_id` CHAR(36) NOT NULL,
    `lot_no` VARCHAR(100) NULL,
    `received_date` DATETIME(3) NOT NULL,
    `expire_date` DATETIME(3) NOT NULL,
    `qty_received` INTEGER NOT NULL,
    `qty_remaining` INTEGER NOT NULL,
    `buy_price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`lot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drug_usages` (
    `usage_id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `lot_id` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `used_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incomes` (
    `income_id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `income_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('cash', 'transfer', 'credit') NOT NULL,
    `receipt_no` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`income_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `expense_id` CHAR(36) NOT NULL,
    `expense_date` DATETIME(3) NOT NULL,
    `expense_type` ENUM('drug', 'utility', 'general') NOT NULL,
    `description` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `receipt_no` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`expense_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_drug_lots` (
    `id` CHAR(36) NOT NULL,
    `expense_id` CHAR(36) NOT NULL,
    `lot_id` CHAR(36) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `expense_drug_lots_expense_id_lot_id_key`(`expense_id`, `lot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_details` ADD CONSTRAINT `visit_details_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`visit_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_details` ADD CONSTRAINT `visit_details_drug_id_fkey` FOREIGN KEY (`drug_id`) REFERENCES `drugs`(`drug_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drugs` ADD CONSTRAINT `drugs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `drug_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drug_lots` ADD CONSTRAINT `drug_lots_drug_id_fkey` FOREIGN KEY (`drug_id`) REFERENCES `drugs`(`drug_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drug_usages` ADD CONSTRAINT `drug_usages_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`visit_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drug_usages` ADD CONSTRAINT `drug_usages_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `drug_lots`(`lot_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`visit_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_drug_lots` ADD CONSTRAINT `expense_drug_lots_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`expense_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_drug_lots` ADD CONSTRAINT `expense_drug_lots_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `drug_lots`(`lot_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
