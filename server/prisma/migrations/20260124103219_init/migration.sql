-- CreateTable
CREATE TABLE "areas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "region" TEXT,
    "city" TEXT,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "areas_state_idx" ON "areas"("state");

-- CreateIndex
CREATE INDEX "areas_region_idx" ON "areas"("region");

-- CreateIndex
CREATE INDEX "areas_city_idx" ON "areas"("city");

-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");
