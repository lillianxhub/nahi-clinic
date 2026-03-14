-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('drug', 'supply');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'credit');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('drug', 'supply', 'utility', 'general');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('service', 'supply', 'drug', 'other');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('draft', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('none', 'current', 'ex', 'occasional');

-- CreateEnum
CREATE TYPE "DrinkingStatus" AS ENUM ('none', 'social', 'regular', 'heavy', 'ex');

-- CreateEnum
CREATE TYPE "VisitItemType" AS ENUM ('product', 'service');

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
    "citizen_number" CHAR(13),
    "prefix" VARCHAR(50),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "gender" "Gender" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "phone" VARCHAR(50),
    "address" VARCHAR(255),
    "occupation" VARCHAR(100),
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
    "status" "VisitStatus" NOT NULL DEFAULT 'draft',
    "symptom" TEXT,
    "diagnosis" TEXT,
    "note" TEXT,
    "temperature" DECIMAL(4,2),
    "blood_pressure" VARCHAR(20),
    "heart_rate" INTEGER,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "waistline" DECIMAL(5,2),
    "smoking_status" "SmokingStatus" DEFAULT 'none',
    "drinking_status" "DrinkingStatus" DEFAULT 'none',
    "smoking_history" VARCHAR(100),
    "drinking_history" VARCHAR(100),
    "age_years" INTEGER,
    "age_months" INTEGER,
    "age_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("visit_id")
);

-- CreateTable
CREATE TABLE "visit_items" (
    "visit_item_id" CHAR(36) NOT NULL,
    "visit_id" CHAR(36) NOT NULL,
    "item_type" "VisitItemType" NOT NULL,
    "service_id" CHAR(36),
    "product_id" CHAR(36),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "visit_items_pkey" PRIMARY KEY ("visit_item_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" CHAR(36) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "product_type" "ProductType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" CHAR(36) NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "category_id" CHAR(36) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "services" (
    "service_id" CHAR(36) NOT NULL,
    "service_name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" CHAR(36) NOT NULL,
    "supplier_name" VARCHAR(150) NOT NULL,
    "contact" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "lot_id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,
    "supplier_id" CHAR(36) NOT NULL,
    "lot_no" VARCHAR(100),
    "buy_unit" VARCHAR(50) NOT NULL,
    "conversion_factor" INTEGER NOT NULL DEFAULT 1,
    "buy_price" DECIMAL(10,2) NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,
    "qty_received" INTEGER NOT NULL,
    "qty_remaining" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("lot_id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "adjustment_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity_lost" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("adjustment_id")
);

-- CreateTable
CREATE TABLE "stock_usages" (
    "usage_id" CHAR(36) NOT NULL,
    "visit_item_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_usages_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "income_id" CHAR(36) NOT NULL,
    "income_type" "IncomeType" NOT NULL,
    "visit_item_id" CHAR(36) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "receipt_no" VARCHAR(100),
    "income_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("income_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "expense_id" CHAR(36) NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(255),
    "receipt_no" VARCHAR(100),
    "expense_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "expense_inventory_lots" (
    "id" CHAR(36) NOT NULL,
    "expense_id" CHAR(36) NOT NULL,
    "lot_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expense_inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hospital_number_key" ON "patients"("hospital_number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_citizen_number_key" ON "patients"("citizen_number");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

-- CreateIndex
CREATE INDEX "inventory_lots_product_id_idx" ON "inventory_lots"("product_id");

-- CreateIndex
CREATE INDEX "inventory_lots_expire_date_idx" ON "inventory_lots"("expire_date");

-- CreateIndex
CREATE UNIQUE INDEX "incomes_visit_item_id_key" ON "incomes"("visit_item_id");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("visit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_items" ADD CONSTRAINT "visit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_usages" ADD CONSTRAINT "stock_usages_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_usages" ADD CONSTRAINT "stock_usages_visit_item_id_fkey" FOREIGN KEY ("visit_item_id") REFERENCES "visit_items"("visit_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_visit_item_id_fkey" FOREIGN KEY ("visit_item_id") REFERENCES "visit_items"("visit_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_inventory_lots" ADD CONSTRAINT "expense_inventory_lots_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("expense_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_inventory_lots" ADD CONSTRAINT "expense_inventory_lots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
