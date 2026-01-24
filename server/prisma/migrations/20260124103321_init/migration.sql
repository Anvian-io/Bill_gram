-- CreateTable
CREATE TABLE "vans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "vehicle_no" TEXT,
    "model" TEXT,
    "area" TEXT,
    "city" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "vans_vehicle_no_idx" ON "vans"("vehicle_no");

-- CreateIndex
CREATE INDEX "vans_area_idx" ON "vans"("area");

-- CreateIndex
CREATE INDEX "vans_city_idx" ON "vans"("city");
