import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { databasePath, db } from './database.js';

const migrationsDirectory = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

type AppliedMigration = { name: string };

export function migrate(database: Database.Database = db): number {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const applied = new Set(
    database
      .prepare<[], AppliedMigration>('SELECT name FROM schema_migrations')
      .all()
      .map(({ name }) => name),
  );

  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const applyMigration = database.transaction((name: string, sql: string) => {
    database.exec(sql);
    database.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name);
  });

  let appliedCount = 0;
  for (const name of migrationFiles) {
    if (applied.has(name)) continue;

    const sql = readFileSync(`${migrationsDirectory}/${name}`, 'utf8');
    applyMigration(name, sql);
    appliedCount += 1;
  }

  return appliedCount;
}

export function resetDatabase(): number {
  db.close();

  for (const suffix of ['', '-shm', '-wal']) {
    const path = `${databasePath}${suffix}`;
    if (existsSync(path)) unlinkSync(path);
  }

  const freshDatabase = new (db.constructor as typeof Database)(databasePath);
  freshDatabase.pragma('journal_mode = WAL');
  freshDatabase.pragma('foreign_keys = ON');

  try {
    return migrate(freshDatabase);
  } finally {
    freshDatabase.close();
  }
}
