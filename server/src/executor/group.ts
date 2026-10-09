import type { Change, RowOp, Effect, Risk } from '@preflight/shared';

const TOOL_EFFECT_MAP: Record<string, Effect> = {
  db_query: 'READ',
  db_execute: 'WRITE',
  payments_refund: 'EXTERNAL',
  email_send: 'EXTERNAL',
  fs_read: 'READ',
  infra_list_volumes: 'READ',
  infra_delete_volume: 'IRREVERSIBLE'
};

const TOOL_KIND_MAP: Record<string, string> = {
  db_query: 'database',
  db_execute: 'database',
  payments_refund: 'payment',
  email_send: 'email',
  fs_read: 'filesystem',
  infra_list_volumes: 'infrastructure',
  infra_delete_volume: 'infrastructure'
};

export interface GroupOptions {
  planVersion?: number;
  stepToolMap?: Map<number, string>;
}

/**
 * Groups row operations by (tool, table) into structured Change objects with human summaries.
 */
export function groupOpsIntoChanges(ops: RowOp[], options?: GroupOptions): Change[] {
  const planVersion = options?.planVersion ?? 1;
  const stepToolMap = options?.stepToolMap ?? new Map<number, string>();

  // Map key: `${tool}:${table}`
  const groups = new Map<string, { tool: string; table: string; ops: RowOp[] }>();

  for (const op of ops) {
    const tool = stepToolMap.get(op.step) || (op.table === 'refunds' ? 'payments_refund' : op.table === 'email_outbox' ? 'email_send' : op.table === 'infra_volumes' ? 'infra_delete_volume' : 'db_execute');
    const key = `${tool}:${op.table}`;

    const existing = groups.get(key) || { tool, table: op.table, ops: [] };
    existing.ops.push(op);
    groups.set(key, existing);
  }

  const changes: Change[] = [];
  let changeIndex = 1;

  for (const { tool, table, ops: groupOps } of groups.values()) {
    const rowsAffected = groupOps.length;
    const effect = TOOL_EFFECT_MAP[tool] || 'WRITE';
    const kind = TOOL_KIND_MAP[tool] || 'database';

    let amountInr: number | undefined;
    let recipients: number | undefined;

    // Calculate amounts
    if (table === 'refunds') {
      amountInr = groupOps.reduce(
        (sum, op) => sum + Number(op.after?.amount_inr || 0),
        0
      );
    } else if (table === 'orders') {
      amountInr = groupOps.reduce(
        (sum, op) => sum + Number((op.before || op.after)?.amount_inr || 0),
        0
      );
    }

    if (table === 'email_outbox') {
      recipients = groupOps.length;
    }

    // Determine scope
    let scope: 'staging' | 'production' = 'production';
    if (table === 'infra_volumes') {
      const anyProd = groupOps.some((op) => {
        const row = op.after || op.before;
        return row?.environment === 'production';
      });
      scope = anyProd ? 'production' : 'staging';
    }

    // Generate human summary
    let summary = `${tool} on ${table} (${rowsAffected} rows)`;
    if (tool === 'db_execute' && table === 'orders') {
      summary = `Delete ${rowsAffected} orders`;
    } else if (tool === 'payments_refund' && table === 'refunds') {
      summary = `${rowsAffected} refunds totalling ₹${(amountInr || 0).toLocaleString('en-IN')}`;
    } else if (tool === 'email_send' && table === 'email_outbox') {
      summary = `Send ${rowsAffected} emails`;
    } else if (tool === 'infra_delete_volume' && table === 'infra_volumes') {
      const names = groupOps
        .map((op) => (op.after?.name || op.before?.name || op.pk) as string)
        .join(', ');
      summary = `Delete infrastructure volumes: ${names}`;
    }

    // Risk placeholder for Phase 2 (populated in Phase 3)
    const riskPlaceholder: Risk = {
      score: 0,
      level: 'LOW',
      reasons: ['Risk evaluation placeholder (Phase 3)']
    };

    changes.push({
      id: `change-${planVersion}-${changeIndex++}`,
      planVersion,
      tool,
      kind,
      effect,
      target: table,
      summary,
      ops: groupOps,
      rowsAffected,
      amountInr,
      recipients,
      scope,
      risk: riskPlaceholder,
      decision: 'pending',
      excludedPks: [],
      state: 'planned'
    });
  }

  return changes;
}
