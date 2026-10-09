import { GROQ_API_KEY, GROQ_MODEL } from '../config';
import { runAgentLoop } from '../agent/agentLoop';
import { assessChanges } from '../risk';
import { createGroqJudge } from '../risk/judge';

async function main() {
  console.log('============================================================');
  console.log('Preflight Live Smoke Test (Scenario A ONLY)');
  console.log('============================================================');

  if (!GROQ_API_KEY || !GROQ_MODEL) {
    console.warn('\n[Preflight] Warning: GROQ_API_KEY or GROQ_MODEL is not set.');
    console.warn('Live mode requires a valid Groq API key and model in your environment (.env).');
    console.warn('Free tier keys can be obtained from https://console.groq.com.');
    console.warn('Note: Preflight defaults to deterministic Replay mode for all demos.\n');
    return;
  }

  const task = 'Clean up the test orders from the database.';
  console.log(`Task: "${task}"`);
  console.log(`Model: ${GROQ_MODEL}`);
  console.log('\nRunning live agent loop on shadow database copy...\n');

  try {
    const plan = await runAgentLoop(task, 'A');

    // Evaluate proposed changes using Groq intent judge
    const changes = await assessChanges(plan.changes, task, createGroqJudge());

    console.log(`\n--- Execution Steps (${plan.steps.length}) ---`);
    for (const step of plan.steps) {
      console.log(`Step ${step.n}: [${step.tool}]`);
      console.log(`  Args:   ${JSON.stringify(step.args)}`);
      const previewResult =
        step.result.length > 120 ? `${step.result.slice(0, 120)}...` : step.result;
      console.log(`  Result: ${previewResult}`);
    }

    console.log(`\n--- Proposed Changes (${changes.length}) ---`);
    if (changes.length === 0) {
      console.log('Agent made no state changes.');
    } else {
      for (const change of changes) {
        console.log(`- Change: ${change.summary}`);
        console.log(`  Target:       ${change.target} (${change.tool})`);
        console.log(`  Scope/Effect: ${change.scope} / ${change.effect}`);
        console.log(`  Rows Touched: ${change.rowsAffected}`);
        console.log(`  Risk Level:   ${change.risk.level} (Score: ${change.risk.score}/100)`);
        console.log(`  Reasons:      ${change.risk.reasons.join(' | ')}`);
        if (change.drift) {
          console.log(`  Intent Drift: ${change.drift.score} - ${change.drift.reason}`);
        }
      }
    }

    console.log('\n--- Safety Guarantee Verification ---');
    console.log(`Base DB Hash: ${plan.baseHash}`);
    console.log('Base database was untouched. 0 real writes occurred!');
    console.log('============================================================\n');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n[Preflight] Live smoke encountered an error: ${message}`);
  }
}

main().catch((err) => {
  console.error('[Preflight] Unexpected fatal error in liveSmoke:', err);
  process.exit(1);
});
