import type { Change, Risk, Level } from '@preflight/shared';
import { detectAnomalies } from './rules';

export const RISK_WEIGHTS = {
  BASE: {
    READ: 0,
    WRITE: 15,
    EXTERNAL: 35,
    IRREVERSIBLE: 60
  },
  MAX_BLAST_RADIUS: 20,
  SCOPE_PRODUCTION: 10,
  SENSITIVE_TABLE: 10,
  BACKUP_TOUCHED: 5,
  ANOMALY_PAID_REAL_ORDERS: 15,
  ANOMALY_DUPLICATE_REFUND: 10,
  ANOMALY_DUPLICATE_EMAIL: 5,
  INTENT_DRIFT_MULTIPLIER: 20,
  THRESHOLDS: {
    MEDIUM_MIN: 30,
    HIGH_MIN: 60,
    CRITICAL_MIN: 80
  }
} as const;

export const SENSITIVE_TABLES = new Set([
  'orders',
  'refunds',
  'customers',
  'email_outbox'
]);

/**
 * Calculates deterministic risk score, level, and human-readable reasons for a proposed Change.
 */
export function scoreChange(
  change: Change,
  task: string,
  driftScore: number,
  driftReason?: string
): Risk {
  let score = 0;
  const reasons: string[] = [];

  // 1. Base score by effect class
  const baseEffectScore = RISK_WEIGHTS.BASE[change.effect] ?? 15;
  score += baseEffectScore;
  if (change.effect === 'IRREVERSIBLE') {
    reasons.push('Irreversible destruction action (base: +60)');
  } else if (change.effect === 'EXTERNAL') {
    reasons.push('External financial or communication side effect (base: +35)');
  } else if (change.effect === 'WRITE') {
    reasons.push('Database modification operation (base: +15)');
  }

  // 2. Blast radius calculation (larger of rows or monetary impact)
  const rows = change.rowsAffected || change.recipients || change.ops.length || 0;
  const rowScore = Math.min(
    RISK_WEIGHTS.MAX_BLAST_RADIUS,
    Math.round(5 * Math.log10(1 + rows))
  );

  let moneyScore = 0;
  if (change.amountInr && change.amountInr > 0) {
    moneyScore = Math.min(
      RISK_WEIGHTS.MAX_BLAST_RADIUS,
      Math.round(4 * Math.log10(1 + change.amountInr / 1000))
    );
  }

  const blastRadiusScore = Math.max(rowScore, moneyScore);
  score += blastRadiusScore;
  if (blastRadiusScore > 0) {
    if (moneyScore >= rowScore && change.amountInr) {
      reasons.push(
        `Blast radius: ₹${change.amountInr.toLocaleString('en-IN')} financial value (+${blastRadiusScore})`
      );
    } else {
      reasons.push(`Blast radius: ${rows} rows affected (+${blastRadiusScore})`);
    }
  }

  // 3. Scope: +10 if production
  if (change.scope === 'production') {
    score += RISK_WEIGHTS.SCOPE_PRODUCTION;
    reasons.push('Targets production environment resources (+10)');
  }

  // 4. Sensitivity: +10 for business tables
  if (SENSITIVE_TABLES.has(change.target)) {
    score += RISK_WEIGHTS.SENSITIVE_TABLE;
    reasons.push(`Touches core business data table '${change.target}' (+10)`);
  }

  // 5. Anomaly detection & rules
  const anomalies = detectAnomalies(change, task);

  if (anomalies.hasBackupTouched) {
    score += RISK_WEIGHTS.BACKUP_TOUCHED;
    reasons.push('Touches critical backup storage volume (+5)');
  }

  if (anomalies.hasPaidRealOrders) {
    score += RISK_WEIGHTS.ANOMALY_PAID_REAL_ORDERS;
    const formattedAmount =
      anomalies.paidRealOrdersAmountInr >= 100000
        ? `₹${(anomalies.paidRealOrdersAmountInr / 100000).toFixed(1)}L`
        : `₹${anomalies.paidRealOrdersAmountInr.toLocaleString('en-IN')}`;
    reasons.push(
      `Includes ${anomalies.paidRealOrdersCount} paid orders worth ${formattedAmount} (+15)`
    );
  }

  if (anomalies.hasDuplicateRefunds) {
    score += RISK_WEIGHTS.ANOMALY_DUPLICATE_REFUND;
    reasons.push(
      `${anomalies.duplicateRefundsCount} duplicate refund(s) flagged (₹${anomalies.duplicateRefundsAmountInr.toLocaleString('en-IN')}) (+10)`
    );
  }

  if (anomalies.hasDuplicateEmails) {
    score += RISK_WEIGHTS.ANOMALY_DUPLICATE_EMAIL;
    reasons.push(
      `${anomalies.duplicateEmailsCount} duplicate email recipient(s) flagged (+5)`
    );
  }

  // 6. Intent drift score contribution
  const driftPoints = Math.round(RISK_WEIGHTS.INTENT_DRIFT_MULTIPLIER * driftScore);
  score += driftPoints;
  if (driftPoints > 0) {
    const reasonText = driftReason ? `: ${driftReason}` : '';
    reasons.push(`Intent drift (${driftScore.toFixed(2)}) (+${driftPoints})${reasonText}`);
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Level: <30 LOW, 30–59 MEDIUM, 60–79 HIGH, 80+ CRITICAL
  let level: Level = 'LOW';
  if (finalScore >= RISK_WEIGHTS.THRESHOLDS.CRITICAL_MIN) {
    level = 'CRITICAL';
  } else if (finalScore >= RISK_WEIGHTS.THRESHOLDS.HIGH_MIN) {
    level = 'HIGH';
  } else if (finalScore >= RISK_WEIGHTS.THRESHOLDS.MEDIUM_MIN) {
    level = 'MEDIUM';
  }

  return {
    score: finalScore,
    level,
    reasons
  };
}
