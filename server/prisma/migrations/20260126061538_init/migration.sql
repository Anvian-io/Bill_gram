-- CreateTable
CREATE TABLE "accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_holder" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "description" TEXT,
    "qr_code" TEXT,
    "gpay_no" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "accounts_ifsc_code_idx" ON "accounts"("ifsc_code");

-- CreateIndex
CREATE INDEX "accounts_bank_name_idx" ON "accounts"("bank_name");
