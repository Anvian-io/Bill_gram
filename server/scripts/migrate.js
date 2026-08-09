#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.join(__dirname, '..');

function getDatabasePath() {
  const appName = 'BillGram';
  let dbDir;

  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      dbDir = path.join(homeDir, 'AppData', 'Local', appName);
      break;
    case 'darwin':
      dbDir = path.join(homeDir, 'Library', 'Application Support', appName);
      break;
    case 'linux':
      dbDir = path.join(homeDir, '.config', appName);
      break;
    default:
      dbDir = path.join(homeDir, `.${appName.toLowerCase()}`);
  }

  if (!fs.existsSync(dbDir)) {
    console.log(`📁 Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'shopkeeper.db');
}

function runPrisma(command) {
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
    cwd: SERVER_ROOT,
  });
}

async function main() {
  const mode = process.argv[2] || 'deploy';
  const migrationName = process.argv[3] || 'update';

  try {
    const dbPath = getDatabasePath();
    const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = databaseUrl;

    console.log(`📁 Database location: ${dbPath}`);
    console.log(`🔗 DATABASE_URL: ${databaseUrl}`);

    if (mode === 'create') {
      console.log(`📝 Creating migration file only: ${migrationName}`);
      console.log(
        'ℹ️  This does not apply changes. Run npm run prisma:migrate after reviewing the SQL.',
      );
      runPrisma(`npx prisma migrate dev --create-only --name ${migrationName}`);
    } else if (mode === 'deploy') {
      console.log(
        '🚀 Applying pending migrations (safe, no database reset)...',
      );
      runPrisma('npx prisma migrate deploy');
      console.log('✅ Migrations applied successfully!');
    } else if (mode === 'resolve') {
      const migrationId = process.argv[3];
      if (!migrationId) {
        console.error(
          '❌ Usage: npm run prisma:migrate -- resolve <migration_folder_name>',
        );
        process.exit(1);
      }
      console.log(`✅ Marking migration as applied: ${migrationId}`);
      runPrisma(`npx prisma migrate resolve --applied ${migrationId}`);
    } else {
      console.error(`❌ Unknown mode: ${mode}`);
      console.error('Usage:');
      console.error(
        '  npm run prisma:migrate              # apply pending migrations',
      );
      console.error(
        '  npm run prisma:migrate -- create <name>  # create migration SQL only',
      );
      console.error(
        '  npm run prisma:migrate -- resolve <id>   # mark migration applied (if column already exists)',
      );
      console.error('');
      console.error(
        'For day-to-day schema sync on this project, prefer: npm run prisma:push',
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration command failed:', error.message);
    console.error('');
    console.error('Common fixes:');
    console.error('  • Schema already synced via push? Use:');
    console.error(
      '    npm run prisma:migrate -- resolve 20260628180000_add_product_is_locked',
    );
    console.error('  • Day-to-day updates: npm run prisma:push');
    console.error(
      '  • Never answer Y to a database reset prompt — it deletes all data.',
    );
    process.exit(1);
  }
}

main();
