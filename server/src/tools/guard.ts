import { isTrackedTable } from '../db/hash';

export interface GuardResult {
  ok: boolean;
  error?: string;
  table?: string;
}

const FORBIDDEN_WORDS = [
  'ATTACH',
  'DETACH',
  'PRAGMA',
  'VACUUM',
  'LOAD_EXTENSION',
  'CREATE',
  'DROP',
  'ALTER',
  'REINDEX',
  'sqlite_master'
];

/**
 * Validates SQL queries to protect the sandbox and ensure zero writes reach the real file.
 */
export function validateSql(sql: string, mode: 'query' | 'execute'): GuardResult {
  if (!sql || typeof sql !== 'string') {
    return { ok: false, error: 'SQL query must be a non-empty string' };
  }

  const trimmed = sql.trim();

  // Reject comments
  if (trimmed.includes('--') || trimmed.includes('/*') || trimmed.includes('*/')) {
    return { ok: false, error: 'SQL comments are not allowed' };
  }

  // Exactly one statement (trailing semicolon is fine)
  const statements = trimmed
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length > 1) {
    return { ok: false, error: 'Multiple SQL statements are not allowed' };
  }

  // Check forbidden keywords (case-insensitive, whole word)
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(trimmed)) {
      return { ok: false, error: `Forbidden SQL keyword: ${word}` };
    }
  }

  // Also check REPLACE INTO specifically
  if (/\bREPLACE\s+INTO\b/i.test(trimmed)) {
    return { ok: false, error: 'REPLACE INTO is not allowed' };
  }

  if (mode === 'query') {
    if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
      return { ok: false, error: 'db_query must begin with SELECT or WITH' };
    }
    return { ok: true };
  }

  if (mode === 'execute') {
    const isInsert = /^\s*INSERT\s+INTO\s+["`']?([a-zA-Z0-9_]+)["`']?/i.exec(trimmed);
    const isUpdate = /^\s*UPDATE\s+["`']?([a-zA-Z0-9_]+)["`']?/i.exec(trimmed);
    const isDelete = /^\s*DELETE\s+FROM\s+["`']?([a-zA-Z0-9_]+)["`']?/i.exec(trimmed);

    const match = isInsert || isUpdate || isDelete;
    if (!match || !match[1]) {
      return {
        ok: false,
        error: 'db_execute must begin with INSERT INTO, UPDATE, or DELETE FROM'
      };
    }

    const table = match[1].toLowerCase();
    if (!isTrackedTable(table)) {
      return {
        ok: false,
        error: `Target table '${table}' is not a tracked table. Allowed: complaints, customers, email_outbox, infra_volumes, orders, refunds`
      };
    }

    return { ok: true, table };
  }

  return { ok: false, error: 'Invalid mode' };
}
