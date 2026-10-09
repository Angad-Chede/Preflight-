import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from '../src/db/seed';
import { hashDb } from '../src/db/hash';
import { createShadow } from '../src/db/shadow';
import { snapshot, restore } from '../src/db/snapshot';

describe('Shadow DB Isolation & Snapshot Round-Trip', () => {
  const testDir = path.resolve(__dirname, 'test-data');
  const baseDbPath = path.join(testDir, 'base.db');
  const snapshotsDir = path.join(testDir, 'snapshots');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error if locked
      }
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore on windows file lock
      }
    }
  });

  it('guarantees shadow DB isolation: writes to shadow do not change base hash', () => {
    const baseDb = new Database(baseDbPath);
    try {
      seedDatabase(baseDb);
      const initialBaseHash = hashDb(baseDb);

      // Create shadow from base database
      const shadowDb = createShadow(baseDb);
      try {
        const initialShadowHash = hashDb(shadowDb);
        expect(initialShadowHash).toBe(initialBaseHash);

        // Mutate shadow heavily
        shadowDb.prepare("DELETE FROM orders WHERE is_test = 1").run();
        shadowDb.prepare("INSERT INTO refunds (id, order_id, amount_inr, reason, status) VALUES (99999, 1, 1000, 'test', 'completed')").run();

        // Verify shadow changed
        const modifiedShadowHash = hashDb(shadowDb);
        expect(modifiedShadowHash).not.toBe(initialBaseHash);

        // Verify base is 100% UNCHANGED
        const currentBaseHash = hashDb(baseDb);
        expect(currentBaseHash).toBe(initialBaseHash);
      } finally {
        shadowDb.close();
      }
    } finally {
      baseDb.close();
    }
  });

  it('verifies snapshot -> mutate base -> restore -> hash equals original', () => {
    const baseDb = new Database(baseDbPath);
    let preApplyHash = '';
    try {
      seedDatabase(baseDb);
      preApplyHash = hashDb(baseDb);
    } finally {
      baseDb.close();
    }

    // Take snapshot for runId = 'test-run-1'
    const snapshotPath = snapshot('test-run-1', { baseDbPath, snapshotsDir });
    expect(fs.existsSync(snapshotPath)).toBe(true);

    // Mutate base database (delete test orders which have no foreign key dependencies)
    const mutatedDb = new Database(baseDbPath);
    try {
      mutatedDb.prepare("DELETE FROM orders WHERE is_test = 1").run();
      const mutatedHash = hashDb(mutatedDb);
      expect(mutatedHash).not.toBe(preApplyHash);
    } finally {
      mutatedDb.close();
    }

    // Restore snapshot
    restore('test-run-1', { baseDbPath, snapshotsDir });

    // Open restored base and assert hash equality
    const restoredDb = new Database(baseDbPath);
    try {
      const restoredHash = hashDb(restoredDb);
      expect(restoredHash).toBe(preApplyHash);
    } finally {
      restoredDb.close();
    }
  });
});
