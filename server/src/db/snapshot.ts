import fs from 'fs';
import path from 'path';

export interface SnapshotOptions {
  baseDbPath?: string;
  snapshotsDir?: string;
}

function getDefaultPaths(options?: SnapshotOptions) {
  const baseDbPath = options?.baseDbPath || path.resolve(process.cwd(), 'data', 'base.db');
  const snapshotsDir = options?.snapshotsDir || path.resolve(process.cwd(), 'snapshots');
  return { baseDbPath, snapshotsDir };
}

/**
 * Creates a snapshot file of the base database for the given runId.
 */
export function snapshot(runId: string, options?: SnapshotOptions): string {
  const { baseDbPath, snapshotsDir } = getDefaultPaths(options);

  if (!fs.existsSync(baseDbPath)) {
    throw new Error(`Cannot snapshot: base DB not found at ${baseDbPath}`);
  }

  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  const snapshotPath = path.join(snapshotsDir, `${runId}.db`);
  fs.copyFileSync(baseDbPath, snapshotPath);
  return snapshotPath;
}

/**
 * Restores the base database from the snapshot corresponding to runId.
 */
export function restore(runId: string, options?: SnapshotOptions): string {
  const { baseDbPath, snapshotsDir } = getDefaultPaths(options);
  const snapshotPath = path.join(snapshotsDir, `${runId}.db`);

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Cannot restore: snapshot not found at ${snapshotPath}`);
  }

  const baseDir = path.dirname(baseDbPath);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  fs.copyFileSync(snapshotPath, baseDbPath);
  return baseDbPath;
}
