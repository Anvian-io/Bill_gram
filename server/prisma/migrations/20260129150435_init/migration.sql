/*
  Warnings:

  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `basic_price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `batch_number` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `exp_date` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_tax` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `margin` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `mfg_date` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `mrp` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `opening_stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `purchase_rate` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sale_rate` on the `products` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batch_no" TEXT NOT NULL,
    "mfg_date" TEXT,
    "exp_date" TEXT,
    "barcode" TEXT NOT NULL,
    "basic_price" REAL NOT NULL,
    "opening_stock" INTEGER NOT NULL DEFAULT 0,
    "mrp" REAL NOT NULL,
    "purchase_rate" REAL NOT NULL,
    "sale_rate" REAL NOT NULL,
    "margin" REAL NOT NULL,
    "gst_amount" REAL DEFAULT 0,
    "productId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_url" TEXT NOT NULL,
    "image_type" TEXT DEFAULT 'related',
    "sort_order" INTEGER DEFAULT 0,
    "productId" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_code" TEXT NOT NULL,
    "product_brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsn_sac_code" TEXT NOT NULL,
    "goods_services" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "product_group" TEXT NOT NULL,
    "product_short_name" TEXT,
    "purchase_unit" TEXT,
    "conversion_factor" REAL DEFAULT 1,
    "price_per_pcs" REAL,
    "product_company" TEXT,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("carton_pack", "conversion_factor", "created_at", "description", "goods_services", "hsn_sac_code", "id", "inner_pack", "price_per_pcs", "product_brand", "product_code", "product_company", "product_group", "product_short_name", "purchase_unit", "sale_unit", "unit", "updated_at", "userId", "weight") SELECT "carton_pack", "conversion_factor", "created_at", "description", "goods_services", "hsn_sac_code", "id", "inner_pack", "price_per_pcs", "product_brand", "product_code", "product_company", "product_group", "product_short_name", "purchase_unit", "sale_unit", "unit", "updated_at", "userId", "weight" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");
CREATE INDEX "products_userId_idx" ON "products"("userId");
CREATE INDEX "products_product_code_idx" ON "products"("product_code");
CREATE INDEX "products_product_brand_idx" ON "products"("product_brand");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_no_key" ON "batches"("batch_no");

-- CreateIndex
CREATE INDEX "batches_productId_idx" ON "batches"("productId");

-- CreateIndex
CREATE INDEX "batches_batch_no_idx" ON "batches"("batch_no");

-- CreateIndex
CREATE INDEX "batches_barcode_idx" ON "batches"("barcode");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");
