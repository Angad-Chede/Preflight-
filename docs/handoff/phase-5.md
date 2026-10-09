# Phase 5 Handoff: Orchestrator, Express Routes, Apply, Undo, & Persistence

**Goal**: Implement the execution orchestrator, full Express API routes (runs, SSE streaming, decisions, revision, apply, undo, database hash), atomic transactional apply with rollback and exclusion, snapshot-based undo with hash verification, JSON persistence, and demo script.  
**Result**: Complete, tested, and verified. 100% of tests passing.

---

## 1. What Exists

### 1.1 Express API Endpoints (`server/src/routes/runs.ts` & `server/src/routes/db.ts`)
Mounted on port `3001` in [server/src/app.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/app.ts):
- **`POST /api/runs`**: Initiates a new async run. Validates payload (`task`, `scenario`, `mode`), generates a UUID `runId`, records initial base DB hash, saves initial run record, dispatches background execution, and returns `{ runId }` (HTTP 201).
- **`GET /api/runs/:id`**: Returns full `Run` state including steps, assessed changes, risk scores, notes, and hashes (HTTP 200/404).
- **`GET /api/runs/:id/stream`**: SSE event stream (`text/event-stream`). Emits `event: step` as steps execute, and `event: plan_ready` or `event: error`. Supports reconnecting clients by replaying prior steps immediately before streaming active events.
- **`POST /api/runs/:id/decisions`**: Zod-validated decision submission (`changeId`, `decision`, `excludedPks`, `confirmText`). Enforces the CRITICAL rule: changes with `risk.level === 'CRITICAL'` require `confirmText: 'I ACCEPT THE RISK'` to approve; otherwise rejected with HTTP 400.
- **`POST /api/runs/:id/revise`**: Increments `planVersion`, stores revision notes, and launches async execution for the new plan version (using `revisedA.json` / revised fixtures in replay mode). Returns `{ planVersion }`.
- **`POST /api/runs/:id/apply`**: Applies approved changes to the base database:
  1. Creates snapshot `snapshots/{runId}.db`.
  2. Executes all approved changes in **one atomic database transaction**.
  3. Skips operations on rows matching `excludedPks`.
  4. Automatically rolls back and restores snapshot on error.
  5. Computes `hashes.afterApply` and updates run status to `applied`.
  6. Returns `{ hashes: { base, afterApply }, applied: count }`.
- **`POST /api/runs/:id/undo`**: Restores the base database from `snapshots/{runId}.db`, computes `afterUndo` hash, asserts equality with initial base hash (`match === true`), marks run as `undone`, and returns `{ hashes: { base, afterUndo }, match }`.
- **`GET /api/db/hash`**: Returns `{ hash: string }` representing the live base database hash for the UI "0 real writes" badge.
- **`GET /api/health`**: Returns server status, mode (`live` | `replay`), and model ID.

### 1.2 Orchestrator Service (`server/src/orchestrator/service.ts`)
- Manages SSE client subscriptions and event broadcasting (`step`, `plan_ready`, `error`).
- Dispatches execution tasks to `runReplay` (with 0 delay in test environment, 250ms in demo/production) or `runAgentLoop`.
- Evaluates risk using `assessChanges` and the Groq intent judge with heuristic fallback.
- Enforces isolation and base hash invariants across all states.

### 1.3 JSON Run Persistence (`server/src/storage/runs.ts`)
- Persists all run documents to `server/runs/{runId}.json`.
- Provides lookup (`getRun`), creation (`saveRun`), and listing (`listRuns`).
- Dynamically resolves paths to work seamlessly whether executed from repository root or the `server/` workspace directory.

### 1.4 Full Flow Demo Script (`scripts/curl-demo.sh`)
- Automated bash script demonstrating the full lifecycle in replay mode:
  1. Health check & Initial base hash query
  2. Create Scenario A run in Replay mode
  3. Wait for plan ready (HIGH risk, 300 deletions)
  4. Submit revision notes ("Only delete test orders where paid is 0")
  5. Wait for revised plan (MEDIUM risk, 262 deletions)
  6. Record approval decision
  7. Apply approved changes to base database
  8. Undo applied changes and restore snapshot
  9. Assert final database hash strictly matches initial baseline hash!

---

## 2. Commands

| Command | Action |
|---|---|
| `npm test` | Runs all Vitest suites across workspaces (`shared`, `server`, `web`) |
| `npm run build` | Compiles TypeScript and builds production bundles |
| `npm run demo` | Runs `scripts/curl-demo.sh` demonstrating the full replay flow via curl |
| `npm run live:smoke` | Runs live Scenario A smoke test against Groq |

---

## 3. Verification Summary

### Test Suite (`server/tests/orchestrator.test.ts`)
- **CRITICAL Confirm Rule**: Rejects approval without exact confirm text with HTTP 400; accepts only with `'I ACCEPT THE RISK'`.
- **Primary Key Exclusion**: Confirms that rows designated in `excludedPks` are preserved in the base SQLite table while non-excluded rows are mutated.
- **Atomic Rollback on Error**: Proves that transaction failure during apply triggers complete rollback and leaves base database hash identical to initial hash.
- **End-to-End Replay Lifecycle**: Tests run creation, SSE stream endpoint, revision to version 2, decision recording, apply, undo, and hash match verification.

### Overall Verification Status
- `npm test`: **32 server tests + 1 web test + shared = 100% green (33 tests total)**.
- `npm run build`: Clean TypeScript compilation across `@preflight/shared`, `@preflight/server`, and `@preflight/web`.
- Base SQLite Database Hash: `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385` preserved.

---

## 4. Handoff to Phase 6 (Frontend)
- The backend API and SSE streaming pipeline are complete and listening on port `3001`.
- Phase 6 will connect the React web client in `web/` to:
  - `POST /api/runs` to launch runs (defaulting to Replay mode).
  - `GET /api/runs/:id/stream` to animate step timeline execution in real-time.
  - `POST /api/runs/:id/decisions` to approve/reject changes with row-level exclusion checkboxes and the CRITICAL confirmation modal.
  - `POST /api/runs/:id/revise` to submit reviewer feedback notes.
  - `POST /api/runs/:id/apply` & `POST /api/runs/:id/undo` to enact and reverse changes.
  - `GET /api/db/hash` to poll the live hash badge.
