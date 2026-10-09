import type { RowOp, Row } from '@preflight/shared';

/**
 * Collapses multiple row operations touching the same (table, pk) into a single canonical op.
 * - Keeps the earliest before state and the latest after state.
 * - An insert followed by a delete cancels out completely.
 * - Keeps the earliest step number.
 */
export function collapseOps(ops: RowOp[]): RowOp[] {
  const map = new Map<string, RowOp[]>();

  for (const op of ops) {
    const key = `${op.table}:${op.pk}`;
    const existing = map.get(key) || [];
    existing.push(op);
    map.set(key, existing);
  }

  const collapsed: RowOp[] = [];

  for (const group of map.values()) {
    if (group.length === 1) {
      collapsed.push(group[0]!);
      continue;
    }

    // Sort by step to ensure correct chronological sequence
    group.sort((a, b) => a.step - b.step);

    const firstOp = group[0]!;
    const lastOp = group[group.length - 1]!;

    const table = firstOp.table;
    const pk = firstOp.pk;
    const earliestStep = firstOp.step;

    // Find the initial 'before' (if any) and final 'after' (if any)
    const initialBefore: Row | undefined = firstOp.before;
    const finalAfter: Row | undefined = lastOp.after;

    if (!initialBefore && !finalAfter) {
      // Row was inserted and subsequently deleted in the same session -> cancels out!
      continue;
    }

    if (!initialBefore && finalAfter) {
      // Inserted and updated -> net operation is insert
      collapsed.push({
        table,
        pk,
        op: 'insert',
        after: finalAfter,
        step: earliestStep
      });
    } else if (initialBefore && !finalAfter) {
      // Updated and deleted -> net operation is delete
      collapsed.push({
        table,
        pk,
        op: 'delete',
        before: initialBefore,
        step: earliestStep
      });
    } else if (initialBefore && finalAfter) {
      // Multiple updates -> check if final differs from initial
      if (JSON.stringify(initialBefore) !== JSON.stringify(finalAfter)) {
        collapsed.push({
          table,
          pk,
          op: 'update',
          before: initialBefore,
          after: finalAfter,
          step: earliestStep
        });
      }
    }
  }

  return collapsed;
}
