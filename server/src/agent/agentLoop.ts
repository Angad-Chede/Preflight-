import fs from 'fs';
import path from 'path';
import type OpenAI from 'openai';
import type { Step } from '@preflight/shared';
import { createPlanSession, type PlanSession, type PlanSessionResult } from '../executor/planExecutor';
import { toOpenAITools } from '../tools/manifest';
import { buildSystemPrompt } from './prompts';
import { createOpenAIClient, chatCompletionWithRetry } from './llm';

export interface AgentLoopOptions {
  notes?: string;
  baseDbPath?: string;
  planVersion?: number;
  client?: OpenAI;
  model?: string;
  onStep?: (step: Step) => void;
}

export interface AgentLoopResult extends PlanSessionResult {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
}

export async function runAgentLoop(
  task: string,
  scenario: 'A' | 'B' | 'C' | 'custom',
  options?: AgentLoopOptions
): Promise<AgentLoopResult> {
  const client = options?.client || createOpenAIClient();
  const session: PlanSession = createPlanSession(task, scenario, {
    baseDbPath: options?.baseDbPath,
    planVersion: options?.planVersion ?? 1
  });

  const tools = toOpenAITools();
  const recordedCalls: { tool: string; args: Record<string, unknown> }[] = [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(options?.notes) },
    { role: 'user', content: task }
  ];

  let stepCount = 0;
  const maxSteps = 10;
  let lastCallSignature = '';
  let repeatCount = 0;

  try {
    while (stepCount < maxSteps) {
      const response = await chatCompletionWithRetry(
        client,
        {
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0
        },
        { model: options?.model }
      );

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        break;
      }

      const assistantMessage = choice.message;
      messages.push(assistantMessage);

      // Natural termination: model did not make tool calls
      if (
        choice.finish_reason === 'stop' ||
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        break;
      }

      let loopBroken = false;

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') {
          continue;
        }

        if (stepCount >= maxSteps) {
          loopBroken = true;
          break;
        }

        const toolName = toolCall.function.name;
        const rawArgs = toolCall.function.arguments;

        let parsedArgs: Record<string, unknown>;
        let toolResult: string;

        try {
          parsedArgs = JSON.parse(rawArgs || '{}');
        } catch (jsonErr: unknown) {
          const errMsg =
            jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
          toolResult = `Error: Invalid JSON arguments: ${errMsg}`;
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult
          });
          session.recordFailedStep?.(toolName, { raw: rawArgs }, toolResult);
          const failedStep = session.getLastStep();
          if (failedStep && options?.onStep) {
            options.onStep(failedStep);
          }
          stepCount++;
          continue;
        }

        // Loop Guard: Detect 3 identical consecutive calls
        const signature = `${toolName}:${JSON.stringify(parsedArgs)}`;
        if (signature === lastCallSignature) {
          repeatCount++;
          if (repeatCount >= 3) {
            toolResult = 'Loop guard triggered: 3 identical calls detected in succession.';
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult
            });
            session.recordFailedStep?.(toolName, parsedArgs, toolResult);
            const guardStep = session.getLastStep();
            if (guardStep && options?.onStep) {
              options.onStep(guardStep);
            }
            loopBroken = true;
            break;
          }
        } else {
          lastCallSignature = signature;
          repeatCount = 1;
        }

        // Execute on in-memory shadow database
        toolResult = session.run(toolName, parsedArgs);
        recordedCalls.push({ tool: toolName, args: parsedArgs });
        const lastStep = session.getLastStep();
        if (lastStep && options?.onStep) {
          options.onStep(lastStep);
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult
        });

        stepCount++;
      }

      if (loopBroken) {
        break;
      }
    }

    const plan = session.finalize();

    // Optional record mode: RECORD=1 writes tool calls to disk
    if (process.env.RECORD === '1') {
      try {
        const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
        if (!fs.existsSync(fixturesDir)) {
          fs.mkdirSync(fixturesDir, { recursive: true });
        }
        const recordPath = path.join(fixturesDir, `recorded${scenario}.json`);
        fs.writeFileSync(
          recordPath,
          JSON.stringify({ task, toolCalls: recordedCalls }, null, 2)
        );
      } catch {
        // ignore recording write error
      }
    }

    return {
      ...plan,
      messages
    };
  } catch (err) {
    session.close();
    throw err;
  }
}
