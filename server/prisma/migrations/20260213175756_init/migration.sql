-- CreateTable
CREATE TABLE "sales_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "sales_invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesInvoiceId" INTEGER NOT NULL,
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
    CONSTRAINT "sales_invoice_items_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales_histories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "salesInvoiceId" INTEGER,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "vanId" INTEGER NOT NULL,
    "salesmanId" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "aQty" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_histories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_histories_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "salesmen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sales_invoices_customerId_idx" ON "sales_invoices"("customerId");

-- CreateIndex
CREATE INDEX "sales_invoices_areaId_idx" ON "sales_invoices"("areaId");

-- CreateIndex
CREATE INDEX "sales_invoices_vanId_idx" ON "sales_invoices"("vanId");

-- CreateIndex
CREATE INDEX "sales_invoices_salesmanId_idx" ON "sales_invoices"("salesmanId");

-- CreateIndex
CREATE INDEX "sales_invoices_invoiceNo_idx" ON "sales_invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "sales_invoices_invoiceDate_idx" ON "sales_invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "sales_invoices_deleted_idx" ON "sales_invoices"("deleted");

-- CreateIndex
CREATE INDEX "sales_invoice_items_salesInvoiceId_idx" ON "sales_invoice_items"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "sales_invoice_items_productId_idx" ON "sales_invoice_items"("productId");

-- CreateIndex
CREATE INDEX "sales_invoice_items_batchId_idx" ON "sales_invoice_items"("batchId");

-- CreateIndex
CREATE INDEX "sales_histories_productId_idx" ON "sales_histories"("productId");

-- CreateIndex
CREATE INDEX "sales_histories_batchId_idx" ON "sales_histories"("batchId");

-- CreateIndex
CREATE INDEX "sales_histories_salesInvoiceId_idx" ON "sales_histories"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "sales_histories_invoiceDate_idx" ON "sales_histories"("invoiceDate");
