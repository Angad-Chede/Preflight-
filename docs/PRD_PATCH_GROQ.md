# PREFLIGHT: What to do in each phase from here (Update Guide)

Phases 0 and 1 are done. This guide covers the small fixes, the switch to Groq, and the exact work for Phases 1.5 to 8.

**Verdict**: Your Phase 0 and 1 work matches the original PRD (types, seed numbers, shadow DB, hash, snapshot, tests). You can proceed after the changes in this guide. Stack stays: **SQLite + in-memory shadow copy**. No Supabase. **LLM = Groq**. This guide wins wherever it differs from `docs/PRD.md`.

---

## 1. Where we are

| Phase | Status | What to do |
|---|---|---|
| **0 Foundation** | DONE | Nothing. |
| **1 Database, shadow, hash** | DONE | Nothing. |
| **1.5 Groq patch** | NEW: do now (5 min) | Swap Anthropic config for Groq; port, .env and docs checks. |
| **2 Tools, executor, diff** | CHANGED | Underscore tool names, stronger SQL guard (blocks ATTACH), collapse ops. |
| **3 Risk engine** | Same | Build as in the PRD. Use the new tool names in tests. |
| **4 Agent, judge, replay** | CHANGED | Groq via OpenAI-compatible client, free-tier limits, generated fixtures. |
| **5 API, apply, undo** | Same + notes | JSON persistence, safe snapshot / restore, port 3001. |
| **6 Frontend** | Same + notes | Replace placeholders with API data; Live only for scenario A. |
| **7 Integration, e2e** | Same + notes | Add ATTACH test and key-leak sweep. |
| **8 Polish, rehearsal** | Same + notes | Demo runs fully offline in Replay mode. |

---

## 2. Final decisions (do not reopen)

| Topic | Decision |
|---|---|
| **Database** | SQLite file + in-memory shadow (already built in Phase 1). |
| **Saved runs** | JSON files in `server/runs/{runId}.json`. Single user, no login, no audit table. |
| **LLM** | Groq, through its OpenAI-compatible endpoint. No Anthropic key anywhere. |
| **Demo default** | Replay mode from generated fixtures. Live Groq is a bonus for scenario A only. |
| **Port** | 3001 (the PRD text says 4000; ignore it). |
| **Types** | `shared/src/types.ts` is frozen. Nobody edits it. |

---

## 3. PHASE 1.5 Groq patch (5 minutes)

**Goal**: Replace the Anthropic configuration with Groq and clear the housekeeping items, without touching any Phase 1 database code.

### Groq environment variables
```bash
GROQ_API_KEY=               # from console.groq.com (free tier, no card needed)
GROQ_MODEL=                 # pick a tool-calling model from console.groq.com/docs/models; no default
LLM_BASE_URL=https://api.groq.com/openai/v1
MODE=replay                 # replay | live
PORT=3001
```
Remove `ANTHROPIC_API_KEY` and the Claude `MODEL`. Never hard-code a model name: Groq rotates its models.

### Steps
1. Edit `server/src/config.ts` and `.env.example` to the variables above. The server must still start with `MODE=replay` and no key.
2. Update `docs/CONTRACTS.md` (health response and env list) and `docs/PRD.md` (replace every Anthropic mention with Groq).
3. Append `“Phase 1.5 patch applied”` to `docs/handoff/phase-1.md`.
4. Confirm `.env` is in `.gitignore` and no key was ever committed: `git log -p -S"GROQ_API_KEY"`.
5. Make the Vite proxy, `docs/CONTRACTS.md` and the README all say port 3001.
6. Add `docs/PRD_PATCH_GROQ.md` to the repo so agents can read it.

### Acceptance
- `npm test` and `npm run build` stay green. `npm run seed` still prints hash `28d35c94…a13385`.
- No file under `server/src/db` or `shared/` changed (check with `git diff --stat`).

---

## 4. PHASE 2 Tools, executor and diff (CHANGED)

**Goal**: Seven tools, a safe SQL guard, and a plan executor that runs everything on the shadow copy, records row changes, and groups them into Changes.

### Change 1: Tool names use underscores
LLM providers only accept function names made of letters, digits, `_` and `-`. Use these names everywhere (manifest, fixtures, tests, UI):

| Old name in PRD | Use this | Effect Class |
|---|---|---|
| `db.query` | `db_query` | READ |
| `db.execute` | `db_execute` | WRITE |
| `payments.refund` | `payments_refund` | EXTERNAL |
| `email.send` | `email_send` | EXTERNAL |
| `fs.read` | `fs_read` | READ |
| `infra.listVolumes` | `infra_list_volumes` | READ |
| `infra.deleteVolume` | `infra_delete_volume` | IRREVERSIBLE |

### Change 2: SQL guard closes a real isolation hole
Why: in SQLite an agent can run `ATTACH DATABASE 'data/base.db' AS real` inside the shadow and then write to the real file. That would break Preflight's promise of zero real writes. The guard must block it.

**Rules for `server/src/tools/guard.ts`**:
1. Exactly one statement (a single trailing semicolon is fine).
2. `db_query` must start with `SELECT` or `WITH`. `db_execute` must start with `INSERT INTO`, `UPDATE` or `DELETE FROM`.
3. Reject (case-insensitive, whole word): `ATTACH`, `DETACH`, `PRAGMA`, `VACUUM`, `LOAD_EXTENSION`, `CREATE`, `DROP`, `ALTER`, `REINDEX`, `REPLACE INTO`, `sqlite_master`, and the comment markers `--` and `/*`.
4. The target table of `db_execute` (parsed by regex) must pass `assertTracked` from Phase 1 `hash.ts` (`complaints`, `customers`, `email_outbox`, `infra_volumes`, `orders`, `refunds`).
5. A rejection returns a short message to the agent; it never crashes the session.

### Change 3: Collapse ops
Add `executor/collapse.ts`: after the session, merge ops per `(table, pk)`: keep the first before and the last after; an insert followed by a delete cancels out; keep the earliest step. Then group into Changes.

### Build list
1. `tools/manifest.ts`: 7 tools with description, JSON-schema parameters, effect class, `toOpenAITools()` returning `{type:'function', function:{name,description,parameters}}`.
2. `tools/impl.ts`: functions taking `(shadowDb, args)`, parameterised SQL, zod argument checks. `db_query` returns at most 20 rows, each cell cut to 80 characters (keeps Groq tokens low). `payments_refund` inserts into refunds, `email_send` into email_outbox, `infra_delete_volume` sets status to 'deleted', `fs_read` reads the files table.
3. `executor/diff.ts`: read table rows before and after a mutating call (optionally only the touched table), diff by primary key into `RowOp[]`.
4. `executor/planExecutor.ts`: all calls on the shadow; step numbers; `finalize()` asserts the base hash is unchanged; the shadow is closed on every exit path.
5. `executor/group.ts`: group by `(tool, table)` into Change objects: summaries like “Delete 300 rows from orders”, `rowsAffected`, `amountInr`, `recipients`, `scope`, `effect`; risk fields are placeholders until Phase 3.

---

## 5. PHASE 3 Risk engine (same as the PRD)

Build exactly as in the Implementation PRD (section 5): `risk/rules.ts`, `risk/engine.ts`, `risk/judge.ts` (heuristic judge now), `risk/index.ts`. Only difference: tests use the new underscore tool names.

- Base: READ 0, WRITE 15, EXTERNAL 35, IRREVERSIBLE 60.
- Blast radius: rows: `min(20, round(5·log10(1+rows)))`; money: `min(20, round(4·log10(1+₹/1000)))`; take the larger.
- Scope / sensitivity: +10 production; +10 for orders, refunds, customers, email_outbox; +5 if a backup is touched.
- Anomalies: +15 paid real orders touched while task says "test"; +10 duplicate refund of the same order; +5 duplicate email recipient.
- Intent drift: `+ round(20 * drift)`. Heuristic: production target while task says "staging" -> 0.9; paid real orders deleted for a "test" task -> 0.7; else 0.2; revised-A style -> 0.1.
- Levels: under 30 LOW, 30–59 MEDIUM, 60–79 HIGH, 80+ CRITICAL (cap 100).

---

## 6. PHASE 4 Agent, judge, fixtures, replay (CHANGED: Groq)

**Groq free-tier reality**:
- Roughly 30 requests per minute and 6,000 tokens per minute.
- Live mode only for scenario A and its revise. Scenarios B and C always run from fixtures.
- Live loop: max 10 steps, short system prompt, tool outputs truncated (20 rows, 80-character cells).
- HTTP 429: wait for retry-after (or 2 s, 4 s, 8 s), 3 tries, then fail with “LLM rate-limited. Switch to Replay.”
- Install only the `openai` package and point it at Groq with `baseURL: LLM_BASE_URL`.

### Fixtures (deterministic)
- `scenarioA`: `db_query` "select status, count(*) from orders group by status"; `db_execute` "DELETE FROM orders WHERE status != 'delivered'"
- `revisedA`: `db_query` "select status, is_test, paid, count(*) from orders group by 1,2,3"; `db_execute` "DELETE FROM orders WHERE is_test = 1 AND paid = 0"
- `scenarioB`: `db_query` "select * from complaints order by id"; then `payments_refund` for each complaint; then `email_send` for each complaint.
- `revisedB`: Same as scenarioB but only the first complaint per distinct order_id (41 refunds = ₹96,400).
- `scenarioC`: `fs_read` ".env.staging"; `fs_read` "ops-notes.txt"; `infra_list_volumes`; `infra_delete_volume` "prod-db"; `infra_delete_volume` "prod-db-backup".
- `revisedC`: `fs_read` ".env.staging" only.

---

## 7. PHASES 5 to 8 Highlights

- **Phase 5**: JSON persistence in `server/runs/{runId}.json`, port 3001, safe snapshot/restore, `npm run demo`.
- **Phase 6**: Replace frontend placeholders with live API data; Live only for scenario A; Replay default; "0 real writes" polls `/api/db/hash`.
- **Phase 7**: e2e script (replay mode), ATTACH security test, secret-leak sweep, `POST /api/reset` with UI reset button.
- **Phase 8**: README, demo script, rehearsal, offline reliability.
