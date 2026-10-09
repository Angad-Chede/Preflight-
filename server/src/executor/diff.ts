import type Database from 'better-sqlite3';
import type { Row, Pk, RowOp } from '@preflight/shared';
import { TRACKED_TABLES } from '../db/hash';

export type TableState = Map<string, Map<Pk, Row>>;

/**
 * Reads all rows from the tracked tables into memory maps keyed by primary key.
 */
export function readState(db: Database.Database): TableState {
  const state: TableState = new Map();

  for (const table of TRACKED_TABLES) {
    const tableMap = new Map<Pk, Row>();
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table);

    if (tableExists) {
      const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all() as Row[];
      for (const row of rows) {
        const pk = row.id as Pk;
        tableMap.set(pk, row);
      }
    }
    state.set(table, tableMap);
  }

  return state;
}

/**
 * Compares two table states and generates atomic RowOp mutations.
 */
export function diffStates(before: TableState, after: TableState, step: number): RowOp[] {
  const ops: RowOp[] = [];

  for (const table of TRACKED_TABLES) {
    const beforeTable = before.get(table) || new Map<Pk, Row>();
    const afterTable = after.get(table) || new Map<Pk, Row>();

    // 1. Check for deletes and updates
    for (const [pk, beforeRow] of beforeTable.entries()) {
      if (!afterTable.has(pk)) {
        ops.push({
          table,
          pk,
          op: 'delete',
          before: beforeRow,
          step
        });
      } else {
        const afterRow = afterTable.get(pk)!;
        if (JSON.stringify(beforeRow) !== JSON.stringify(afterRow)) {
          ops.push({
            table,
            pk,
            op: 'update',
            before: beforeRow,
            after: afterRow,
            step
          });
        }
      }
    }

    // 2. Check for inserts
    for (const [pk, afterRow] of afterTable.entries()) {
      if (!beforeTable.has(pk)) {
        ops.push({
          table,
          pk,
          op: 'insert',
          after: afterRow,
          step
        });
      }
    }
  }

  return ops;
}
