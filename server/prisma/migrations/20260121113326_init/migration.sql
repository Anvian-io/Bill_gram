-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "shop_name" TEXT,
    "phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_code" TEXT NOT NULL,
    "product_brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsn_sac_code" TEXT NOT NULL,
    "goods_services" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "product_group" TEXT NOT NULL,
    "product_short_name" TEXT,
    "brand" TEXT,
    "purchase_unit" TEXT,
    "conversion_factor" REAL DEFAULT 1,
    "price_per_pcs" REAL,
    "product_company" TEXT,
    "sale_unit" TEXT,
    "carton_pack" INTEGER DEFAULT 1,
    "inner_pack" INTEGER,
    "packaging" TEXT,
    "insurance_tax" REAL,
    "basic_price" REAL,
    "opening_stock" INTEGER DEFAULT 0,
    "mrp" REAL,
    "purchase_rate" REAL,
    "sale_rate" REAL,
    "margin" REAL,
    "batch_number" TEXT,
    "mfg_date" TEXT,
    "exp_date" TEXT,
    "barcode" TEXT,
    "image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchemaVersion" (
    "version" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE INDEX "products_userId_idx" ON "products"("userId");

-- CreateIndex
CREATE INDEX "products_product_code_idx" ON "products"("product_code");

-- CreateIndex
CREATE INDEX "products_product_brand_idx" ON "products"("product_brand");
