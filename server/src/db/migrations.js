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
  // Add more migrations as needed
  // {
  //   version: 2,
  //   up: `ALTER TABLE users ADD COLUMN gst_number TEXT;`
  // }
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
