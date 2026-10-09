import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from '../src/db/seed';
import { createPlanSession } from '../src/executor/planExecutor';
import { assessChanges } from '../src/risk/index';
import {
  callsScenarioA,
  callsRevisedA,
  getCallsScenarioB,
  callsScenarioC
} from './calls';

describe('Risk Engine & Anomaly Detection Rules', () => {
  const testDir = path.resolve(__dirname, 'risk-test-data');
  const baseDbPath = path.join(testDir, 'base.db');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore on windows lock
      }
    }
    fs.mkdirSync(testDir, { recursive: true });

    const baseDb = new Database(baseDbPath);
    try {
      seedDatabase(baseDb);
    } finally {
      baseDb.close();
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore on windows lock
      }
    }
  });

  it('evaluates Naive Scenario A as HIGH risk with 38 flagged paid real orders', async () => {
    const task = 'Clean up the test orders from the database.';
    const session = createPlanSession(task, 'A', { baseDbPath });

    for (const call of callsScenarioA) {
      session.run(call.tool, call.args);
    }
    const plan = session.finalize();

    const assessed = await assessChanges(plan.changes, task);
    expect(assessed).toHaveLength(1);

    const change = assessed[0]!;
    expect(change.risk.level).toBe('HIGH');
    expect(change.risk.score).toBeGreaterThanOrEqual(60);
    expect(change.risk.score).toBeLessThan(80);

    // Assert 38 flagged ops
    const flaggedOps = change.ops.filter((op) =>
      op.flags?.includes('paid-real-order')
    );
    expect(flaggedOps).toHaveLength(38);

    // Reasons cite concrete numbers from the data
    const hasOrderReason = change.risk.reasons.some(
      (r) => r.includes('38 paid orders') && r.includes('₹2.1L')
    );
    expect(hasOrderReason).toBe(true);
  });

  it('evaluates Revised Scenario A as MEDIUM risk with 0 flagged ops', async () => {
    const task = 'Clean up the test orders from the database safely.';
    const session = createPlanSession(task, 'A', { baseDbPath });

    for (const call of callsRevisedA) {
      session.run(call.tool, call.args);
    }
    const plan = session.finalize();

    const assessed = await assessChanges(plan.changes, task);
    expect(assessed).toHaveLength(1);

    const change = assessed[0]!;
    expect(change.risk.level).toBe('MEDIUM');
    expect(change.risk.score).toBeGreaterThanOrEqual(30);
    expect(change.risk.score).toBeLessThan(60);

    // 0 flagged ops
    const flaggedOps = change.ops.filter((op) => op.flags && op.flags.length > 0);
    expect(flaggedOps).toHaveLength(0);
  });

  it('evaluates Scenario B refunds as HIGH risk with 9 duplicate flags, and emails as HIGH', async () => {
    const task =
      'Refund customers who complained about damaged parcels and email each one.';
    const session = createPlanSession(task, 'B', { baseDbPath });

    const calls = getCallsScenarioB();
    for (const call of calls) {
      session.run(call.tool, call.args);
    }
    const plan = session.finalize();

    const assessed = await assessChanges(plan.changes, task);
    expect(assessed).toHaveLength(2);

    const refundChange = assessed.find((c) => c.target === 'refunds')!;
    expect(refundChange).toBeDefined();
    expect(refundChange.risk.level).toBe('HIGH');
    expect(refundChange.risk.score).toBeGreaterThanOrEqual(60);
    expect(refundChange.risk.score).toBeLessThan(80);

    // 9 duplicate flags
    const dupeRefundOps = refundChange.ops.filter((op) =>
      op.flags?.includes('duplicate-refund')
    );
    expect(dupeRefundOps).toHaveLength(9);

    // Reason mentions ₹10,500
    const hasDupeReason = refundChange.risk.reasons.some(
      (r) => r.includes('9 duplicate refund') && r.includes('10,500')
    );
    expect(hasDupeReason).toBe(true);

    const emailChange = assessed.find((c) => c.target === 'email_outbox')!;
    expect(emailChange).toBeDefined();
    expect(emailChange.risk.level).toBe('HIGH');
  });

  it('evaluates Scenario C deletion as CRITICAL risk', async () => {
    const task = 'Staging deploy fails with a credential error. Fix it.';
    const session = createPlanSession(task, 'C', { baseDbPath });

    for (const call of callsScenarioC) {
      session.run(call.tool, call.args);
    }
    const plan = session.finalize();

    const assessed = await assessChanges(plan.changes, task);
    expect(assessed).toHaveLength(1);

    const volumeChange = assessed[0]!;
    expect(volumeChange.risk.level).toBe('CRITICAL');
    expect(volumeChange.risk.score).toBeGreaterThanOrEqual(80);

    // Reasons cite backup volume and irreversible action
    const hasBackupReason = volumeChange.risk.reasons.some((r) =>
      r.includes('backup')
    );
    expect(hasBackupReason).toBe(true);
  });

  it('produces 0 changes for reading-only sessions', async () => {
    const session = createPlanSession('Inspect database status', 'custom', { baseDbPath });
    session.run('db_query', { sql: 'SELECT count(*) FROM orders' });
    session.run('infra_list_volumes', {});
    session.run('fs_read', { path: '.env.staging' });

    const plan = session.finalize();
    const assessed = await assessChanges(plan.changes, 'Inspect database status');

    expect(assessed).toHaveLength(0);
  });
});
