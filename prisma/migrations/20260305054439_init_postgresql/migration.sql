-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('drug', 'service', 'procedure');

-- CreateEnum
CREATE TYPE "DrugStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'credit');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('drug', 'utility', 'general');

-- CreateTable
CREATE TABLE "users" (
    "user_id" CHAR(36) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "patients" (
    "patient_id" CHAR(36) NOT NULL,
    "hospital_number" VARCHAR(50),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "gender" "Gender",
    "birth_date" TIMESTAMP(3),
    "phone" VARCHAR(50),
    "address" VARCHAR(255),
    "allergy" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "visits" (
    "visit_id" CHAR(36) NOT NULL,
    "patient_id" CHAR(36) NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "symptom" TEXT,
    "diagnosis" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "blood_pressure" VARCHAR(20),
    "heart_rate" INTEGER,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "age_years" INTEGER,
    "age_months" INTEGER,
    "age_days" INTEGER,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("visit_id")
);

-- CreateTable
CREATE TABLE "visit_details" (
    "visit_detail_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36) NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "drug_id" CHAR(36),
    "procedure_id" CHAR(36),
    "description" VARCHAR(255),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "visit_details_pkey" PRIMARY KEY ("visit_detail_id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "procedure_id" CHAR(36) NOT NULL,
    "procedure_name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("procedure_id")
);

-- CreateTable
CREATE TABLE "drug_categories" (
    "category_id" CHAR(36) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drug_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "drugs" (
    "drug_id" CHAR(36) NOT NULL,
    "drug_name" VARCHAR(150) NOT NULL,
    "category_id" CHAR(36) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "status" "DrugStatus" NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("drug_id")
);

-- CreateTable
CREATE TABLE "drug_lots" (
    "lot_id" CHAR(36) NOT NULL,
    "drug_id" CHAR(36) NOT NULL,
    "lot_no" VARCHAR(100),
    "received_date" TIMESTAMP(3) NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,
    "qty_received" INTEGER NOT NULL,
    "qty_remaining" INTEGER NOT NULL,
    "buy_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drug_lots_pkey" PRIMARY KEY ("lot_id")
);

-- CreateTable
CREATE TABLE "drug_adjustments" (
    "adjustment_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity_lost" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_adjustments_pkey" PRIMARY KEY ("adjustment_id")
);

-- CreateTable
CREATE TABLE "drug_usages" (
    "usage_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drug_usages_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "income_categories" (
    "category_id" CHAR(36) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "income_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "income_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36),
    "category_id" CHAR(36) NOT NULL,
    "income_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "receipt_no" VARCHAR(100),
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("income_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "expense_id" CHAR(36) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "description" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "receipt_no" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "expense_drug_lots" (
    "id" CHAR(36) NOT NULL,
    "expense_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expense_drug_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hospital_number_key" ON "patients"("hospital_number");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visit_details_drug_id_idx" ON "visit_details"("drug_id");

-- CreateIndex
CREATE INDEX "visit_details_procedure_id_idx" ON "visit_details"("procedure_id");

-- CreateIndex
CREATE INDEX "visit_details_visit_id_idx" ON "visit_details"("visit_id");

-- CreateIndex
CREATE INDEX "drugs_category_id_idx" ON "drugs"("category_id");

-- CreateIndex
CREATE INDEX "drug_lots_drug_id_idx" ON "drug_lots"("drug_id");

-- CreateIndex
CREATE INDEX "drug_adjustments_lot_id_idx" ON "drug_adjustments"("lot_id");

-- CreateIndex
CREATE INDEX "drug_usages_lot_id_idx" ON "drug_usages"("lot_id");

-- CreateIndex
CREATE INDEX "drug_usages_visit_id_idx" ON "drug_usages"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_category_name_key" ON "income_categories"("category_name");

-- CreateIndex
CREATE INDEX "incomes_visit_id_idx" ON "incomes"("visit_id");

-- CreateIndex
CREATE INDEX "incomes_category_id_idx" ON "incomes"("category_id");

-- CreateIndex
CREATE INDEX "expense_drug_lots_lot_id_idx" ON "expense_drug_lots"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_drug_lots_expense_id_lot_id_key" ON "expense_drug_lots"("expense_id", "lot_id");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_details" ADD CONSTRAINT "visit_details_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("drug_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_details" ADD CONSTRAINT "visit_details_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("procedure_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_details" ADD CONSTRAINT "visit_details_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drugs" ADD CONSTRAINT "drugs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "drug_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_lots" ADD CONSTRAINT "drug_lots_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("drug_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_adjustments" ADD CONSTRAINT "drug_adjustments_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "drug_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_usages" ADD CONSTRAINT "drug_usages_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "drug_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_usages" ADD CONSTRAINT "drug_usages_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "income_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_drug_lots" ADD CONSTRAINT "expense_drug_lots_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("expense_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_drug_lots" ADD CONSTRAINT "expense_drug_lots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "drug_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
