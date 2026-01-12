/*
  Warnings:

  - The primary key for the `clinic` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `open_time` on the `clinic` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to alter the column `close_time` on the `clinic` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - The primary key for the `finance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `medicine` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `medicinepurchase` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `patient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `treatment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `treatmentmedicine` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.

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

-- DropIndex
DROP INDEX `Finance_clinic_id_fkey` ON `finance`;

-- DropIndex
DROP INDEX `Finance_user_id_fkey` ON `finance`;

-- DropIndex
DROP INDEX `Medicine_clinic_id_fkey` ON `medicine`;

-- DropIndex
DROP INDEX `MedicinePurchase_medicine_id_fkey` ON `medicinepurchase`;

-- DropIndex
DROP INDEX `Patient_clinic_id_fkey` ON `patient`;

-- DropIndex
DROP INDEX `Treatment_clinic_id_fkey` ON `treatment`;

-- DropIndex
DROP INDEX `Treatment_patient_id_fkey` ON `treatment`;

-- DropIndex
DROP INDEX `Treatment_user_id_fkey` ON `treatment`;

-- DropIndex
DROP INDEX `TreatmentMedicine_medicine_id_fkey` ON `treatmentmedicine`;

-- DropIndex
DROP INDEX `TreatmentMedicine_treatment_id_fkey` ON `treatmentmedicine`;

-- DropIndex
DROP INDEX `User_clinic_id_fkey` ON `user`;

-- AlterTable
ALTER TABLE `clinic` DROP PRIMARY KEY,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    MODIFY `open_time` DATETIME(3) NOT NULL,
    MODIFY `close_time` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`clinic_id`);

-- AlterTable
ALTER TABLE `finance` DROP PRIMARY KEY,
    MODIFY `finance_id` VARCHAR(191) NOT NULL,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`finance_id`);

-- AlterTable
ALTER TABLE `medicine` DROP PRIMARY KEY,
    MODIFY `medicine_id` VARCHAR(191) NOT NULL,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`medicine_id`);

-- AlterTable
ALTER TABLE `medicinepurchase` DROP PRIMARY KEY,
    MODIFY `purchase_id` VARCHAR(191) NOT NULL,
    MODIFY `medicine_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`purchase_id`);

-- AlterTable
ALTER TABLE `patient` DROP PRIMARY KEY,
    MODIFY `patient_id` VARCHAR(191) NOT NULL,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`patient_id`);

-- AlterTable
ALTER TABLE `treatment` DROP PRIMARY KEY,
    MODIFY `treatment_id` VARCHAR(191) NOT NULL,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    MODIFY `patient_id` VARCHAR(191) NOT NULL,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`treatment_id`);

-- AlterTable
ALTER TABLE `treatmentmedicine` DROP PRIMARY KEY,
    MODIFY `tm_id` VARCHAR(191) NOT NULL,
    MODIFY `medicine_id` VARCHAR(191) NOT NULL,
    MODIFY `treatment_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`tm_id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    ADD COLUMN `email` VARCHAR(191) NULL,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    MODIFY `clinic_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`user_id`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic`(`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic`(`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic`(`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicine` ADD CONSTRAINT `Medicine_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic`(`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentMedicine` ADD CONSTRAINT `TreatmentMedicine_medicine_id_fkey` FOREIGN KEY (`medicine_id`) REFERENCES `Medicine`(`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentMedicine` ADD CONSTRAINT `TreatmentMedicine_treatment_id_fkey` FOREIGN KEY (`treatment_id`) REFERENCES `Treatment`(`treatment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicinePurchase` ADD CONSTRAINT `MedicinePurchase_medicine_id_fkey` FOREIGN KEY (`medicine_id`) REFERENCES `Medicine`(`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Finance` ADD CONSTRAINT `Finance_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `Clinic`(`clinic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Finance` ADD CONSTRAINT `Finance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
