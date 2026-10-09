import { z } from 'zod';
import type { Change } from '@preflight/shared';
import { GROQ_API_KEY, GROQ_MODEL, LLM_BASE_URL } from '../config';
import { createOpenAIClient } from '../agent/llm';

export interface JudgeResult {
  score: number; // 0..1 drift score
  reason: string;
}

export interface Judge {
  judge(task: string, change: Change): Promise<JudgeResult>;
}

const JudgeSchema = z.object({
  drift: z.number(),
  reason: z.string()
});

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

/**
 * Groq LLM Intent Judge with strict JSON parsing, Zod validation, 6s timeout,
 * and automatic fallback to heuristicJudge. Never blocks the plan.
 */
export async function groqJudge(
  task: string,
  change: Change,
  options?: { apiKey?: string; model?: string; client?: any }
): Promise<JudgeResult> {
  const apiKey = options?.apiKey ?? GROQ_API_KEY;
  const model = options?.model ?? GROQ_MODEL;

  // On missing key or unconfigured model, fall back to heuristic
  if (!apiKey || !model) {
    return heuristicJudge(task, change);
  }

  const client = options?.client || createOpenAIClient(apiKey, LLM_BASE_URL);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  const sampleRows = change.ops.slice(0, 5).map((op) => ({
    table: op.table,
    pk: op.pk,
    op: op.op,
    before: op.before,
    after: op.after
  }));

  try {
    const response = await client.chat.completions.create(
      {
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You review one proposed change made by an AI agent against the user\'s original task. Reply with JSON only: {"drift": number 0..1, "reason": string under 25 words}. drift 0 means the change is exactly what the task asked for; 1 means unrelated or far broader than asked. Be strict about production vs staging, real vs test data, and irreversible actions.'
          },
          {
            role: 'user',
            content: `TASK: ${task}\nCHANGE: ${change.summary}\nSAMPLE ROWS: ${JSON.stringify(sampleRows)}`
          }
        ]
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);

    const rawText = response.choices[0]?.message?.content || '';
    const match = rawText.match(/\{[\s\S]*?\}/);
    if (!match) {
      return heuristicJudge(task, change);
    }

    const parsed = JSON.parse(match[0]);
    const validated = JudgeSchema.safeParse(parsed);

    if (!validated.success) {
      return heuristicJudge(task, change);
    }

    const clampedDrift = Math.min(1, Math.max(0, validated.data.drift));
    const words = validated.data.reason.split(/\s+/).slice(0, 25).join(' ');

    return {
      score: clampedDrift,
      reason: words
    };
  } catch {
    clearTimeout(timer);
    return heuristicJudge(task, change);
  }
}

export function createGroqJudge(options?: { apiKey?: string; model?: string; client?: any }): Judge {
  return {
    judge: (task: string, change: Change) => groqJudge(task, change, options)
  };
}
