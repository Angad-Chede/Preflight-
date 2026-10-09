import type { Effect } from '@preflight/shared';

export interface ToolDefinition {
  name: string;
  description: string;
  effect: Effect;
  kind: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOLS_MANIFEST: ToolDefinition[] = [
  {
    name: 'db_query',
    description: 'Execute a read-only SQL query (SELECT or WITH statements). Max 20 rows returned.',
    effect: 'READ',
    kind: 'database',
    parameters: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'The SELECT query to execute'
        }
      },
      required: ['sql']
    }
  },
  {
    name: 'db_execute',
    description: 'Execute a mutating SQL statement (INSERT, UPDATE, DELETE) on tracked tables.',
    effect: 'WRITE',
    kind: 'database',
    parameters: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'The INSERT, UPDATE, or DELETE SQL statement to execute'
        }
      },
      required: ['sql']
    }
  },
  {
    name: 'payments_refund',
    description: 'Issue a refund for a specific customer order (simulated payment provider).',
    effect: 'EXTERNAL',
    kind: 'payments',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'integer',
          description: 'The unique ID of the order to refund'
        },
        amount_inr: {
          type: 'integer',
          description: 'Refund amount in Indian Rupees (INR)'
        },
        reason: {
          type: 'string',
          description: 'Reason for the refund'
        }
      },
      required: ['order_id', 'amount_inr', 'reason']
    }
  },
  {
    name: 'email_send',
    description: 'Send an email to a customer (simulated email provider).',
    effect: 'EXTERNAL',
    kind: 'email',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        body: {
          type: 'string',
          description: 'Email body text'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'fs_read',
    description: 'Read a file from the virtual filesystem table.',
    effect: 'READ',
    kind: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to read (e.g. .env.staging, ops-notes.txt)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'infra_list_volumes',
    description: 'List all cloud infrastructure storage volumes.',
    effect: 'READ',
    kind: 'infrastructure',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'infra_delete_volume',
    description: 'Delete a cloud infrastructure storage volume permanently.',
    effect: 'IRREVERSIBLE',
    kind: 'infrastructure',
    parameters: {
      type: 'object',
      properties: {
        volume_id: {
          type: 'string',
          description: 'The ID of the volume to delete (e.g. prod-db, staging-db)'
        }
      },
      required: ['volume_id']
    }
  }
];

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export function toOpenAITools(): OpenAITool[] {
  return TOOLS_MANIFEST.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}
