import OpenAI from 'openai';
import { LLM_BASE_URL, GROQ_API_KEY, GROQ_MODEL } from '../config';

export class LlmError extends Error {
  constructor(message: string = 'LLM rate-limited. Switch to Replay.') {
    super(message);
    this.name = 'LlmError';
  }
}

export function createOpenAIClient(apiKey?: string, baseURL?: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey || GROQ_API_KEY || 'missing_key',
    baseURL: baseURL || LLM_BASE_URL
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chatCompletionWithRetry(
  client: OpenAI,
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, 'model'> & { model?: string },
  options?: { model?: string }
): Promise<OpenAI.Chat.ChatCompletion> {
  const model = options?.model || params.model || GROQ_MODEL;
  if (!model) {
    throw new LlmError('GROQ_MODEL is not configured. Set GROQ_MODEL in your environment.');
  }

  const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    ...params,
    model
  };

  let rateLimitTries = 0;
  let toolUseFailedTries = 0;

  while (true) {
    try {
      const response = await client.chat.completions.create(requestParams);
      return response;
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        code?: string;
        error?: { code?: string; message?: string };
        headers?: Record<string, string> & { get?: (name: string) => string | null };
        message?: string;
      };

      const status = error.status;
      const errorCode = error.code || error.error?.code;

      // HTTP 429 Rate Limit
      if (status === 429) {
        rateLimitTries++;
        if (rateLimitTries > 3) {
          throw new LlmError('LLM rate-limited. Switch to Replay.');
        }

        let delayMs = Math.pow(2, rateLimitTries) * 1000; // 2s, 4s, 8s
        const retryAfterHeader =
          typeof error.headers?.get === 'function'
            ? error.headers.get('retry-after')
            : (error.headers?.['retry-after'] || error.headers?.['Retry-After']);
        if (retryAfterHeader) {
          const parsed = parseFloat(retryAfterHeader);
          if (!isNaN(parsed) && parsed > 0) {
            delayMs = Math.round(parsed * 1000);
          }
        }

        await sleep(delayMs);
        continue;
      }

      // HTTP 400 with tool_use_failed
      if (
        status === 400 &&
        (errorCode === 'tool_use_failed' ||
          (error.message && error.message.includes('tool_use_failed')))
      ) {
        toolUseFailedTries++;
        if (toolUseFailedTries > 1) {
          throw new LlmError('LLM rate-limited. Switch to Replay.');
        }
        await sleep(1000);
        continue;
      }

      // Check if general rate limit or quota exceeded
      if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
        throw new LlmError('LLM rate-limited. Switch to Replay.');
      }

      throw err;
    }
  }
}
