import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import type { Run, Change, Pk } from '@preflight/shared';
import { MODE } from '../config';
import { hashDb } from '../db/hash';
import { seedDatabase } from '../db/seed';
import { snapshot, restore } from '../db/snapshot';
import { getBaseDbPath, getSnapshotsDir, getRun, saveRun } from '../storage/runs';
import { runAgentLoop } from '../agent/agentLoop';
import { runReplay } from '../agent/replay';
import { assessChanges } from '../risk';
import { createGroqJudge } from '../risk/judge';

type SseSubscriber = (event: string, data: unknown) => void;

class RunOrchestrator {
  private subscribers: Map<string, Set<SseSubscriber>> = new Map();

  public subscribe(runId: string, subscriber: SseSubscriber): () => void {
    if (!this.subscribers.has(runId)) {
      this.subscribers.set(runId, new Set());
    }
    const set = this.subscribers.get(runId)!;
    set.add(subscriber);

    return () => {
      set.delete(subscriber);
      if (set.size === 0) {
        this.subscribers.delete(runId);
      }
    };
  }

  public broadcast(runId: string, event: string, data: unknown): void {
    const set = this.subscribers.get(runId);
    if (set) {
      for (const subscriber of set) {
        try {
          subscriber(event, data);
        } catch {
          // ignore broken subscriber
        }
      }
    }
  }

  public getBaseHash(): string {
    const dbPath = getBaseDbPath();
    const db = new Database(dbPath, { readonly: true });
    try {
      return hashDb(db);
    } finally {
      db.close();
    }
  }

  public resetDatabase(): { ok: boolean; hash: string; customerCount: number; orderCount: number } {
    const dbPath = getBaseDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = new Database(dbPath);
    try {
      const seedResult = seedDatabase(db);
      const snapshotsDir = getSnapshotsDir();
      if (fs.existsSync(snapshotsDir)) {
        const files = fs.readdirSync(snapshotsDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(snapshotsDir, file));
          } catch {
            // ignore
          }
        }
      }
      return {
        ok: true,
        hash: seedResult.hash,
        customerCount: seedResult.customerCount,
        orderCount: seedResult.orderCount
      };
    } finally {
      db.close();
    }
  }

  private loadReplayFixture(
    scenario: 'A' | 'B' | 'C' | 'custom',
    isRevision: boolean
  ): { task: string; toolCalls: { tool: string; args: Record<string, unknown> }[] } {
    const fixturesDir = fs.existsSync(path.resolve(process.cwd(), 'server', 'src', 'fixtures'))
      ? path.resolve(process.cwd(), 'server', 'src', 'fixtures')
      : path.resolve(process.cwd(), 'src', 'fixtures');

    let fixtureName: string;
    if (isRevision) {
      if (scenario === 'B') fixtureName = 'revisedB.json';
      else if (scenario === 'C') fixtureName = 'revisedC.json';
      else fixtureName = 'revisedA.json';
    } else {
      if (scenario === 'B') fixtureName = 'scenarioB.json';
      else if (scenario === 'C') fixtureName = 'scenarioC.json';
      else fixtureName = 'scenarioA.json';
    }

    const filePath = path.join(fixturesDir, fixtureName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fixture file not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  public async startRun(
    task: string,
    scenario: 'A' | 'B' | 'C' | 'custom',
    mode?: 'live' | 'replay'
  ): Promise<string> {
    const runId = crypto.randomUUID();
    const activeMode = mode || (MODE as 'live' | 'replay');
    const baseHash = this.getBaseHash();

    const run: Run = {
      id: runId,
      task,
      scenario,
      mode: activeMode,
      planVersion: 1,
      status: 'running',
      steps: [],
      changes: [],
      hashes: {
        base: baseHash
      }
    };

    saveRun(run);

    // Launch async execution in background
    this.executeRunAsync(runId, false).catch((err) => {
      console.error(`[Orchestrator] Error executing run ${runId}:`, err);
    });

    return runId;
  }

  public async reviseRun(runId: string, notes: string): Promise<number> {
    const run = getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    const newVersion = run.planVersion + 1;
    run.planVersion = newVersion;
    run.notes = notes;
    run.status = 'running';
    saveRun(run);

    // Launch async revision execution in background
    this.executeRunAsync(runId, true).catch((err) => {
      console.error(`[Orchestrator] Error executing revision for run ${runId}:`, err);
    });

    return newVersion;
  }

  private async executeRunAsync(runId: string, isRevision: boolean): Promise<void> {
    const run = getRun(runId);
    if (!run) return;

    const delayMs = process.env.NODE_ENV === 'test' ? 0 : 250;
    const baseDbPath = getBaseDbPath();

    try {
      let planResult;

      if (run.mode === 'live') {
        planResult = await runAgentLoop(run.task, run.scenario, {
          notes: run.notes,
          planVersion: run.planVersion,
          baseDbPath,
          onStep: (step) => {
            this.broadcast(runId, 'step', step);
          }
        });
      } else {
        const fixture = this.loadReplayFixture(run.scenario, isRevision);
        planResult = await runReplay(run.task, run.scenario, fixture.toolCalls, {
          planVersion: run.planVersion,
          baseDbPath,
          delayMs,
          onStep: (step) => {
            this.broadcast(runId, 'step', step);
          }
        });
      }

      // Assess risk & intent drift on all proposed changes
      const assessedChanges = await assessChanges(
        planResult.changes,
        run.task,
        createGroqJudge()
      );

      // Re-read latest state to prevent race overwrites
      const latestRun = getRun(runId) || run;
      latestRun.steps = planResult.steps;
      latestRun.changes = assessedChanges;
      latestRun.status = 'planned';
      latestRun.hashes.base = planResult.baseHash;
      saveRun(latestRun);

      this.broadcast(runId, 'plan_ready', {
        planVersion: latestRun.planVersion,
        changesCount: latestRun.changes.length
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const latestRun = getRun(runId) || run;
      latestRun.status = 'failed';
      saveRun(latestRun);

      this.broadcast(runId, 'error', { message });
    }
  }

  public recordDecision(
    runId: string,
    changeId: string,
    decision: 'pending' | 'approved' | 'rejected',
    excludedPks?: Pk[],
    confirmText?: string
  ): Change {
    const run = getRun(runId);
    if (!run) {
      const err = new Error('Run not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const change = run.changes.find((c) => c.id === changeId);
    if (!change) {
      const err = new Error('Change not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // Enforce CRITICAL confirmText rule
    if (change.risk.level === 'CRITICAL' && decision === 'approved') {
      if (confirmText !== 'I ACCEPT THE RISK') {
        const err = new Error("CRITICAL changes require confirmText: 'I ACCEPT THE RISK'");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }
    }

    change.decision = decision;
    if (excludedPks !== undefined) {
      change.excludedPks = excludedPks;
    }

    saveRun(run);
    return change;
  }

  public applyRun(runId: string): {
    hashes: { base: string; afterApply: string };
    applied: number;
  } {
    const run = getRun(runId);
    if (!run) {
      const err = new Error('Run not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (run.status === 'applied') {
      const err = new Error('Run is already applied');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const baseDbPath = getBaseDbPath();
    const snapshotsDir = getSnapshotsDir();

    // 1. Snapshot base database before applying
    snapshot(run.id, { baseDbPath, snapshotsDir });

    const approvedChanges = run.changes.filter((c) => c.decision === 'approved');
    let appliedCount = 0;

    const db = new Database(baseDbPath);
    try {
      // 2. Execute all operations in a single atomic database transaction
      const txn = db.transaction(() => {
        for (const change of approvedChanges) {
          for (const op of change.ops) {
            // Skip explicitly excluded primary keys
            if (change.excludedPks && change.excludedPks.includes(op.pk)) {
              continue;
            }

            if (op.op === 'delete') {
              db.prepare(`DELETE FROM "${op.table}" WHERE id = ?`).run(op.pk);
              appliedCount++;
            } else if (op.op === 'insert') {
              if (!op.after) continue;
              const cols = Object.keys(op.after);
              const placeholders = cols.map(() => '?').join(', ');
              const vals = cols.map((c) => op.after![c]);
              db.prepare(
                `INSERT INTO "${op.table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`
              ).run(...vals);
              appliedCount++;
            } else if (op.op === 'update') {
              if (!op.after) continue;
              const cols = Object.keys(op.after).filter((c) => c !== 'id');
              const sets = cols.map((c) => `"${c}" = ?`).join(', ');
              const vals = cols.map((c) => op.after![c]);
              db.prepare(`UPDATE "${op.table}" SET ${sets} WHERE id = ?`).run(...vals, op.pk);
              appliedCount++;
            }
          }
          change.state = 'applied';
        }
      });

      txn();

      // 3. Compute afterApply hash
      const afterApply = hashDb(db);
      db.close();

      run.hashes.afterApply = afterApply;
      run.status = 'applied';
      saveRun(run);

      return {
        hashes: {
          base: run.hashes.base,
          afterApply
        },
        applied: appliedCount
      };
    } catch (err) {
      db.close();
      // On any transaction failure, rollback snapshot
      try {
        restore(run.id, { baseDbPath, snapshotsDir });
      } catch {
        // ignore restore error
      }
      throw err;
    }
  }

  public undoRun(runId: string): {
    hashes: { base: string; afterUndo: string };
    match: boolean;
  } {
    const run = getRun(runId);
    if (!run) {
      const err = new Error('Run not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const baseDbPath = getBaseDbPath();
    const snapshotsDir = getSnapshotsDir();

    // 1. Restore base database from snapshot
    restore(run.id, { baseDbPath, snapshotsDir });

    // 2. Open restored base DB and verify hash equality
    const db = new Database(baseDbPath, { readonly: true });
    let afterUndo: string;
    try {
      afterUndo = hashDb(db);
    } finally {
      db.close();
    }

    const match = afterUndo === run.hashes.base;
    run.hashes.afterUndo = afterUndo;
    run.status = 'undone';
    for (const change of run.changes) {
      if (change.state === 'applied') {
        change.state = 'undone';
      }
    }
    saveRun(run);

    return {
      hashes: {
        base: run.hashes.base,
        afterUndo
      },
      match
    };
  }
}

export const orchestrator = new RunOrchestrator();
