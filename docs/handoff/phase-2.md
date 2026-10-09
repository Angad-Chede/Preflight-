# Phase 2 Handoff: Tools, Executor & Diff Engine

**Goal**: Implement the seven tools (manifest + impl), the safe SQL guard, the diff engine with ops collapsing, and the plan executor that runs everything on the in-memory shadow copy and groups RowOps into Changes.  
**Result**: Complete, tested, and verified.

---

## 1. What Was Built

### 1.1 SQL Guard (`server/src/tools/guard.ts`)
Closes database escape and isolation holes:
- Enforces single-statement queries (trailing semicolon allowed).
- Enforces `db_query` starting with `SELECT` or `WITH`.
- Enforces `db_execute` starting with `INSERT INTO`, `UPDATE`, or `DELETE FROM`.
- Blocks forbidden keywords (case-insensitive, whole-word): `ATTACH`, `DETACH`, `PRAGMA`, `VACUUM`, `LOAD_EXTENSION`, `CREATE`, `DROP`, `ALTER`, `REINDEX`, `REPLACE INTO`, `sqlite_master`.
- Blocks SQL comment markers (`--`, `/*`, `*/`).
- Verifies target table against `TRACKED_TABLES` (`complaints`, `customers`, `email_outbox`, `infra_volumes`, `orders`, `refunds`).
- Returns graceful rejection error strings without crashing the agent session.

### 1.2 Tool Manifest & Handlers (`server/src/tools/`)
- **`manifest.ts`**: Defines 7 tools using underscore names per Groq/OpenAI standards:
  - `db_query` (READ)
  - `db_execute` (WRITE)
  - `payments_refund` (EXTERNAL)
  - `email_send` (EXTERNAL)
  - `fs_read` (READ)
  - `infra_list_volumes` (READ)
  - `infra_delete_volume` (IRREVERSIBLE)
  - Exports `toOpenAITools()` returning OpenAI-compatible function calling schemas.
- **`impl.ts`**: Implementations taking `(shadowDb, args)`:
  - Zod schema validation for all parameters.
  - `db_query`: Truncates output to at most 20 rows and 80 characters per cell (preserves Groq token limits).
  - `payments_refund`: Inserts into `refunds` table.
  - `email_send`: Inserts into `email_outbox` table.
  - `fs_read`: Reads from `files` table (`.env.staging`, `ops-notes.txt`).
  - `infra_list_volumes`: Lists cloud volumes.
  - `infra_delete_volume`: Sets volume status to `'deleted'`.

### 1.3 Diff Engine & Ops Collapsing (`server/src/executor/`)
- **`diff.ts`**:
  - `readState(db)` captures primary-key maps of all 6 tracked tables before and after mutating tool calls.
  - `diffStates(before, after, step)` produces atomic `RowOp` objects (`insert`, `update`, `delete`) with before/after state snapshots and step numbers.
- **`collapse.ts`**:
  - Merges ops per `(table, pk)`: preserves initial `before` and final `after`.
  - Cancels out an insert followed by a delete in the same session.
  - Retains the earliest step number.
- **`group.ts`**:
  - Groups collapsed ops by `(tool, table)` into structured `Change` objects.
  - Calculates `rowsAffected`, `amountInr` (refunds & orders), `recipients` (emails), `scope` (`staging` | `production`), and `effect`.
  - Generates clear human-readable summaries (e.g. `"Delete 300 orders"`, `"50 refunds totalling ₹1,06,900"`).

### 1.4 Plan Executor (`server/src/executor/planExecutor.ts`)
- Manages an isolated `PlanSession`.
- All tool execution occurs exclusively on the in-memory shadow copy (`createShadow()`).
- On `finalize()`, asserts that the on-disk base database hash is identical to its starting hash.
- Closes the shadow database connection on every exit path to prevent memory leaks.

---

## 2. Verification & Acceptance Criteria

### Test Suites (`server/tests/`)
1. **`tests/diff.test.ts` (3 tests)**:
   - Update-then-delete on one row collapses to a single `delete` op.
   - Insert-then-delete on one row in the same session cancels out completely (0 ops).
   - Multiple updates collapse to one `update` holding initial `before` and final `after`.
2. **`tests/executor.test.ts` (5 tests)**:
   - **Scenario A**: Produces 1 orders delete Change with 300 ops, exactly 38 with `paid = 1` and 262 with `is_test = 1`.
   - **Scenario revisedA**: Produces 1 orders delete Change with 262 ops, exactly 0 with `paid = 1`.
   - **Scenario B**: Produces 50 refund inserts totalling ₹1,06,900 and 50 email inserts.
   - **Scenario C**: Produces 2 `infra_volumes` updates on `prod-db` and `prod-db-backup`.
   - **SQL Guard & Isolation**: Rejects `ATTACH`, comments, and non-tracked tables; returns error strings without crashing; asserts base hash remains `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`.

### Test Summary
- `npm test`: **14/14 tests passing (100% green)** across all workspaces.
- `npm run build`: **0 compilation or bundling errors** (TypeScript strict + Vite).

---

## 3. How to Run Acceptance Checks

```bash
# Run all tests across workspaces
npm test

# Run dry run verification of Scenario A counts
npx --workspace=server tsx -e "
import { createPlanSession } from './src/executor/planExecutor';
import { callsScenarioA } from './tests/calls';
const s = createPlanSession('test', 'A');
callsScenarioA.forEach(c => s.run(c.tool, c.args));
const plan = s.finalize();
console.log('Change target:', plan.changes[0].target);
console.log('Rows affected:', plan.changes[0].rowsAffected);
console.log('Paid orders in delete:', plan.changes[0].ops.filter(o => o.before?.paid === 1).length);
console.log('Base hash unchanged:', plan.baseHash);
"
```

---

## 4. Next Phase Handoff (Phase 3)
Ready for **Phase 3 (Risk Engine and Rules)**:
- Build `server/src/risk/rules.ts`: anomaly detectors (`paid-real-orders-touched`, `duplicate-refund-same-order`, `production-scope`, `backup-touched`).
- Build `server/src/risk/engine.ts`: deterministic scoring table, clamping 0–100, thresholds 30/60/80, plain-English reasons in Indian Rupee format.
- Build `server/src/risk/judge.ts`: `Judge` interface with `heuristicJudge`.
- Build `server/src/risk/index.ts`: `assessChanges()`.
