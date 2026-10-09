# PREFLIGHT
Complete PRD, tech stack and phase-by-phase implementation plan for coding agents

What it is, how it works inside, what we build with, and nine sequential phases you can hand to agents one at a time, each with deliverables, acceptance tests, a paste-ready prompt and a human gate.

6-hour build · Track: AI Agents & Intelligent Assistants

---

## 1. The project in plain language

Preflight lets an AI agent rehearse a task on a copy of your data, then shows you everything it would change as a reviewable diff. You approve the safe parts, reject the risky parts, apply, and can undo with proof.

### The problem in one story
You tell an agent: “clean up the test orders.” It writes `DELETE FROM orders WHERE status != 'delivered'`. That query also matches 38 real, paid orders. Normal logs show one successful SQL call. Nothing looks wrong until customers complain. In April 2026 a real coding agent deleted a startup's production database and backups in nine seconds the same way: a valid call, a catastrophic effect.

### What Preflight does instead (the user's view)
1. **Give task**: Type a task or pick a demo scenario. Agent starts in PLAN mode. Tools are wrapped by the Preflight executor.
2. **Watch rehearsal**: Live timeline of agent steps. A badge says “0 real writes”. Every write lands in an in-memory shadow copy of the database. The real file is untouched.
3. **Review plan**: Cards: “Delete 300 orders”, “50 refunds, ₹1,06,900”, with risk badges and reasons. Executor diffs shadow vs real, row by row. Risk engine scores each change; an LLM judge checks it against the task's intent.
4. **Decide**: Approve, reject, or exclude individual flagged rows. Optionally “Ask agent to revise”. Decisions are stored per change. Revise re-runs the agent with your rejection notes as feedback.
5. **Apply**: One button. Receipt shows before / after hash. Real DB is snapshotted, then only approved row operations are replayed in one transaction.
6. **Undo**: One button. Banner: “Restored: hash matches”. Snapshot is restored; SHA-256 of the database is compared to the pre-apply hash.

### Key design decisions
- **Everything is database-backed**: Refunds, emails and cloud volumes are tables in the demo SQLite database (`refunds`, `email_outbox`, `infra_volumes`).
- **Row operations are the unit of truth**: A Change is a list of row-level operations (`insert` / `update` / `delete` by primary key).
- **Apply never re-runs the agent**: It replays approved row operations, so what you reviewed is exactly what runs.
- **Scenario C is a scripted incident replay**: Labelled “incident replay”.
- **Deterministic risk score, LLM only for intent**: The numbers come from code. The LLM contributes an intent-drift score with a reason.

---

## 2. Product requirements

### Users and jobs
- **Primary**: Developer or founder who gave an agent credentials.
- **Secondary**: Platform / security reviewers who need an approval trail.

### Functional requirements
- **R1**: Run a task with an LLM tool-use agent in PLAN mode; stream steps to UI. (P0)
- **R2**: Guarantee no real writes before Apply (automated test + on-screen base-hash badge). (P0)
- **R3**: Produce a plan: grouped Changes made of row operations, with counts, ₹ amounts, recipients and sample before/after rows. (P0)
- **R4**: Score each Change 0–100 with level and human-readable reasons; detect duplicate refunds and “paid real orders touched”. (P0)
- **R5**: Approve / reject per Change; exclude individual flagged rows; CRITICAL changes require typed confirmation. (P0)
- **R6**: Apply approved operations in one transaction after a snapshot; produce receipt with hashes. (P0)
- **R7**: Undo restores the snapshot and shows hash equality. (P0)
- **R8**: Intent-drift judge: LLM returns `{drift 0–1, reason}` comparing each Change to the task. (P1)
- **R9**: Ask agent to revise: rejection notes go back; new plan version replaces the old; version history visible. (P1)
- **R10**: Replay mode: run any scenario from recorded transcripts with no network. (P1)
- **R11**: Loop / step-budget guard: stop a run after 25 steps or 3 identical calls and say so. (P2)

### Demo scenarios
- **A. Dangerous cleanup**: “Clean up the test orders from the database.” Naive action: `DELETE FROM orders WHERE status != 'delivered'`. Expected plan: 300 rows deleted (262 test + 38 real paid orders, ₹2.1L). Level HIGH. After revise: only `is_test=1` rows, level MEDIUM, 0 paid orders.
- **B. Money and messages**: “Refund customers who complained about damaged parcels and email each one.” Naive: 50 refunds + 50 emails, including 9 duplicates. Expected: Refunds ₹1,06,900 with 9 duplicates flagged (₹10,500). Emails marked irreversible.
- **C. Incident replay**: “Staging deploy fails with a credential error. Fix it.” Naive: Reads unrelated file holding prod token, calls `infra.deleteVolume` on `prod-db` and `prod-db-backup`. Expected: CRITICAL, capped 100.

---

## 3. Tech stack and why

- **Language**: TypeScript 5, Node 20+
- **Monorepo**: npm workspaces (`shared`, `server`, `web`)
- **Server**: Express 4, zod, tsx, cors
- **Database**: better-sqlite3
- **LLM**: `@anthropic-ai/sdk`, model from env (`claude-sonnet-5-5`), temperature 0
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + lucide-react
- **Tests**: vitest (server), scripted e2e
- **Hashing**: Node crypto SHA-256 over a canonical table dump
- **Config**: `.env`: `ANTHROPIC_API_KEY`, `MODEL`, `MODE=live|replay`, `PORT=4000`

---

## 4. Architecture & Implementation

### Run lifecycle
1. `POST /api/runs` -> create `Run(status=running, planVersion=1)`, `baseHash = hash(base.db)`
2. `shadow = new Database(base.serialize())`
3. loop (max 25 steps):
   - llm or replay -> `tool_use(name, args)`
   - `executor.run(name, args, shadow)` -> result string
   - record Step; if tool mutates: `diff(before, after) -> RowOps` tagged with `stepNumber`
   - group `RowOps` by `(tool, table) -> Changes`
   - `risk.score(Change) + judge(task, Change) -> Change.risk, Change.drift`
   - `Run.status = 'planned'`; assert `hash(base.db) == baseHash` (R2)
4. `POST /api/runs/:id/decisions` -> mark approved / rejected / excludedPks
5. `POST /api/runs/:id/apply` -> `snapshot(base)` -> `BEGIN` -> replay approved RowOps by PK -> `COMMIT` -> hash
6. `POST /api/runs/:id/undo` -> restore snapshot; hash must equal pre-apply hash
7. `POST /api/runs/:id/revise` -> new `planVersion`; agent re-run with rejection notes; new shadow

### Tools (7)
1. `db.query(sql)` [READ]: Reject non-SELECT.
2. `db.execute(sql)` [WRITE]: INSERT / UPDATE / DELETE on orders, customers, complaints.
3. `payments.refund(order_id, amount_inr, reason)` [EXTERNAL]: Inserts into refunds.
4. `email.send(to, subject, body)` [EXTERNAL]: Inserts into email_outbox.
5. `fs.read(path)` [READ]: Reads from virtual files table.
6. `infra.listVolumes()` [READ]: Lists infra_volumes.
7. `infra.deleteVolume(volume_id)` [IRREVERSIBLE]: Sets infra_volumes.status='deleted'.

---

## 5. Contracts, risk engine and judge

### Shared types (`shared/src/types.ts`)
```ts
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

### Risk scoring rules
- Base: READ 0, WRITE 15, EXTERNAL 35, IRREVERSIBLE 60.
- Blast radius: rows: `min(20, round(5 * log10(1 + rows)))`. Money: `min(20, round(4 * log10(1 + ₹ / 1000)))`. Take larger.
- Scope: +10 if production.
- Sensitivity: +10 if orders / refunds / customers / email_outbox; +5 if backup volume.
- Anomaly flags: +15 if real paid orders touched (`is_test=0 && paid=1`) while task mentions test; +15 for duplicate refund of same order_id.
- Intent drift: `+ round(20 * judge.drift)`.
- Levels: `<30` LOW, `30–59` MEDIUM, `60–79` HIGH, `>=80` CRITICAL. Cap at 100.

---

## 6. API and frontend specification

| Endpoint | Body -> Response | Notes |
|---|---|---|
| `POST /api/runs` | `{task, scenario, mode?}` -> `{runId}` | Starts async run; mode defaults to env MODE |
| `GET /api/runs/:id/stream` | SSE events: `step`, `plan_ready`, `error` | Events carry Step or planVersion |
| `GET /api/runs/:id` | -> `Run` | Full state incl. changes, hashes |
| `POST /api/runs/:id/decisions` | `{changeId, decision, excludedPks?, confirmText?}` -> `Change` | zod-validated; enforces CRITICAL rule |
| `POST /api/runs/:id/revise` | `{notes}` -> `{planVersion}` | Starts v+1; old version kept in history |
| `POST /api/runs/:id/apply` | -> `{hashes, applied: n}` | Only approved changes |
| `POST /api/runs/:id/undo` | -> `{hashes, match: boolean}` | match must be true |
| `GET /api/db/hash` | -> `{hash}` | Live base hash for the “0 real writes” badge |
