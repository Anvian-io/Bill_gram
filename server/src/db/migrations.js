// server/src/db/migrations.js
export const migrations = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        shop_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    version: 2,
    up: `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT UNIQUE NOT NULL,
        product_brand TEXT NOT NULL,
        description TEXT NOT NULL,
        hsn_sac_code TEXT NOT NULL,
        goods_services TEXT NOT NULL CHECK(goods_services IN ('Goods', 'Services')),
        weight REAL NOT NULL,
        unit TEXT NOT NULL,
        product_group TEXT NOT NULL,
        product_short_name TEXT,
        brand TEXT,
        purchase_unit TEXT,
        conversion_factor REAL DEFAULT 1,
        price_per_pcs REAL,
        product_company TEXT,
        sale_unit TEXT,
        carton_pack INTEGER DEFAULT 1,
        inner_pack INTEGER,
        packaging TEXT CHECK(packaging IN ('BASIC', 'MRP')),
        insurance_tax REAL,
        basic_price REAL,
        opening_stock INTEGER DEFAULT 0,
        mrp REAL,
        purchase_rate REAL,
        sale_rate REAL,
        margin REAL,
        batch_number TEXT,
        mfg_date TEXT,
        exp_date TEXT,
        barcode TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(product_brand);
    `,
  },
];

export async function runMigrations(db) {
  // Create migrations table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  // Get current version
  const result = await db.get("SELECT version FROM schema_version");
  const currentVersion = result ? result.version : 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.exec(migration.up);
      await db.run(
        "INSERT OR REPLACE INTO schema_version (version) VALUES (?)",
        migration.version
      );
      console.log(`Applied migration ${migration.version}`);
    }
  }
}
