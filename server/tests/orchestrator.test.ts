import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { app } from '../src/app';
import { orchestrator } from '../src/orchestrator/service';
import { getBaseDbPath, getRunsDir, getRun } from '../src/storage/runs';
import { hashDb } from '../src/db/hash';

describe('Phase 5: Orchestrator, Express Routes & Safety Guarantees', () => {
  let initialHash: string;

  beforeEach(() => {
    initialHash = orchestrator.getBaseHash();
  });

  afterEach(() => {
    // Ensure base database hash is always restored after each test
    const currentHash = orchestrator.getBaseHash();
    if (currentHash !== initialHash) {
      // Restore from base backup if any deviation happened
      const baseDbPath = getBaseDbPath();
      const backupPath = `${baseDbPath}.bak`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, baseDbPath);
      }
    }
  });

  describe('CRITICAL Confirm Rule', () => {
    it('rejects approving a CRITICAL change without exact confirmText', async () => {
      // Scenario C has a CRITICAL infrastructure deletion
      const res = await request(app)
        .post('/api/runs')
        .send({ task: 'Staging deploy fix', scenario: 'C', mode: 'replay' });

      expect(res.status).toBe(201);
      const runId = res.body.runId;

      // Wait for replay to complete
      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      const criticalChange = run.changes.find((c) => c.risk.level === 'CRITICAL');
      expect(criticalChange).toBeDefined();

      // 1. Approve without confirmText -> 400
      const rejectNoText = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: criticalChange!.id,
          decision: 'approved'
        });

      expect(rejectNoText.status).toBe(400);
      expect(rejectNoText.body.error).toContain("CRITICAL changes require confirmText: 'I ACCEPT THE RISK'");

      // 2. Approve with incorrect confirmText -> 400
      const rejectWrongText = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: criticalChange!.id,
          decision: 'approved',
          confirmText: 'I accept the risk'
        });

      expect(rejectWrongText.status).toBe(400);
      expect(rejectWrongText.body.error).toContain("CRITICAL changes require confirmText: 'I ACCEPT THE RISK'");

      // 3. Approve with exact confirmText -> 200
      const approveValid = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: criticalChange!.id,
          decision: 'approved',
          confirmText: 'I ACCEPT THE RISK'
        });

      expect(approveValid.status).toBe(200);
      expect(approveValid.body.decision).toBe('approved');
    });
  });

  describe('Exclusion of Primary Keys', () => {
    it('skips excluded primary keys during apply', async () => {
      const res = await request(app)
        .post('/api/runs')
        .send({ task: 'Clean test orders', scenario: 'A', mode: 'replay' });

      expect(res.status).toBe(201);
      const runId = res.body.runId;

      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      const change = run.changes[0]!;
      expect(change).toBeDefined();

      // Exclude two specific order IDs from deletion: e.g. pk 2 and pk 3
      const excludedPks = [2, 3];
      const decisionRes = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({
          changeId: change.id,
          decision: 'approved',
          excludedPks
        });

      expect(decisionRes.status).toBe(200);
      expect(decisionRes.body.excludedPks).toEqual([2, 3]);

      // Apply changes
      const applyRes = await request(app).post(`/api/runs/${runId}/apply`);
      expect(applyRes.status).toBe(200);

      // Verify directly against the SQLite base database
      const db = new Database(getBaseDbPath(), { readonly: true });
      try {
        const order2 = db.prepare('SELECT id FROM orders WHERE id = 2').get();
        const order3 = db.prepare('SELECT id FROM orders WHERE id = 3').get();
        // Both excluded orders MUST still exist in the base database!
        expect(order2).toBeDefined();
        expect(order3).toBeDefined();
      } finally {
        db.close();
      }

      // Undo changes to restore database back to initial state
      const undoRes = await request(app).post(`/api/runs/${runId}/undo`);
      expect(undoRes.status).toBe(200);
      expect(undoRes.body.match).toBe(true);

      const restoredHash = orchestrator.getBaseHash();
      expect(restoredHash).toBe(initialHash);
    });
  });

  describe('Atomic Transaction Rollback on Error', () => {
    it('rolls back completely if an error occurs during apply and preserves initial hash', async () => {
      const res = await request(app)
        .post('/api/runs')
        .send({ task: 'Clean test orders', scenario: 'A', mode: 'replay' });

      const runId = res.body.runId;
      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      const change = run.changes[0]!;
      // Intentionally inject an invalid table operation to trigger a SQL transaction error
      change.ops.push({
        table: 'non_existent_table',
        pk: 99999,
        op: 'delete',
        step: 99
      });
      change.decision = 'approved';
      // Save modified run to disk
      const runsDir = getRunsDir();
      fs.writeFileSync(path.join(runsDir, `${runId}.json`), JSON.stringify(run, null, 2));

      // Attempt to apply
      const applyRes = await request(app).post(`/api/runs/${runId}/apply`);
      expect(applyRes.status).toBe(500);

      // Verify base database hash was completely protected and rolled back!
      const finalHash = orchestrator.getBaseHash();
      expect(finalHash).toBe(initialHash);
    });
  });

  describe('Full End-to-End Replay Lifecycle with Persistence & SSE', () => {
    it('executes run, streams SSE, revises, approves, applies, and undoes with hash equality', async () => {
      // 1. Create run
      const createRes = await request(app)
        .post('/api/runs')
        .send({ task: 'Clean test orders', scenario: 'A', mode: 'replay' });

      expect(createRes.status).toBe(201);
      const runId = createRes.body.runId;

      // Wait for planned status
      let run = getRun(runId);
      while (!run || run.status === 'running') {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      expect(run.status).toBe('planned');
      expect(run.planVersion).toBe(1);
      expect(run.changes[0]!.risk.level).toBe('HIGH');

      // 2. Stream SSE events (replays all steps and plan_ready event)
      const streamRes = await request(app).get(`/api/runs/${runId}/stream`);
      expect(streamRes.status).toBe(200);
      expect(streamRes.headers['content-type']).toContain('text/event-stream');
      expect(streamRes.text).toContain('event: step');
      expect(streamRes.text).toContain('event: plan_ready');

      // 3. Revise run
      const reviseRes = await request(app)
        .post(`/api/runs/${runId}/revise`)
        .send({ notes: 'Only delete test orders with paid = 0' });

      expect(reviseRes.status).toBe(200);
      expect(reviseRes.body.planVersion).toBe(2);

      // Wait for revised plan to complete
      while (!run || run.status === 'running' || run.planVersion !== 2) {
        await new Promise((r) => setTimeout(r, 20));
        run = getRun(runId);
      }

      expect(run.status).toBe('planned');
      expect(run.changes[0]!.risk.level).toBe('MEDIUM');
      expect(run.changes[0]!.rowsAffected).toBe(262);

      // 4. Record decision
      const changeId = run.changes[0]!.id;
      const decisionRes = await request(app)
        .post(`/api/runs/${runId}/decisions`)
        .send({ changeId, decision: 'approved' });

      expect(decisionRes.status).toBe(200);
      expect(decisionRes.body.decision).toBe('approved');

      // 5. Apply
      const applyRes = await request(app).post(`/api/runs/${runId}/apply`);
      expect(applyRes.status).toBe(200);
      expect(applyRes.body.applied).toBe(262);
      expect(applyRes.body.hashes.base).toBe(initialHash);
      expect(applyRes.body.hashes.afterApply).not.toBe(initialHash);

      // 6. Undo
      const undoRes = await request(app).post(`/api/runs/${runId}/undo`);
      expect(undoRes.status).toBe(200);
      expect(undoRes.body.match).toBe(true);
      expect(undoRes.body.hashes.afterUndo).toBe(initialHash);

      // 7. Verify /api/db/hash endpoint returns identical original hash
      const hashRes = await request(app).get('/api/db/hash');
      expect(hashRes.status).toBe(200);
      expect(hashRes.body.hash).toBe(initialHash);

      // 8. Verify JSON persistence file exists
      const persistedFile = path.join(getRunsDir(), `${runId}.json`);
      expect(fs.existsSync(persistedFile)).toBe(true);
    });
  });
});
