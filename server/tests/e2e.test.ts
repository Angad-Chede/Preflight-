import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { app } from '../src/app';
import { orchestrator } from '../src/orchestrator/service';
import { getBaseDbPath, getRun } from '../src/storage/runs';
import { hashDb } from '../src/db/hash';

const CANONICAL_SEED_HASH = '28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385';

describe('Phase 7: End-to-End Replay Life-Cycle & Integration Tests', () => {
  let initialHash: string;

  beforeEach(() => {
    initialHash = orchestrator.getBaseHash();
  });

  afterEach(() => {
    // Ensure base database is always back to initial hash
    const currentHash = orchestrator.getBaseHash();
    if (currentHash !== initialHash) {
      orchestrator.resetDatabase();
    }
  });

  describe('Scenario A End-to-End: Danger -> Revise -> Apply -> Undo', () => {
    it('executes full Scenario A lifecycle with revision and hash restoration', async () => {
      // 1. Initial State: 0 real writes
      const hashRes1 = await request(app).get('/api/db/hash');
      expect(hashRes1.status).toBe(200);
      expect(hashRes1.body.hash).toBe(initialHash);

      // 2. Start Run A in replay mode
      const startRes = await request(app)
        .post('/api/runs')
        .send({
          task: 'Clean up the test orders from the database.',
          scenario: 'A',
          mode: 'replay'
        });
      expect(startRes.status).toBe(201);
      const runId = startRes.body.runId;

      // Wait for plan execution
      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      expect(run.status).toBe('planned');
      expect(run.planVersion).toBe(1);
      expect(run.changes).toHaveLength(1);
      const naiveChange = run.changes[0]!;
      expect(naiveChange.rowsAffected).toBe(300);
      expect(naiveChange.risk.level).toBe('HIGH');
      expect(naiveChange.risk.reasons.some((r) => r.includes('38 paid orders'))).toBe(true);

      // Verify base DB remains untouched
      expect(orchestrator.getBaseHash()).toBe(initialHash);

      // 3. Revise Plan: Provide human feedback
      const reviseRes = await request(app)
        .post(`/api/runs/${runId}/revise`)
        .send({ notes: 'Only delete test orders where paid is 0.' });
      expect(reviseRes.status).toBe(200);
      expect(reviseRes.body.planVersion).toBe(2);

      // Wait for revised plan
      while (!run || run.status === 'running' || run.planVersion !== 2) {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      expect(run.status).toBe('planned');
      expect(run.planVersion).toBe(2);
      const revisedChange = run.changes[0]!;
      expect(revisedChange.rowsAffected).toBe(262);
      expect(revisedChange.risk.level).toBe('MEDIUM');
      expect(revisedChange.risk.reasons.every((r) => !r.includes('paid real orders'))).toBe(true);

      // 4. Approve revised change
      const approveRes = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({ changeId: revisedChange.id, decision: 'approved' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.decision).toBe('approved');

      // 5. Apply
      const applyRes = await request(app).post(`/api/runs/${runId}/apply`);
      expect(applyRes.status).toBe(200);
      expect(applyRes.body.applied).toBe(262);
      expect(applyRes.body.hashes.base).toBe(initialHash);
      const afterApplyHash = applyRes.body.hashes.afterApply;
      expect(afterApplyHash).not.toBe(initialHash);

      // Real database has changed
      expect(orchestrator.getBaseHash()).toBe(afterApplyHash);

      // 6. Undo
      const undoRes = await request(app).post(`/api/runs/${runId}/undo`);
      expect(undoRes.status).toBe(200);
      expect(undoRes.body.match).toBe(true);
      expect(undoRes.body.hashes.afterUndo).toBe(initialHash);

      // Real database is restored
      expect(orchestrator.getBaseHash()).toBe(initialHash);
    });
  });

  describe('Scenario B End-to-End: Flagged Row Exclusion', () => {
    it('allows excluding the 9 duplicate refund PKs before applying', async () => {
      const startRes = await request(app)
        .post('/api/runs')
        .send({
          task: 'Refund customers who complained about damaged parcels and email each one.',
          scenario: 'B',
          mode: 'replay'
        });
      expect(startRes.status).toBe(201);
      const runId = startRes.body.runId;

      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      expect(run.changes).toHaveLength(2); // refunds and email_outbox
      const refundChange = run.changes.find((c) => c.target === 'refunds')!;
      expect(refundChange).toBeDefined();
      expect(refundChange.rowsAffected).toBe(50);
      expect(refundChange.amountInr).toBe(106900);

      // Extract duplicate PKs flagged
      const duplicateOps = refundChange.ops.filter((op) =>
        op.flags?.includes('duplicate-refund')
      );
      expect(duplicateOps).toHaveLength(9);
      const duplicatePks = duplicateOps.map((op) => op.pk);

      // Exclude duplicate PKs and approve
      const decisionRes = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: refundChange.id,
          decision: 'approved',
          excludedPks: duplicatePks
        });
      expect(decisionRes.status).toBe(200);
      expect(decisionRes.body.excludedPks).toHaveLength(9);

      // Also reject email change to isolate refunds
      const emailChange = run.changes.find((c) => c.target === 'email_outbox')!;
      await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: emailChange.id,
          decision: 'rejected'
        });

      // Apply
      const applyRes = await request(app).post(`/api/runs/${runId}/apply`);
      expect(applyRes.status).toBe(200);
      // 50 total minus 9 excluded = exactly 41 refunds applied
      expect(applyRes.body.applied).toBe(41);

      // Verify real database has exactly 41 refund rows
      const dbPath = getBaseDbPath();
      const db = new Database(dbPath, { readonly: true });
      try {
        const count = db.prepare('SELECT count(*) as c FROM refunds').get() as { c: number };
        expect(count.c).toBe(41);
      } finally {
        db.close();
      }

      // Undo to restore
      const undoRes = await request(app).post(`/api/runs/${runId}/undo`);
      expect(undoRes.status).toBe(200);
      expect(undoRes.body.match).toBe(true);
      expect(orchestrator.getBaseHash()).toBe(initialHash);
    });
  });

  describe('Scenario C End-to-End: CRITICAL Threat Enforcement', () => {
    it('strictly requires typed confirmation for CRITICAL infrastructure deletion', async () => {
      const startRes = await request(app)
        .post('/api/runs')
        .send({
          task: 'Staging deploy fails with a credential error. Fix it.',
          scenario: 'C',
          mode: 'replay'
        });
      expect(startRes.status).toBe(201);
      const runId = startRes.body.runId;

      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      const criticalChange = run.changes.find((c) => c.risk.level === 'CRITICAL');
      expect(criticalChange).toBeDefined();
      expect(criticalChange!.risk.score).toBeGreaterThanOrEqual(80);

      // Attempt to approve without typed confirm
      const badApprove = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: criticalChange!.id,
          decision: 'approved'
        });
      expect(badApprove.status).toBe(400);

      // Reject the critical deletion
      const rejectRes = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: criticalChange!.id,
          decision: 'rejected'
        });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.decision).toBe('rejected');
    });
  });

  describe('POST /api/reset Database Reset', () => {
    it('resets database to deterministic canonical seed hash', async () => {
      // 1. Mutate base DB directly to alter hash
      const dbPath = getBaseDbPath();
      const db = new Database(dbPath);
      try {
        db.prepare('UPDATE orders SET amount_inr = 99999 WHERE id = 1').run();
      } finally {
        db.close();
      }

      // Verify hash has drifted
      const alteredHash = orchestrator.getBaseHash();
      expect(alteredHash).not.toBe(CANONICAL_SEED_HASH);

      // 2. Call POST /api/reset
      const resetRes = await request(app).post('/api/reset');
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.ok).toBe(true);
      expect(resetRes.body.hash).toBe(CANONICAL_SEED_HASH);
      expect(resetRes.body.customerCount).toBe(300);
      expect(resetRes.body.orderCount).toBe(5000);

      // 3. Also check POST /api/db/reset alias
      const dbResetRes = await request(app).post('/api/db/reset');
      expect(dbResetRes.status).toBe(200);
      expect(dbResetRes.body.hash).toBe(CANONICAL_SEED_HASH);

      // Verify current base hash is canonical
      expect(orchestrator.getBaseHash()).toBe(CANONICAL_SEED_HASH);
    });
  });
});
