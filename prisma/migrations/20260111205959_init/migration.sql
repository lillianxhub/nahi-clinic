-- CreateTable
CREATE TABLE `Clinic` (
    `clinic_id` INTEGER NOT NULL AUTO_INCREMENT,
    `clinic_name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `open_time` VARCHAR(191) NOT NULL,
    `close_time` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`clinic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `fullname` VARCHAR(191) NOT NULL,
    `clinic_id` INTEGER NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `patient_id` INTEGER NOT NULL AUTO_INCREMENT,
    `national_id` VARCHAR(191) NOT NULL,
    `firstname` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `birthdate` DATETIME(3) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `clinic_id` INTEGER NOT NULL,

    UNIQUE INDEX `Patient_national_id_key`(`national_id`),
    PRIMARY KEY (`patient_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Treatment` (
    `treatment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `treatment_date` DATETIME(3) NOT NULL,
    `symptom` TEXT NOT NULL,
    `diagnosis` TEXT NOT NULL,
    `total_cost` DECIMAL(10, 2) NOT NULL,
    `clinic_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`treatment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicine` (
    `medicine_id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicine_name` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `expire_date` DATETIME(3) NOT NULL,
    `clinic_id` INTEGER NOT NULL,

    PRIMARY KEY (`medicine_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreatmentMedicine` (
    `tm_id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `medicine_id` INTEGER NOT NULL,
    `treatment_id` INTEGER NOT NULL,

    PRIMARY KEY (`tm_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicinePurchase` (
    `purchase_id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` INTEGER NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `purchase_date` DATETIME(3) NOT NULL,
    `medicine_id` INTEGER NOT NULL,

    PRIMARY KEY (`purchase_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Finance` (
    `finance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `clinic_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`finance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
