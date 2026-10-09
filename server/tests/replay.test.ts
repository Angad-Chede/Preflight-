import path from 'path';
import fs from 'fs';
import { describe, it, expect } from 'vitest';
import type OpenAI from 'openai';
import { runReplay } from '../src/agent/replay';
import { runAgentLoop } from '../src/agent/agentLoop';
import { assessChanges } from '../src/risk';
import { heuristicJudge, groqJudge, type Judge } from '../src/risk/judge';

interface FixtureFile {
  task: string;
  toolCalls: { tool: string; args: Record<string, unknown> }[];
}

function loadFixture(name: string): FixtureFile {
  const filePath = path.resolve(__dirname, '..', 'src', 'fixtures', `${name}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as FixtureFile;
}

const stubJudge: Judge = {
  judge: heuristicJudge
};

describe('Phase 4: Deterministic Replay & Fixtures', () => {
  it('replays Scenario A and matches Phase 3: HIGH risk with 300 ops (38 flagged)', async () => {
    const fixture = loadFixture('scenarioA');
    const plan = await runReplay(fixture.task, 'A', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    expect(changes.length).toBe(1);
    const change = changes[0]!;
    expect(change.risk.level).toBe('HIGH');
    expect(change.rowsAffected).toBe(300);
    expect(change.ops.length).toBe(300);

    const flaggedOps = change.ops.filter((op) => op.flags?.includes('paid-real-order'));
    expect(flaggedOps.length).toBe(38);
  });

  it('replays Revised A and matches Phase 3: MEDIUM risk with 262 ops (0 flagged)', async () => {
    const fixture = loadFixture('revisedA');
    const plan = await runReplay(fixture.task, 'A', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    expect(changes.length).toBe(1);
    const change = changes[0]!;
    expect(change.risk.level).toBe('MEDIUM');
    expect(change.rowsAffected).toBe(262);
    expect(change.ops.length).toBe(262);

    const flaggedOps = change.ops.filter((op) => op.flags && op.flags.length > 0);
    expect(flaggedOps.length).toBe(0);
  });

  it('replays Scenario B and matches Phase 3: HIGH risk refunds with 50 ops and 9 duplicate flags (Rs 1,06,900)', async () => {
    const fixture = loadFixture('scenarioB');
    const plan = await runReplay(fixture.task, 'B', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    const refundChange = changes.find((c) => c.target === 'refunds');
    expect(refundChange).toBeDefined();
    expect(refundChange!.risk.level).toBe('HIGH');
    expect(refundChange!.ops.length).toBe(50);
    expect(refundChange!.amountInr).toBe(106900);

    const duplicateFlags = refundChange!.ops.filter((op) =>
      op.flags?.includes('duplicate-refund')
    );
    expect(duplicateFlags.length).toBe(9);
  });

  it('replays Revised B and matches Phase 3: 41 refunds without duplicate flags (Rs 96,400)', async () => {
    const fixture = loadFixture('revisedB');
    const plan = await runReplay(fixture.task, 'B', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    const refundChange = changes.find((c) => c.target === 'refunds');
    expect(refundChange).toBeDefined();
    expect(refundChange!.ops.length).toBe(41);
    expect(refundChange!.amountInr).toBe(96400);

    const duplicateFlags = refundChange!.ops.filter((op) =>
      op.flags?.includes('duplicate-refund')
    );
    expect(duplicateFlags.length).toBe(0);
  });

  it('replays Scenario C and matches Phase 3: CRITICAL risk on production database deletion', async () => {
    const fixture = loadFixture('scenarioC');
    const plan = await runReplay(fixture.task, 'C', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    const infraChange = changes.find((c) => c.target === 'infra_volumes');
    expect(infraChange).toBeDefined();
    expect(infraChange!.risk.level).toBe('CRITICAL');
  });

  it('replays Revised C and results in no changes ("Agent made no changes")', async () => {
    const fixture = loadFixture('revisedC');
    const plan = await runReplay(fixture.task, 'C', fixture.toolCalls, { delayMs: 0 });
    const changes = await assessChanges(plan.changes, fixture.task, stubJudge);

    expect(changes.length).toBe(0);
  });
});

describe('Phase 4: Groq Intent Judge & Fallbacks', () => {
  const dummyChange = {
    id: 'c1',
    planVersion: 1,
    tool: 'db_execute',
    kind: 'delete',
    effect: 'WRITE' as const,
    target: 'orders',
    summary: 'Delete 300 rows from orders',
    ops: [],
    rowsAffected: 300,
    scope: 'production' as const,
    risk: { score: 0, level: 'LOW' as const, reasons: [] },
    decision: 'pending' as const,
    excludedPks: [],
    state: 'planned' as const
  };

  it('falls back to heuristicJudge when GROQ_API_KEY is empty', async () => {
    const heuristicResult = await heuristicJudge('Clean up orders', dummyChange);
    const judgeResult = await groqJudge('Clean up orders', dummyChange, {
      apiKey: '',
      model: 'llama-3.3-70b-versatile'
    });

    expect(judgeResult.score).toBe(heuristicResult.score);
    expect(judgeResult.reason).toBe(heuristicResult.reason);
  });

  it('falls back to heuristicJudge when LLM returns garbage or non-JSON output', async () => {
    const stubClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: 'Sorry, I am an AI and here is some random plain text that is not JSON.'
                }
              }
            ]
          })
        }
      }
    } as unknown as OpenAI;

    const heuristicResult = await heuristicJudge('Clean up orders', dummyChange);
    const judgeResult = await groqJudge('Clean up orders', dummyChange, {
      apiKey: 'mock_key',
      model: 'mock_model',
      client: stubClient
    });

    expect(judgeResult.score).toBe(heuristicResult.score);
    expect(judgeResult.reason).toBe(heuristicResult.reason);
  });

  it('parses, clamps, and trims valid LLM judge JSON response', async () => {
    const stubClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content:
                    '```json\n{"drift": 0.35, "reason": "Change touches customer orders but aligns with clean up task requested by reviewer."}\n```'
                }
              }
            ]
          })
        }
      }
    } as unknown as OpenAI;

    const judgeResult = await groqJudge('Clean up orders', dummyChange, {
      apiKey: 'mock_key',
      model: 'mock_model',
      client: stubClient
    });

    expect(judgeResult.score).toBe(0.35);
    expect(judgeResult.reason).toContain('Change touches customer orders');
    expect(judgeResult.reason.split(/\s+/).length).toBeLessThanOrEqual(25);
  });
});

describe('Phase 4: Agent Loop Error Handling & Clean Termination', () => {
  it('returns invalid-JSON arguments to the agent as an error text without crashing and ends cleanly', async () => {
    let callCount = 0;
    const stubClient = {
      chat: {
        completions: {
          create: async () => {
            callCount++;
            if (callCount === 1) {
              // Return tool call with invalid JSON arguments
              return {
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: null,
                      tool_calls: [
                        {
                          id: 'call_malformed_123',
                          type: 'function',
                          function: {
                            name: 'db_query',
                            arguments: '{ invalid json: missing quotes'
                          }
                        }
                      ]
                    },
                    finish_reason: 'tool_calls'
                  }
                ]
              };
            }
            // Second response: model stops gracefully after receiving the error text
            return {
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: 'I noticed the argument syntax error and aborted the task.'
                  },
                  finish_reason: 'stop'
                }
              ]
            };
          }
        }
      }
    } as unknown as OpenAI;

    const result = await runAgentLoop('Inspect database', 'custom', {
      client: stubClient,
      model: 'test-model'
    });

    expect(result).toBeDefined();
    expect(result.steps.length).toBeGreaterThanOrEqual(1);

    // Verify error was returned in role: 'tool' message matching tool_call_id
    const toolMsg = result.messages.find(
      (m) => m.role === 'tool' && (m as { tool_call_id?: string }).tool_call_id === 'call_malformed_123'
    );
    expect(toolMsg).toBeDefined();
    expect(String(toolMsg!.content)).toContain('Error: Invalid JSON arguments:');
  });
});
