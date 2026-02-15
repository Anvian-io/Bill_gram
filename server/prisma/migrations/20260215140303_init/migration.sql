/*
  Warnings:

  - You are about to drop the column `sch1Amount` on the `purchase_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch1Percent` on the `purchase_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch2Amount` on the `purchase_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch2Percent` on the `purchase_invoice_items` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_purchase_invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseInvoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "rate" REAL NOT NULL,
    "aQty" INTEGER NOT NULL,
    "mQty" INTEGER,
    "totalAmount" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "fQty" INTEGER DEFAULT 0,
    "schPercent" REAL DEFAULT 0,
    "schAmount" REAL DEFAULT 0,
    "finalAmount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchase_invoice_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_purchase_invoice_items" ("aQty", "batchId", "created_at", "id", "mQty", "productId", "purchaseInvoiceId", "rate", "taxAmount", "taxRate", "totalAmount", "updated_at") SELECT "aQty", "batchId", "created_at", "id", "mQty", "productId", "purchaseInvoiceId", "rate", "taxAmount", "taxRate", "totalAmount", "updated_at" FROM "purchase_invoice_items";
DROP TABLE "purchase_invoice_items";
ALTER TABLE "new_purchase_invoice_items" RENAME TO "purchase_invoice_items";
CREATE INDEX "purchase_invoice_items_purchaseInvoiceId_idx" ON "purchase_invoice_items"("purchaseInvoiceId");
CREATE INDEX "purchase_invoice_items_productId_idx" ON "purchase_invoice_items"("productId");
CREATE INDEX "purchase_invoice_items_batchId_idx" ON "purchase_invoice_items"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
