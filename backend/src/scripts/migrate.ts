import { DataTypes, QueryInterface } from 'sequelize';
import sequelize from '../config/database';
import path from 'path';
import fs from 'fs';

/**
 * Migration runner for GameVault.
 * Tracks executed migrations in a `sequelize_migrations` table.
 * Migrations are TypeScript files exporting `up(qi)` and `down(qi)`.
 */

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

interface MigrationModule {
  up: (qi: QueryInterface) => Promise<void>;
  down: (qi: QueryInterface) => Promise<void>;
}

async function ensureMigrationsTable(): Promise<void> {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('sequelize_migrations', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }).catch(() => {
    // Table already exists
  });
}

async function getExecutedMigrations(): Promise<string[]> {
  const [results] = await sequelize.query(
    'SELECT name FROM sequelize_migrations ORDER BY name'
  );
  return (results as Array<{ name: string }>).map(r => r.name);
}

async function getMigrationFiles(): Promise<string[]> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found.');
    return [];
  }
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();
  return files;
}

async function runMigrations(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await ensureMigrationsTable();

    const executed = await getExecutedMigrations();
    const files = await getMigrationFiles();
    const pending = files.filter(f => !executed.includes(f));

    if (pending.length === 0) {
      console.log('✅ No pending migrations.');
      process.exit(0);
    }

    console.log(`📦 ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
      const migrationPath = path.join(MIGRATIONS_DIR, file);
      console.log(`⏳ Running: ${file}...`);

      const migration: MigrationModule = require(migrationPath);
      const qi = sequelize.getQueryInterface();

      await migration.up(qi);

      await sequelize.query(
        `INSERT INTO sequelize_migrations (name, executed_at) VALUES (:name, NOW())`,
        { replacements: { name: file } }
      );

      console.log(`✅ Completed: ${file}`);
    }

    console.log(`\n✅ All migrations completed successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigration(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await ensureMigrationsTable();

    const executed = await getExecutedMigrations();
    if (executed.length === 0) {
      console.log('✅ No migrations to rollback.');
      process.exit(0);
    }

    const lastMigration = executed[executed.length - 1];
    console.log(`⏳ Rolling back: ${lastMigration}...`);

    const migrationPath = path.join(MIGRATIONS_DIR, lastMigration);
    const migration: MigrationModule = require(migrationPath);
    const qi = sequelize.getQueryInterface();

    await migration.down(qi);

    await sequelize.query(
      `DELETE FROM sequelize_migrations WHERE name = :name`,
      { replacements: { name: lastMigration } }
    );

    console.log(`✅ Rolled back: ${lastMigration}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];
if (command === 'down' || command === 'rollback') {
  rollbackMigration();
} else {
  runMigrations();
}
