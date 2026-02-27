/*
  Warnings:

  - A unique constraint covering the columns `[hospital_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[citizen_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `patients_hospital_number_key` ON `patients`(`hospital_number`);

-- CreateIndex
CREATE UNIQUE INDEX `patients_citizen_number_key` ON `patients`(`citizen_number`);
