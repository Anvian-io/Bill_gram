/*
  Warnings:

  - You are about to alter the column `mQty` on the `purchase_invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `mQty` on the `sales_invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

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
    "unit" INTEGER,
    "totalAmount" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "fQty" INTEGER DEFAULT 0,
    "DQty" INTEGER DEFAULT 0,
    "schPercent" REAL DEFAULT 0,
    "schAmount" REAL DEFAULT 0,
    "finalAmount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchase_invoice_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_purchase_invoice_items" ("DQty", "aQty", "batchId", "created_at", "fQty", "finalAmount", "id", "mQty", "productId", "purchaseInvoiceId", "rate", "schAmount", "schPercent", "taxAmount", "taxRate", "totalAmount", "updated_at") SELECT "DQty", "aQty", "batchId", "created_at", "fQty", "finalAmount", "id", "mQty", "productId", "purchaseInvoiceId", "rate", "schAmount", "schPercent", "taxAmount", "taxRate", "totalAmount", "updated_at" FROM "purchase_invoice_items";
DROP TABLE "purchase_invoice_items";
ALTER TABLE "new_purchase_invoice_items" RENAME TO "purchase_invoice_items";
CREATE INDEX "purchase_invoice_items_purchaseInvoiceId_idx" ON "purchase_invoice_items"("purchaseInvoiceId");
CREATE INDEX "purchase_invoice_items_productId_idx" ON "purchase_invoice_items"("productId");
CREATE INDEX "purchase_invoice_items_batchId_idx" ON "purchase_invoice_items"("batchId");
CREATE TABLE "new_sales_invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesInvoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "rate" REAL NOT NULL,
    "aQty" INTEGER NOT NULL,
    "mQty" INTEGER,
    "unit" INTEGER,
    "totalAmount" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "fQty" INTEGER DEFAULT 0,
    "DQty" INTEGER DEFAULT 0,
    "schPercent" REAL DEFAULT 0,
    "schAmount" REAL DEFAULT 0,
    "finalAmount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_invoice_items_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales_invoice_items" ("DQty", "aQty", "batchId", "created_at", "fQty", "finalAmount", "id", "mQty", "productId", "rate", "salesInvoiceId", "schAmount", "schPercent", "taxAmount", "taxRate", "totalAmount", "updated_at") SELECT "DQty", "aQty", "batchId", "created_at", "fQty", "finalAmount", "id", "mQty", "productId", "rate", "salesInvoiceId", "schAmount", "schPercent", "taxAmount", "taxRate", "totalAmount", "updated_at" FROM "sales_invoice_items";
DROP TABLE "sales_invoice_items";
ALTER TABLE "new_sales_invoice_items" RENAME TO "sales_invoice_items";
CREATE INDEX "sales_invoice_items_salesInvoiceId_idx" ON "sales_invoice_items"("salesInvoiceId");
CREATE INDEX "sales_invoice_items_productId_idx" ON "sales_invoice_items"("productId");
CREATE INDEX "sales_invoice_items_batchId_idx" ON "sales_invoice_items"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
