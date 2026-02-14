-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_purchase_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT,
    "invoiceDate" DATETIME NOT NULL,
    "supplierId" INTEGER NOT NULL,
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
    CONSTRAINT "purchase_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_purchase_invoices" ("amountAdd", "boxUnit", "cessInsurance", "created_at", "creditAmount", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "scheme1", "status", "supplierId", "tax", "updated_at", "userId") SELECT "amountAdd", "boxUnit", "cessInsurance", "created_at", "creditAmount", "deleted", "discountPercent", "finalAmount", "grossAmount", "gstDetails", "id", "invoiceDate", "invoiceNo", "remarks", "scheme1", "status", "supplierId", "tax", "updated_at", "userId" FROM "purchase_invoices";
DROP TABLE "purchase_invoices";
ALTER TABLE "new_purchase_invoices" RENAME TO "purchase_invoices";
CREATE INDEX "purchase_invoices_supplierId_idx" ON "purchase_invoices"("supplierId");
CREATE INDEX "purchase_invoices_invoiceNo_idx" ON "purchase_invoices"("invoiceNo");
CREATE INDEX "purchase_invoices_invoiceDate_idx" ON "purchase_invoices"("invoiceDate");
CREATE INDEX "purchase_invoices_deleted_idx" ON "purchase_invoices"("deleted");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
