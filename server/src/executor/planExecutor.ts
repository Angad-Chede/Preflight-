import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import type { Step, RowOp, Change } from '@preflight/shared';
import { createShadow } from '../db/shadow';
import { hashDb } from '../db/hash';
import { toolsImpl } from '../tools/impl';
import { readState, diffStates } from './diff';
import { collapseOps } from './collapse';
import { groupOpsIntoChanges } from './group';

export interface PlanSessionOptions {
  baseDbPath?: string;
  planVersion?: number;
}

export interface PlanSessionResult {
  steps: Step[];
  ops: RowOp[];
  changes: Change[];
  baseHash: string;
}

export interface PlanSession {
  run(name: string, args: unknown): string;
  finalize(): PlanSessionResult;
  close(): void;
  getShadowDb(): Database.Database;
}

const READ_TOOLS = new Set(['db_query', 'fs_read', 'infra_list_volumes']);

/**
 * Creates an isolated plan session executing tool calls purely against an in-memory shadow database copy.
 */
export function createPlanSession(
  _task: string,
  _scenario: string,
  options?: PlanSessionOptions
): PlanSession {
  const defaultBaseDir = fs.existsSync(path.resolve(process.cwd(), 'server', 'data', 'base.db'))
    ? path.resolve(process.cwd(), 'server', 'data', 'base.db')
    : path.resolve(process.cwd(), 'data', 'base.db');
  const baseDbPath = options?.baseDbPath || defaultBaseDir;
  const planVersion = options?.planVersion ?? 1;

  // 1. Verify and hash base database
  const baseDb = new Database(baseDbPath, { readonly: true });
  let initialBaseHash: string;
  try {
    initialBaseHash = hashDb(baseDb);
  } finally {
    baseDb.close();
  }

  // 2. Initialize in-memory shadow copy
  const shadowDb = createShadow(baseDbPath);

  const steps: Step[] = [];
  const rawOps: RowOp[] = [];
  const stepToolMap = new Map<number, string>();
  let currentStep = 1;
  let isClosed = false;

  return {
    getShadowDb() {
      return shadowDb;
    },

    run(name: string, args: unknown): string {
      if (isClosed) {
        throw new Error('PlanSession is closed');
      }

      const handler = (toolsImpl as Record<string, (db: Database.Database, a: unknown) => string>)[name];
      if (!handler) {
        const errorMsg = `Tool not found: ${name}`;
        steps.push({
          n: currentStep,
          tool: name,
          args,
          result: errorMsg,
          changeIds: [],
          ts: Date.now()
        });
        currentStep++;
        return errorMsg;
      }

      stepToolMap.set(currentStep, name);

      let result: string;
      const isMutating = !READ_TOOLS.has(name);

      if (isMutating) {
        const before = readState(shadowDb);
        result = handler(shadowDb, args);
        const after = readState(shadowDb);
        const stepOps = diffStates(before, after, currentStep);
        rawOps.push(...stepOps);
      } else {
        result = handler(shadowDb, args);
      }

      steps.push({
        n: currentStep,
        tool: name,
        args,
        result,
        changeIds: [],
        ts: Date.now()
      });

      currentStep++;
      return result;
    },

    finalize(): PlanSessionResult {
      if (isClosed) {
        throw new Error('PlanSession already closed');
      }

      try {
        // Assert base hash is unchanged (R2 guarantee)
        const checkBase = new Database(baseDbPath, { readonly: true });
        let finalBaseHash: string;
        try {
          finalBaseHash = hashDb(checkBase);
        } finally {
          checkBase.close();
        }

        if (finalBaseHash !== initialBaseHash) {
          throw new Error(
            `Isolation violation: Base database hash changed! Initial: ${initialBaseHash}, Final: ${finalBaseHash}`
          );
        }

        // Collapse ops and group into Changes
        const collapsed = collapseOps(rawOps);
        const changes = groupOpsIntoChanges(collapsed, { planVersion, stepToolMap });

        // Link changeIds to steps
        for (const change of changes) {
          const stepSet = new Set(change.ops.map((op) => op.step));
          for (const step of steps) {
            if (stepSet.has(step.n) && !step.changeIds.includes(change.id)) {
              step.changeIds.push(change.id);
            }
          }
        }

        return {
          steps,
          ops: collapsed,
          changes,
          baseHash: initialBaseHash
        };
      } finally {
        this.close();
      }
    },

    close() {
      if (!isClosed) {
        isClosed = true;
        try {
          shadowDb.close();
        } catch {
          // ignore already closed
        }
      }
    }
  };
}
