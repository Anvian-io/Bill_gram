/*
  Warnings:

  - You are about to drop the column `batch_no` on the `batches` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchNo" TEXT,
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
INSERT INTO "new_batches" ("barcode", "basic_price", "created_at", "exp_date", "gst_amount", "id", "margin", "mfg_date", "mrp", "opening_stock", "productId", "purchase_rate", "sale_rate", "updated_at") SELECT "barcode", "basic_price", "created_at", "exp_date", "gst_amount", "id", "margin", "mfg_date", "mrp", "opening_stock", "productId", "purchase_rate", "sale_rate", "updated_at" FROM "batches";
DROP TABLE "batches";
ALTER TABLE "new_batches" RENAME TO "batches";
CREATE INDEX "batches_productId_idx" ON "batches"("productId");
CREATE INDEX "batches_batchNo_idx" ON "batches"("batchNo");
CREATE INDEX "batches_barcode_idx" ON "batches"("barcode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
