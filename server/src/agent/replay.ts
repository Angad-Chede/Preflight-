import type { Step } from '@preflight/shared';
import { createPlanSession, type PlanSessionResult } from '../executor/planExecutor';

export interface ToolCallItem {
  tool: string;
  args: Record<string, unknown>;
}

export interface ReplayOptions {
  baseDbPath?: string;
  planVersion?: number;
  delayMs?: number;
  onStep?: (step: Step) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Replays a sequence of recorded tool calls through the plan executor session.
 * Uses a default 250ms delay between steps to allow UI animation.
 */
export async function runReplay(
  task: string,
  scenario: 'A' | 'B' | 'C' | 'custom',
  toolCalls: ToolCallItem[],
  options?: ReplayOptions
): Promise<PlanSessionResult> {
  const session = createPlanSession(task, scenario, {
    baseDbPath: options?.baseDbPath,
    planVersion: options?.planVersion ?? 1
  });

  const delayMs = options?.delayMs ?? 250;

  try {
    for (const call of toolCalls) {
      if (delayMs > 0) {
        await sleep(delayMs);
      }
      session.run(call.tool, call.args);
      const lastStep = session.getLastStep();
      if (lastStep && options?.onStep) {
        options.onStep(lastStep);
      }
    }

    const plan = session.finalize();
    return plan;
  } catch (err) {
    session.close();
    throw err;
  }
}
