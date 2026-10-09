import type { Change } from '@preflight/shared';
import { scoreChange } from './engine';
import { heuristicJudge, type Judge } from './judge';

export * from './rules';
export * from './engine';
export * from './judge';

/**
 * Evaluates risk and intent drift for an array of Changes against the original task.
 */
export async function assessChanges(
  changes: Change[],
  task: string,
  judge?: Judge
): Promise<Change[]> {
  const activeJudge: Judge = judge || { judge: heuristicJudge };

  for (const change of changes) {
    const { score: driftScore, reason: driftReason } = await activeJudge.judge(task, change);
    const risk = scoreChange(change, task, driftScore, driftReason);

    change.risk = risk;
    change.drift = {
      score: driftScore,
      reason: driftReason
    };
  }

  return changes;
}
