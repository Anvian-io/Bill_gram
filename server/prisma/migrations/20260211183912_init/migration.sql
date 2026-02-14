-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "purchase_invoice_items" (
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
    "sch1Percent" REAL DEFAULT 0,
    "sch1Amount" REAL DEFAULT 0,
    "sch2Percent" REAL DEFAULT 0,
    "sch2Amount" REAL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchase_invoice_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_histories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "purchaseInvoiceId" INTEGER,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "aQty" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_histories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_histories_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_histories_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_histories_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "purchase_invoices_supplierId_idx" ON "purchase_invoices"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_invoices_invoiceNo_idx" ON "purchase_invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "purchase_invoices_invoiceDate_idx" ON "purchase_invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "purchase_invoices_deleted_idx" ON "purchase_invoices"("deleted");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_purchaseInvoiceId_idx" ON "purchase_invoice_items"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_productId_idx" ON "purchase_invoice_items"("productId");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_batchId_idx" ON "purchase_invoice_items"("batchId");

-- CreateIndex
CREATE INDEX "purchase_histories_productId_idx" ON "purchase_histories"("productId");

-- CreateIndex
CREATE INDEX "purchase_histories_batchId_idx" ON "purchase_histories"("batchId");

-- CreateIndex
CREATE INDEX "purchase_histories_purchaseInvoiceId_idx" ON "purchase_histories"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "purchase_histories_invoiceDate_idx" ON "purchase_histories"("invoiceDate");
