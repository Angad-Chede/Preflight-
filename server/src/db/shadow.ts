import Database from 'better-sqlite3';
import fs from 'fs';

/**
 * Creates an in-memory shadow SQLite database copy from a base database file or instance.
 * Reads are isolated, and writes do NOT affect the base database.
 */
export function createShadow(base: string | Database.Database): Database.Database {
  let buffer: Buffer;

  if (typeof base === 'string') {
    if (!fs.existsSync(base)) {
      throw new Error(`Base database file not found at: ${base}`);
    }
    const baseDb = new Database(base, { readonly: true });
    buffer = baseDb.serialize();
    baseDb.close();
  } else {
    buffer = base.serialize();
  }

  // Creating an in-memory Database from the serialized buffer
  const shadow = new Database(buffer);
  return shadow;
}
