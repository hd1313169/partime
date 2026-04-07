import Database from 'better-sqlite3';
import { schemaSql } from './schema';

export type SqliteDb = Database.Database;

export function createSqliteDb(path: string): SqliteDb {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  db.exec(schemaSql);
  return db;
}
