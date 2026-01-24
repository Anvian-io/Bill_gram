-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "person_name" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "email" TEXT,
    "customer_type" TEXT,
    "city" TEXT,
    "address" TEXT NOT NULL,
    "pincode" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "customers_company_name_idx" ON "customers"("company_name");

-- CreateIndex
CREATE INDEX "customers_person_name_idx" ON "customers"("person_name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_no_key" ON "customers"("phone_no");
