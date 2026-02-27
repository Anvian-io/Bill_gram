/*
  Warnings:

  - You are about to drop the column `area` on the `salesmen` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "person_name" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "email" TEXT,
    "customer_type" TEXT,
    "city" TEXT,
    "area_id" INTEGER,
    "address" TEXT NOT NULL,
    "pincode" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customers_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("address", "city", "company_name", "created_at", "customer_type", "deleted", "email", "id", "person_name", "phone_no", "pincode", "status", "updated_at") SELECT "address", "city", "company_name", "created_at", "customer_type", "deleted", "email", "id", "person_name", "phone_no", "pincode", "status", "updated_at" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE INDEX "customers_company_name_idx" ON "customers"("company_name");
CREATE INDEX "customers_person_name_idx" ON "customers"("person_name");
CREATE INDEX "customers_area_id_idx" ON "customers"("area_id");
CREATE UNIQUE INDEX "customers_phone_no_key" ON "customers"("phone_no");
CREATE TABLE "new_salesmen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "email" TEXT,
    "area_id" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "salesmen_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_salesmen" ("created_at", "deleted", "deleted_at", "email", "id", "name", "phoneNo", "status") SELECT "created_at", "deleted", "deleted_at", "email", "id", "name", "phoneNo", "status" FROM "salesmen";
DROP TABLE "salesmen";
ALTER TABLE "new_salesmen" RENAME TO "salesmen";
CREATE INDEX "salesmen_area_id_idx" ON "salesmen"("area_id");
CREATE UNIQUE INDEX "salesmen_phoneNo_key" ON "salesmen"("phoneNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
