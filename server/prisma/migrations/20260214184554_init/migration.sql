/*
  Warnings:

  - You are about to drop the column `sch1Amount` on the `sales_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch1Percent` on the `sales_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch2Amount` on the `sales_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `sch2Percent` on the `sales_invoice_items` table. All the data in the column will be lost.
  - You are about to alter the column `mQty` on the `sales_invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `scheme1` on the `sales_invoices` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sales_invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesInvoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "rate" REAL NOT NULL,
    "aQty" INTEGER NOT NULL,
    "frQty" INTEGER DEFAULT 0,
    "mQty" REAL,
    "totalAmount" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "schPercent" REAL DEFAULT 0,
    "schAmount" REAL DEFAULT 0,
    "finalAmount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_invoice_items_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales_invoice_items" ("aQty", "batchId", "created_at", "id", "mQty", "productId", "rate", "salesInvoiceId", "taxAmount", "taxRate", "totalAmount", "updated_at") SELECT "aQty", "batchId", "created_at", "id", "mQty", "productId", "rate", "salesInvoiceId", "taxAmount", "taxRate", "totalAmount", "updated_at" FROM "sales_invoice_items";
DROP TABLE "sales_invoice_items";
ALTER TABLE "new_sales_invoice_items" RENAME TO "sales_invoice_items";
CREATE INDEX "sales_invoice_items_salesInvoiceId_idx" ON "sales_invoice_items"("salesInvoiceId");
CREATE INDEX "sales_invoice_items_productId_idx" ON "sales_invoice_items"("productId");
CREATE INDEX "sales_invoice_items_batchId_idx" ON "sales_invoice_items"("batchId");
CREATE TABLE "new_sales_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT,
    "invoiceDate" DATETIME NOT NULL,
    "areaId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vanId" INTEGER NOT NULL,
    "salesmanId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "gstDetails" TEXT DEFAULT 'Against GST',
    "remarks" TEXT,
    "grossAmount" REAL NOT NULL,
    "boxUnit" REAL DEFAULT 0,
    "cessInsurance" REAL DEFAULT 0,
    "discountPercent" REAL DEFAULT 0,
    "tax" REAL DEFAULT 0,
    "amountAdd" REAL DEFAULT 0,
    "creditAmount" REAL DEFAULT 0,
    "finalAmount" REAL NOT NULL,
    "status" TEXT DEFAULT 'Pending',
    "userId" INTEGER,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_invoices_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoices_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoices_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "salesmen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales_invoices" ("address", "amountAdd", "areaId", "boxUnit", "cessInsurance", "created_at", "creditAmount", "customerId", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "salesmanId", "status", "tax", "updated_at", "userId", "vanId") SELECT "address", "amountAdd", "areaId", "boxUnit", "cessInsurance", "created_at", "creditAmount", "customerId", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "salesmanId", "status", "tax", "updated_at", "userId", "vanId" FROM "sales_invoices";
DROP TABLE "sales_invoices";
ALTER TABLE "new_sales_invoices" RENAME TO "sales_invoices";
CREATE INDEX "sales_invoices_customerId_idx" ON "sales_invoices"("customerId");
CREATE INDEX "sales_invoices_areaId_idx" ON "sales_invoices"("areaId");
CREATE INDEX "sales_invoices_vanId_idx" ON "sales_invoices"("vanId");
CREATE INDEX "sales_invoices_salesmanId_idx" ON "sales_invoices"("salesmanId");
CREATE INDEX "sales_invoices_invoiceNo_idx" ON "sales_invoices"("invoiceNo");
CREATE INDEX "sales_invoices_invoiceDate_idx" ON "sales_invoices"("invoiceDate");
CREATE INDEX "sales_invoices_deleted_idx" ON "sales_invoices"("deleted");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
