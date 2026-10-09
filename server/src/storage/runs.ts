import fs from 'fs';
import path from 'path';
import type { Run } from '@preflight/shared';

export function getBaseDbPath(): string {
  const rootPath = path.resolve(process.cwd(), 'server', 'data', 'base.db');
  if (fs.existsSync(rootPath)) {
    return rootPath;
  }
  return path.resolve(process.cwd(), 'data', 'base.db');
}

export function getSnapshotsDir(): string {
  const dir = fs.existsSync(path.resolve(process.cwd(), 'server'))
    ? path.resolve(process.cwd(), 'server', 'snapshots')
    : path.resolve(process.cwd(), 'snapshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getRunsDir(): string {
  const dir = fs.existsSync(path.resolve(process.cwd(), 'server'))
    ? path.resolve(process.cwd(), 'server', 'runs')
    : path.resolve(process.cwd(), 'runs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveRun(run: Run): void {
  const runsDir = getRunsDir();
  const filePath = path.join(runsDir, `${run.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf-8');
}

export function getRun(runId: string): Run | null {
  const runsDir = getRunsDir();
  const filePath = path.join(runsDir, `${runId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as Run;
  } catch {
    return null;
  }
}

export function listRuns(): Run[] {
  const runsDir = getRunsDir();
  if (!fs.existsSync(runsDir)) {
    return [];
  }
  const files = fs.readdirSync(runsDir).filter((f) => f.endsWith('.json'));
  const runs: Run[] = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(runsDir, file), 'utf-8');
      runs.push(JSON.parse(content) as Run);
    } catch {
      // ignore corrupt files
    }
  }
  return runs;
}
