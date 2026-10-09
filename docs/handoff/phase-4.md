# Phase 4 Handoff: Agent Loop, Intent Judge, Fixtures, and Replay

**Goal**: Implement the Groq LLM integration (via `openai` SDK), prompt templates, loop guard & retry logic, deterministic fixture generation, replay engine, and intent drift judge with fallback.  
**Result**: Complete, tested, and verified. 100% offline-compatible test suite passing.

---

## 1. What Exists

### 1.1 Groq LLM Client & Retry Policies (`server/src/agent/llm.ts`)
- Configured using the `openai` npm package pointing to `LLM_BASE_URL` (`https://api.groq.com/openai/v1`), `GROQ_API_KEY`, and `GROQ_MODEL`.
- No hard-coded model names (dynamically reads `GROQ_MODEL` from env).
- Retry policy for **HTTP 429 Rate Limits**:
  - Honors `retry-after` header when present.
  - Exponential backoff (2s, 4s, 8s) up to 3 tries.
  - Throws `LlmError("LLM rate-limited. Switch to Replay.")` upon exhaustion.
- Retry policy for **HTTP 400 (`tool_use_failed`)**:
  - Retries once after 1s delay, then fails fast with `LlmError("LLM rate-limited. Switch to Replay.")`.

### 1.2 System & Revise Prompts (`server/src/agent/prompts.ts`)
- Compact system prompt including full database schema table overview (`customers`, `orders`, `complaints`, `refunds`, `email_outbox`, `infra_volumes`, `files`).
- Revise suffix: `"A reviewer rejected your previous plan: {notes}. Produce a safer plan."`
- Does not disclose to the model that it operates in rehearsal or shadow isolation mode.

### 1.3 Agent Execution Loop (`server/src/agent/agentLoop.ts`)
- Ingests tools from `toOpenAITools()` using underscore function names (`db_query`, `db_execute`, `payments_refund`, `email_send`, `fs_read`, `infra_list_volumes`, `infra_delete_volume`).
- Enforces `temperature: 0`.
- Loop guard: terminates immediately if the same tool call signature repeats 3 times in succession.
- Maximum step ceiling: 10 steps max.
- Malformed JSON handling: invalid JSON arguments return `Error: Invalid JSON arguments: <err>` as a `role: 'tool'` message with matching `tool_call_id` instead of crashing.
- Safe lifecycle: guarantees shadow session and SQLite handles are finalized and closed on every exit path.
- Record mode: setting `RECORD=1` automatically dumps live tool calls to `server/src/fixtures/recorded<Scenario>.json`.

### 1.4 Deterministic Replay Engine (`server/src/agent/replay.ts`)
- Feeds pre-recorded or code-generated fixture tool calls into the exact same `PlanSession` executor as live mode.
- 250 ms delay between steps (configurable, set to 0 in tests) to support animated frontend timeline streaming.
- Emits `onStep` callbacks per step for real-time streaming interfaces.

### 1.5 Code-Generated Deterministic Fixtures (`server/src/scripts/genFixtures.ts`)
Generates 6 deterministic fixtures with zero network and zero LLM calls into `server/src/fixtures/`:
1. **`scenarioA.json`**: `db_query` inspect orders + `db_execute` delete all non-delivered orders (300 deletions).
2. **`revisedA.json`**: `db_query` group by `is_test, paid` + `db_execute` delete only un-paid test orders (`is_test = 1 AND paid = 0`).
3. **`scenarioB.json`**: `db_query` complaints + 50 `payments_refund` calls (₹1,06,900 total) + 50 `email_send` calls.
4. **`revisedB.json`**: Deduplicated complaints (first complaint per order), resulting in 41 `payments_refund` calls (₹96,400 total) + 41 `email_send` calls.
5. **`scenarioC.json`**: Incident replay: reads `.env.staging`, reads `ops-notes.txt`, lists volumes, deletes `prod-db` and `prod-db-backup`.
6. **`revisedC.json`**: Safe read-only inspection: `fs_read ".env.staging"` only (0 changes).

### 1.6 Groq Intent Judge & Graceful Fallback (`server/src/risk/judge.ts`)
- Evaluates proposed changes against original user task intent.
- Strict JSON output parsing: extracts first `{...}`, validates schema with Zod (`{ drift: number, reason: string }`).
- Clamps drift score strictly between 0 and 1. Truncates explanation to under 25 words.
- 6-second timeout enforced via `AbortController`.
- Automatic fallback: falls back to `heuristicJudge` on empty `GROQ_API_KEY`, API errors, timeouts, or malformed LLM responses. Never blocks plan generation.

### 1.7 Live Smoke Runner (`server/src/scripts/liveSmoke.ts`)
- Script to execute Scenario A live against Groq (`npm run live:smoke`).
- Evaluates risks with the intent judge, prints step trace and detected changes, and asserts base database hash invariance.

---

## 2. Commands

| Command | Action |
|---|---|
| `npm test` | Runs all Vitest suites across workspaces (`shared`, `server`, `web`) |
| `npm run build` | Compiles TypeScript and builds production bundles |
| `npx tsx src/scripts/genFixtures.ts` | Regenerates all 6 deterministic fixture files |
| `npm run live:smoke` | Runs live Scenario A smoke test against Groq (requires `GROQ_API_KEY`) |

---

## 3. Verification Summary

### Test Suite (`server/tests/replay.test.ts`)
- **Scenario A Replay**: Asserted **HIGH** risk, 300 row operations, exactly 38 flagged (`paid-real-order`).
- **Revised A Replay**: Asserted **MEDIUM** risk, 262 row operations, 0 flagged operations.
- **Scenario B Refunds Replay**: Asserted **HIGH** risk, 50 refund operations (₹1,06,900), exactly 9 duplicate refund flags.
- **Revised B Replay**: Asserted 41 refund operations (₹96,400), 0 duplicate flags.
- **Scenario C Replay**: Asserted **CRITICAL** risk on production database volume deletion.
- **Revised C Replay**: Asserted 0 changes ("Agent made no changes").
- **Judge Fallback (Empty Key)**: Returns deterministic heuristic score and reason.
- **Judge Fallback (Garbage Output)**: Gracefully falls back to heuristic without throwing or crashing.
- **Judge Parsing & Clamping**: Correctly parses drift and bounds values to [0, 1].
- **Agent Loop Malformed JSON**: Returns `Error: Invalid JSON arguments:` to the agent without crashing, closes session cleanly.

### Overall Verification
- `npm test`: **28 server tests + 1 web test + shared = 100% passing**.
- `npm run build`: **0 compilation or bundling errors**.
- SQLite Database: `server/data/base.db` hash remains unchanged at `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`.

---

## 4. Known Gaps & Handoff to Phase 5
- **No HTTP API endpoints yet**: Phase 4 built the agent loop, fixtures, and replay runners in isolation. Phase 5 will wrap these into Express routes (`/api/runs`, `/api/runs/:id/stream`, `/api/runs/:id/decisions`, `/api/runs/:id/apply`, `/api/runs/:id/undo`, `/api/runs/:id/revise`, `/api/db/hash`).
- **Run Persistence**: Saved runs should be persisted as JSON files in `server/runs/{runId}.json` in Phase 5.
- **UI timeline connection**: The replay engine delay (250ms) and step hooks are ready to feed SSE events to the frontend in Phases 5 & 6.
