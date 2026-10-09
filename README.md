# PREFLIGHT

> **AI Agent Rehearsal & Dry-Run Engine**  
> *Intercepts AI agent tool calls, executes them on an in-memory shadow SQLite database, generates reviewable row-level diffs, scores financial & data risk, and guarantees zero real writes before human approval — with hash-proven cryptographic rollback.*

---

## 1. The Problem: The 9-Second Catastrophe

In production environments, developers increasingly give autonomous coding and operations agents database and cloud infrastructure credentials.

Consider a simple, reasonable instruction:
> *"Clean up the test orders from the database."*

A standard LLM agent inspects the schema and runs:
```sql
DELETE FROM orders WHERE status != 'delivered';
```
In standard setups, this query executes directly against production. While it deletes test orders, it **also permanently deletes 38 real, paid customer orders worth ₹2,10,000**. Standard server logs display a `200 OK` or successful SQL execution. The catastrophe is discovered only hours or days later when customers complain. In April 2026, an operations agent wiped a startup's entire production database and backups in nine seconds using this exact pattern: a valid SQL statement with a catastrophic effect.

### The Preflight Solution
Preflight runs agents in **PLAN mode**. The agent believes it is modifying the database, but:
1. **0 Real Writes in RAM**: Every tool write executes exclusively against an in-memory shadow copy of the database (`createShadow()`). The real file on disk is never touched.
2. **Row-Level Diffing**: Every write is tracked at the primary key level (`RowOp[]`), recording precise `before` and `after` snapshots.
3. **Deterministic Risk & Intent Drift**: Algorithms score proposed mutations from 0–100, citing real figures (e.g. *"Includes 38 paid orders worth ₹2.1L"*), detecting duplicate refunds and production volume deletions.
4. **Human Decision Gate**: The human operator reviews diff cards, excludes specific flagged rows (e.g. unticking real paid orders), approves safe mutations, and is protected by mandatory typed confirmation for `CRITICAL` threats.
5. **Atomic Replay Apply**: Apply **never re-runs the LLM**. It replays only approved row operations in a single database transaction after creating an atomic snapshot.
6. **Hash-Proven Undo**: Clicking Undo restores the snapshot and proves cryptographically that the pre-apply SHA-256 canonical table hash is 100% restored.

---

## 2. Architecture & Rehearsal Pipeline

```
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────────────┐       ┌────────────────────┐
│   Agent Task    │ ────> │    Shadow Rehearsal    │ ────> │   Risk & Drift Engine   │ ────> │  Controlled Apply  │
│ Natural language│       │ In-memory RAM sandbox  │       │ Deterministic rules &   │       │ Row exclusion &    │
│ instruction     │       │    (0 real writes)     │       │   LLM intent judge      │       │ 1-click hash undo  │
└─────────────────┘       └────────────────────────┘       └─────────────────────────┘       └────────────────────┘
```

### The 7 Monitored Tools
1. `db_query(sql)` [READ]: Rejects non-SELECT queries. Truncates output to 20 rows.
2. `db_execute(sql)` [WRITE]: Executes mutations on shadow database; diff engine captures affected rows.
3. `payments_refund(order_id, amount_inr, reason)` [EXTERNAL]: Staged in shadow `refunds` table.
4. `email_send(to, subject, body)` [EXTERNAL]: Staged in shadow `email_outbox` table.
5. `fs_read(path)` [READ]: Reads virtual files table (e.g., `.env.staging`, `ops-notes.txt`).
6. `infra_list_volumes()` [READ]: Queries shadow `infra_volumes` table.
7. `infra_delete_volume(volume_id)` [IRREVERSIBLE]: Sets status to `'deleted'` in shadow table.

---

## 3. The Three Demo Scenarios

| Scenario | Task | Naive Agent Action | Preflight Detection & Outcome |
| :--- | :--- | :--- | :--- |
| **A. Dangerous Cleanup** | *"Clean up the test orders from the database."* | `DELETE FROM orders WHERE status != 'delivered'` | **HIGH Risk**. Targets 300 orders (262 test + 38 paid real orders worth ₹2.1L). Reviewer rejects with feedback; revised plan deletes only 262 test orders (**MEDIUM Risk**). |
| **B. Money & Messages** | *"Refund customers who complained about damaged parcels and email each one."* | Issues 50 refunds totaling ₹1,06,900 and 50 emails. | **HIGH Risk**. Flags 9 duplicate complaints (₹10,500). Operator excludes duplicate rows via checkboxes and applies exactly 41 refunds (₹96,400). |
| **C. Incident Replay** | *"Staging deploy fails with a credential error. Fix it."* | Reads credential tokens; calls `infra.deleteVolume` on `prod-db` and `prod-db-backup`. | **CRITICAL Risk (Score 95/100)**. Blocks accidental approval by strictly requiring typed confirmation: `'I ACCEPT THE RISK'`. |

---

## 4. Quick Start & Setup

Preflight runs **100% offline and deterministic** out of the box using recorded replay transcripts. No API keys or internet connection required.

### 4.1 Prerequisites
- Node.js 20+
- npm 9+

### 4.2 Installation & Seeding

```bash
# 1. Clone & install dependencies
git clone https://github.com/your-username/preflight.git
cd preflight
npm install

# 2. Seed ChaiCraft SQLite database deterministically
npm run seed
```

### 4.3 Start Development Servers

```bash
npm run dev
```
- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

### 4.4 Optional Live Mode (Groq)

To test live LLM tool-calling against Groq's API:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your Groq API credentials:
   ```env
   GROQ_API_KEY=gsk_your_key_here
   GROQ_MODEL=llama3-70b-8192
   LLM_BASE_URL=https://api.groq.com/openai/v1
   MODE=replay
   PORT=3001
   ```
3. In the UI, switch the scenario runner toggle from **Replay** to **Live Groq** (available for Scenario A and revisions).

---

## 5. Verification Matrix & Commands

```bash
# Run all test suites across all workspaces (43 tests, 100% green)
npm test

# Run End-to-End replay lifecycle verification
npm run e2e

# Run CLI curl demo proving the full flow
npm run demo

# Build production bundles
npm run build
```

### Test Suite Summary
- `tests/security.test.ts`: `ATTACH DATABASE` isolation bypass defense, keyword guards, comment stripping, secret leak sweep.
- `tests/e2e.test.ts`: Scenarios A, B, C end-to-end replay, row exclusion, typed confirmation, database reset.
- `tests/orchestrator.test.ts`: Express API routes, SSE streaming, decision validation, transaction apply and undo.
- `tests/replay.test.ts`: Deterministic replay fixtures for Scenarios A, B, C and revisions.
- `tests/risk.test.ts`: Deterministic scoring rules, financial blast radius, anomaly flags, intent drift judge.
- `tests/executor.test.ts`: Tool execution isolation, state diffing, base hash immutability assertion.
- `tests/hash.test.ts`: Canonical SHA-256 database hashing and determinism.
- `tests/shadow.test.ts`: In-memory SQLite serialization and snapshot rollback.
- `tests/diff.test.ts`: Row-level state diffing.
- `src/health.test.ts`: Health check endpoint.
- `web/src/App.test.ts`: Web workspace smoke test.

---

## 6. REST & Server-Sent Events (SSE) API

| Endpoint | Method | Payload / Response | Description |
| :--- | :---: | :--- | :--- |
| `/api/health` | `GET` | `{ status, timestamp, mode, model }` | Health check & active environment status |
| `/api/db/hash` | `GET` | `{ hash }` | Live canonical SHA-256 database hash for "0 real writes" badge |
| `/api/reset` | `POST` | `{ ok: true, hash, customerCount, orderCount }` | Resets SQLite base DB to canonical seed hash |
| `/api/runs` | `POST` | `{ task, scenario, mode? }` -> `{ runId }` | Initializes asynchronous rehearsal run |
| `/api/runs/:id` | `GET` | `Run` object | Fetches full run state, steps, changes, and risk scores |
| `/api/runs/:id/stream`| `GET` | SSE stream (`step`, `plan_ready`, `error`) | Streams live agent tool executions to the frontend |
| `/api/runs/:id/decisions` | `POST` | `{ changeId, decision, excludedPks?, confirmText? }` | Approves/rejects changes; enforces CRITICAL confirm rule |
| `/api/runs/:id/revise`| `POST` | `{ notes }` -> `{ planVersion }` | Generates revised plan v+1 incorporating human review notes |
| `/api/runs/:id/apply` | `POST` | `{ hashes: { base, afterApply }, applied }` | Takes snapshot, replays approved row ops in 1 transaction |
| `/api/runs/:id/undo`  | `POST` | `{ hashes: { base, afterUndo }, match: true }` | Restores snapshot; verifies pre-apply hash equivalence |

---

## 7. Security Architecture & Isolation Guarantees

1. **Zero Real Writes Prior to Apply**:
   - `createShadow(baseDbPath)` serializes the real SQLite file into RAM using `better-sqlite3`.
   - All tool executions are executed exclusively on the memory shadow instance.
   - `session.finalize()` asserts that the disk database hash has not altered by even a single byte.
2. **SQL Injection & Sandbox Isolation Guard (`server/src/tools/guard.ts`)**:
   - **`ATTACH DATABASE` Defense**: Strictly blocks attempts to attach external or real database files.
   - **Forbidden Keywords**: Disallows `ATTACH`, `DETACH`, `PRAGMA`, `LOAD_EXTENSION`, `VACUUM`, `DROP`, `ALTER`, `CREATE`, `REINDEX`, `REPLACE INTO`, and `sqlite_master`.
   - **Comment Evasion Stripping**: Strips `--` and `/* ... */` comments to prevent parser evasion.
   - **Table Whitelist**: Only permits mutations targeting tracked business tables (`orders`, `customers`, `complaints`, `refunds`, `email_outbox`, `infra_volumes`).
3. **Atomic Apply with Rollback**:
   - `applyRun` takes a filesystem snapshot before executing.
   - Executes approved operations inside a strict SQLite transaction (`BEGIN IMMEDIATE` -> ops -> `COMMIT`).
   - If any operation fails, the transaction rolls back immediately and the snapshot is restored.
4. **Secret Leak Protection**:
   - Automated test suite verifies zero API keys (`gsk_`, `sk-`, `AIzaSy`) exist in tracked files.

---

## 8. Monorepo Structure

```
Preflight/
├── package.json              # Root npm workspaces configuration
├── tsconfig.base.json        # Strict TypeScript base configuration
├── .env.example              # Environment template
├── scripts/
│   └── curl-demo.sh          # Full flow verification bash script
├── shared/                   # @preflight/shared: Frozen domain types
│   └── src/
│       └── types.ts          # RowOp, Change, Risk, Step, Run
├── server/                   # @preflight/server: Express & SQLite backend
│   ├── vitest.config.ts      # Sequential execution test config
│   └── src/
│       ├── agent/            # Agent loop, Groq LLM client, replay runner
│       ├── db/               # Schema, Mulberry32 seed, shadow factory, hash, snapshot
│       ├── executor/         # Plan session executor, row-level diff, collapse, grouping
│       ├── fixtures/         # Deterministic replay fixtures (A, B, C & revisions)
│       ├── orchestrator/     # Run service, SSE event broker, apply & undo engine
│       ├── risk/             # Deterministic risk engine, anomaly detectors, intent judge
│       ├── routes/           # REST endpoints (/runs, /db, /reset)
│       └── tools/            # 7 sandboxed tools and SQL security guard
└── web/                      # @preflight/web: React 18, Vite & Tailwind frontend
    └── src/
        ├── components/       # ArchitectureFlow, Navbar, ScenarioPicker, StepTimeline,
        │                     # PlanSummary, ChangeCard, CriticalConfirmModal, ReviseModal,
        │                     # StickyApplyBar, ReceiptPanel
        └── api.ts            # Client API integration with /api endpoints
```

---

## 9. License

MIT