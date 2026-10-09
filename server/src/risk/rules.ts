import type { Change } from '@preflight/shared';

export interface AnomalyReport {
  hasPaidRealOrders: boolean;
  paidRealOrdersCount: number;
  paidRealOrdersAmountInr: number;
  hasDuplicateRefunds: boolean;
  duplicateRefundsCount: number;
  duplicateRefundsAmountInr: number;
  hasDuplicateEmails: boolean;
  duplicateEmailsCount: number;
  hasBackupTouched: boolean;
  reasons: string[];
}

/**
 * Detects anomalies in row operations and tags RowOp.flags accordingly.
 */
export function detectAnomalies(change: Change, task: string): AnomalyReport {
  const taskLower = task.toLowerCase();
  const taskMentionsTest = taskLower.includes('test');
  const reasons: string[] = [];

  let paidRealOrdersCount = 0;
  let paidRealOrdersAmountInr = 0;

  // 1. Detect paid real orders touched when task mentions test
  if (change.target === 'orders' && taskMentionsTest) {
    for (const op of change.ops) {
      const row = op.before || op.after;
      if (row && row.is_test === 0 && row.paid === 1) {
        paidRealOrdersCount++;
        paidRealOrdersAmountInr += Number(row.amount_inr || 0);
        op.flags = op.flags || [];
        if (!op.flags.includes('paid-real-order')) {
          op.flags.push('paid-real-order');
        }
      }
    }

    if (paidRealOrdersCount > 0) {
      const formattedAmount =
        paidRealOrdersAmountInr >= 100000
          ? `₹${(paidRealOrdersAmountInr / 100000).toFixed(1)}L`
          : `₹${paidRealOrdersAmountInr.toLocaleString('en-IN')}`;
      reasons.push(
        `Includes ${paidRealOrdersCount} paid orders worth ${formattedAmount}`
      );
    }
  }

  // 2. Detect duplicate refunds for the same order_id
  let duplicateRefundsCount = 0;
  let duplicateRefundsAmountInr = 0;

  if (change.target === 'refunds') {
    const seenOrders = new Set<unknown>();
    for (const op of change.ops) {
      const orderId = op.after?.order_id ?? op.before?.order_id;
      if (orderId !== undefined) {
        if (seenOrders.has(orderId)) {
          duplicateRefundsCount++;
          duplicateRefundsAmountInr += Number(op.after?.amount_inr || op.before?.amount_inr || 0);
          op.flags = op.flags || [];
          if (!op.flags.includes('duplicate-refund')) {
            op.flags.push('duplicate-refund');
          }
        } else {
          seenOrders.add(orderId);
        }
      }
    }

    if (duplicateRefundsCount > 0) {
      reasons.push(
        `${duplicateRefundsCount} duplicate refund(s) flagged (₹${duplicateRefundsAmountInr.toLocaleString('en-IN')})`
      );
    }
  }

  // 3. Detect duplicate email recipients
  let duplicateEmailsCount = 0;
  if (change.target === 'email_outbox') {
    const seenEmails = new Set<unknown>();
    for (const op of change.ops) {
      const email = op.after?.to_email ?? op.before?.to_email;
      if (email !== undefined) {
        if (seenEmails.has(email)) {
          duplicateEmailsCount++;
          op.flags = op.flags || [];
          if (!op.flags.includes('duplicate-recipient')) {
            op.flags.push('duplicate-recipient');
          }
        } else {
          seenEmails.add(email);
        }
      }
    }

    if (duplicateEmailsCount > 0) {
      reasons.push(`${duplicateEmailsCount} duplicate email recipient(s) flagged`);
    }
  }

  // 4. Detect backup volumes touched
  let hasBackupTouched = false;
  if (change.target === 'infra_volumes') {
    for (const op of change.ops) {
      const row = op.after || op.before;
      if (row && (row.is_backup === 1 || String(row.id).includes('backup'))) {
        hasBackupTouched = true;
        op.flags = op.flags || [];
        if (!op.flags.includes('backup-volume')) {
          op.flags.push('backup-volume');
        }
      }
    }

    if (hasBackupTouched) {
      reasons.push('Touches critical infrastructure backup storage volume');
    }
  }

  return {
    hasPaidRealOrders: paidRealOrdersCount > 0,
    paidRealOrdersCount,
    paidRealOrdersAmountInr,
    hasDuplicateRefunds: duplicateRefundsCount > 0,
    duplicateRefundsCount,
    duplicateRefundsAmountInr,
    hasDuplicateEmails: duplicateEmailsCount > 0,
    duplicateEmailsCount,
    hasBackupTouched,
    reasons
  };
}
