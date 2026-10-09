import crypto from 'crypto';
import type Database from 'better-sqlite3';

export const TRACKED_TABLES = [
  'complaints',
  'customers',
  'email_outbox',
  'infra_volumes',
  'orders',
  'refunds'
];

/**
 * Calculates canonical SHA-256 hash across all tracked tables in the database.
 * Tables are sorted by name, and rows are ordered by rowid.
 */
export function hashDb(db: Database.Database, tables: string[] = TRACKED_TABLES): string {
  const sortedTables = [...tables].sort();
  const hash = crypto.createHash('sha256');

  for (const table of sortedTables) {
    // Check if table exists
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table);

    if (tableExists) {
      const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();
      hash.update(table + ':' + JSON.stringify(rows));
    }
  }

  return hash.digest('hex');
}

export function isTrackedTable(table: string): boolean {
  return TRACKED_TABLES.includes(table.toLowerCase());
}

export function assertTracked(table: string): boolean {
  if (!isTrackedTable(table)) {
    throw new Error(`Table '${table}' is not a tracked table (${TRACKED_TABLES.join(', ')})`);
  }
  return true;
}
