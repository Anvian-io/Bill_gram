-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_phoneNo_key" ON "suppliers"("phoneNo");
