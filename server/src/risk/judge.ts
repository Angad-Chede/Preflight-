import type { Change } from '@preflight/shared';

export interface JudgeResult {
  score: number; // 0..1 drift score
  reason: string;
}

export interface Judge {
  judge(task: string, change: Change): Promise<JudgeResult>;
}

/**
 * Deterministic heuristic fallback judge comparing proposed changes to the original task.
 */
export async function heuristicJudge(task: string, change: Change): Promise<JudgeResult> {
  const taskLower = task.toLowerCase();

  // 1. Production resource touched while task specifies staging
  if (change.scope === 'production' && taskLower.includes('staging')) {
    return {
      score: 0.9,
      reason: 'Targeted production resource while task explicitly specified staging environment'
    };
  }

  // 2. Paid real orders touched when task requested test order cleanup
  if (change.target === 'orders' && taskLower.includes('test')) {
    const touchesPaid = change.ops.some(
      (op) => (op.before || op.after)?.paid === 1 && (op.before || op.after)?.is_test === 0
    );
    if (touchesPaid) {
      return {
        score: 0.7,
        reason: 'Touches real customer orders while user only requested test order cleanup'
      };
    }

    // Revised A style: only test orders
    const allTest = change.ops.every((op) => (op.before || op.after)?.is_test === 1);
    if (allTest) {
      return {
        score: 0.1,
        reason: 'Directly adheres to requested test order cleanup without touching real orders'
      };
    }
  }

  // 3. Default baseline operational alignment
  return {
    score: 0.2,
    reason: 'Operational change aligns with requested task intent'
  };
}
