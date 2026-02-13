-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "scheme1" REAL DEFAULT 0,
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
INSERT INTO "new_sales_invoices" ("address", "amountAdd", "areaId", "boxUnit", "cessInsurance", "created_at", "creditAmount", "customerId", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "salesmanId", "scheme1", "status", "tax", "updated_at", "userId", "vanId") SELECT "address", "amountAdd", "areaId", "boxUnit", "cessInsurance", "created_at", "creditAmount", "customerId", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "salesmanId", "scheme1", "status", "tax", "updated_at", "userId", "vanId" FROM "sales_invoices";
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
