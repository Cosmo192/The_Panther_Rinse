import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

export const databasePath = fileURLToPath(
  new URL('../../data/laundry.db', import.meta.url),
);

export const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
