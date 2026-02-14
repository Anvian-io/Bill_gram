/*
  Warnings:

  - You are about to drop the column `product_company` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `product_group` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `products` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_product_group" ("created_at", "deleted", "description", "id", "name", "status", "updated_at") SELECT "created_at", "deleted", "description", "id", "name", "status", "updated_at" FROM "product_group";
DROP TABLE "product_group";
ALTER TABLE "new_product_group" RENAME TO "product_group";
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_code" TEXT NOT NULL,
    "product_brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsn_sac_code" TEXT NOT NULL,
    "goods_services" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "unit_id" INTEGER,
    "product_group_id" INTEGER,
    "product_short_name" TEXT,
    "purchase_unit" TEXT,
    "conversion_factor" REAL DEFAULT 1,
    "price_per_pcs" REAL,
    "product_company_id" INTEGER,
    "sale_unit" TEXT,
    "carton_pack" INTEGER DEFAULT 1,
    "inner_pack" TEXT,
    "packaging_basic" BOOLEAN NOT NULL DEFAULT false,
    "packaging_mrp" BOOLEAN NOT NULL DEFAULT false,
    "insurance_tax_basic" BOOLEAN NOT NULL DEFAULT false,
    "insurance_tax_mrp" BOOLEAN NOT NULL DEFAULT false,
    "gst_rate" REAL DEFAULT 18,
    "gst_inclusive" BOOLEAN NOT NULL DEFAULT true,
    "cess_rate" REAL DEFAULT 0,
    "hsn_chapter" TEXT,
    "gst_applicability" TEXT DEFAULT 'Regular',
    "main_image" TEXT,
    "userId" INTEGER,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "product_group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_product_company_id_fkey" FOREIGN KEY ("product_company_id") REFERENCES "product_companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("carton_pack", "cess_rate", "conversion_factor", "created_at", "description", "goods_services", "gst_applicability", "gst_inclusive", "gst_rate", "hsn_chapter", "hsn_sac_code", "id", "inner_pack", "insurance_tax_basic", "insurance_tax_mrp", "main_image", "packaging_basic", "packaging_mrp", "price_per_pcs", "product_brand", "product_code", "product_short_name", "purchase_unit", "sale_unit", "updated_at", "userId", "weight") SELECT "carton_pack", "cess_rate", "conversion_factor", "created_at", "description", "goods_services", "gst_applicability", "gst_inclusive", "gst_rate", "hsn_chapter", "hsn_sac_code", "id", "inner_pack", "insurance_tax_basic", "insurance_tax_mrp", "main_image", "packaging_basic", "packaging_mrp", "price_per_pcs", "product_brand", "product_code", "product_short_name", "purchase_unit", "sale_unit", "updated_at", "userId", "weight" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");
CREATE INDEX "products_userId_idx" ON "products"("userId");
CREATE INDEX "products_product_code_idx" ON "products"("product_code");
CREATE INDEX "products_product_brand_idx" ON "products"("product_brand");
CREATE INDEX "products_unit_id_idx" ON "products"("unit_id");
CREATE INDEX "products_product_group_id_idx" ON "products"("product_group_id");
CREATE INDEX "products_product_company_id_idx" ON "products"("product_company_id");
CREATE TABLE "new_units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_units" ("created_at", "deleted", "id", "name", "status", "symbol", "updated_at") SELECT "created_at", "deleted", "id", "name", "status", "symbol", "updated_at" FROM "units";
DROP TABLE "units";
ALTER TABLE "new_units" RENAME TO "units";
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
CREATE UNIQUE INDEX "units_symbol_key" ON "units"("symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
