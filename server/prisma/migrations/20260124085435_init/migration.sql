/*
  Warnings:

  - Made the column `address` on table `product_companies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactPerson` on table `product_companies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `product_companies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `product_companies` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_companies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_product_companies" ("address", "contactPerson", "created_at", "deleted", "email", "id", "name", "phone", "status", "updated_at", "website") SELECT "address", "contactPerson", "created_at", "deleted", "email", "id", "name", "phone", "status", "updated_at", "website" FROM "product_companies";
DROP TABLE "product_companies";
ALTER TABLE "new_product_companies" RENAME TO "product_companies";
CREATE UNIQUE INDEX "product_companies_name_key" ON "product_companies"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
