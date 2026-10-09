# Preflight Contracts

Single source of truth for shared types, data models, and API endpoints.

---

## 1. Shared Types (`shared/src/types.ts`)

```typescript
export type Row = Record<string, string | number | null>;
export type Pk = string | number;
export type Effect = 'READ' | 'WRITE' | 'EXTERNAL' | 'IRREVERSIBLE';
export type Level = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RowOp {
  table: string;
  pk: Pk;
  op: 'insert' | 'update' | 'delete';
  before?: Row;
  after?: Row;
  step: number;
  flags?: string[];
}

export interface Risk {
  score: number;
  level: Level;
  reasons: string[];
}

export interface Change {
  id: string;
  planVersion: number;
  tool: string;
  kind: string;
  effect: Effect;
  target: string;
  summary: string;
  ops: RowOp[];
  rowsAffected: number;
  amountInr?: number;
  recipients?: number;
  scope: 'staging' | 'production';
  risk: Risk;
  drift?: { score: number; reason: string };
  decision: 'pending' | 'approved' | 'rejected';
  excludedPks: Pk[];
  state: 'planned' | 'applied' | 'undone';
}

export interface Step {
  n: number;
  tool: string;
  args: unknown;
  result: string;
  changeIds: string[];
  ts: number;
}

export interface Run {
  id: string;
  task: string;
  scenario: 'A' | 'B' | 'C' | 'custom';
  mode: 'live' | 'replay';
  planVersion: number;
  status: 'running' | 'planned' | 'applied' | 'undone' | 'failed';
  steps: Step[];
  changes: Change[];
  notes?: string;
  hashes: {
    base: string;
    afterApply?: string;
    afterUndo?: string;
  };
}
```

---

## 2. API Endpoints Table (Port 3001)

| Endpoint | Method | Request Body | Response Body | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/api/runs` | `POST` | `{ task: string, scenario: 'A' \| 'B' \| 'C' \| 'custom', mode?: 'live' \| 'replay' }` | `{ runId: string }` | Starts async run; mode defaults to env `MODE` (`replay`) |
| `/api/runs/:id/stream` | `GET` | _None_ | SSE Stream (`step`, `plan_ready`, `error`) | Events carry Step or planVersion |
| `/api/runs/:id` | `GET` | _None_ | `Run` | Full state including changes, hashes |
| `/api/runs/:id/decisions` | `POST` | `{ changeId: string, decision: 'pending' \| 'approved' \| 'rejected', excludedPks?: Pk[], confirmText?: string }` | `Change` | Zod-validated; enforces CRITICAL confirm rule (`'I ACCEPT THE RISK'`) |
| `/api/runs/:id/revise` | `POST` | `{ notes: string }` | `{ planVersion: number }` | Starts v+1; old version kept in history |
| `/api/runs/:id/apply` | `POST` | _None_ | `{ hashes: { base: string, afterApply: string }, applied: number }` | Only approved changes replayed |
| `/api/runs/:id/undo` | `POST` | _None_ | `{ hashes: { base: string, afterUndo: string }, match: boolean }` | Restores snapshot; match must be true |
| `/api/db/hash` | `GET` | _None_ | `{ hash: string }` | Live base hash for the "0 real writes" badge |
| `/api/health` | `GET` | _None_ | `{ status: string, timestamp: string, mode: 'live' \| 'replay', model: string }` | Server health check endpoint |

---

## 3. Environment Variables

| Variable | Default / Format | Notes |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | _empty_ | Free tier API key from console.groq.com |
| `GROQ_MODEL` | _empty (no default)_ | Tool-calling model ID; rotated by Groq |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | OpenAI-compatible endpoint |
| `MODE` | `replay` | `replay` (default) or `live` |
| `PORT` | `3001` | Express server port |
