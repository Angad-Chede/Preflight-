# PREFLIGHT: Phase 0 & Phase 1 Complete Implementation Document

**System**: Preflight — AI Agent Rehearsal & Dry-Run Engine  
**Project Track**: 6-Hour Hackathon Build (AI Agents & Intelligent Assistants)  
**Phases Completed**: Phase 0 (Foundation & Contracts) & Phase 1 (Data World, Shadow DB & Hashing)  
**Verification Status**: 100% Tests Green (6/6 Vitest Passed), Strict TypeScript Passed, Deterministic Hash Verified  

---

## 1. Executive Summary & Core Mechanism

Preflight acts as an execution sandbox and safety review layer for AI coding and operations agents that hold real infrastructure and database credentials.

### The Problem
When an operations agent receives a command such as *"clean up the test orders"*, naive LLM behavior produces broad SQL mutations like:
```sql
DELETE FROM orders WHERE status != 'delivered';
```
In standard agent setups, this query executes against live production databases. In addition to test orders, it inadvertently deletes real, paid customer orders. Standard logs show a `200 OK` or successful SQL execution, and the catastrophic data loss is only noticed once customers complain.

### The Preflight Solution
1. **Zero Real Writes During Rehearsal**: The agent runs in `PLAN` mode. All tool calls (reads and writes) are intercepted by the Preflight executor and routed to an **in-memory Shadow Copy** of the database (`createShadow()`).
2. **Row-Level Diffing**: Every write is tracked at the primary key level (`RowOp[]`).
3. **Deterministic Risk Engine + Intent Judge**: Changes are scored from 0–100 with plain-English reasons (e.g., *"Includes 38 paid orders worth ₹2.1L"*), identifying duplicate refunds and production volume deletions.
4. **Human Decision Gate**: The human operator reviews diff cards, excludes specific flagged rows (e.g. unticking real paid orders), approves safe mutations, and provides typed confirmation for CRITICAL threats.
5. **Atomic Apply**: Only approved row operations are replayed in a single database transaction after a snapshot is taken.
6. **Hash-Proven Undo**: If an operator clicks Undo, the pre-apply snapshot is restored and verified against the pre-apply SHA-256 canonical table hash.

---

## 2. Phase 0: Foundation & Contracts

### 2.1 Monorepo Architecture & Tooling
Preflight is structured as an **npm-workspaces** monorepo:
* **`shared/` (`@preflight/shared`)**: Single source of truth for all types and data models.
* **`server/` (`@preflight/server`)**: Express 4 backend running under Node 22+ with `better-sqlite3`, `tsx`, and `vitest`.
* **`web/` (`@preflight/web`)**: Modern React 18 client bootstrapped with Vite, Tailwind CSS, Framer Motion, and Lucide React.

### 2.2 Strict TypeScript Configuration
Strict typing is enforced across all packages via `tsconfig.base.json`:
* `strict: true`
* `noImplicitAny: true`
* `strictNullChecks: true`
* `noUnusedLocals: true`
* `noUnusedParameters: true`
* Zero `any` policy in shared types.

### 2.3 Frozen Shared Types (`shared/src/types.ts`)
Implemented exactly as mandated in PRD Section 5:

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

### 2.4 API Contracts (`docs/CONTRACTS.md`)

| Endpoint | Method | Payload / Response | Description |
| :--- | :---: | :--- | :--- |
| `/api/runs` | `POST` | Body: `{ task, scenario, mode? }`<br>Resp: `{ runId }` | Starts async plan run; mode defaults to env `MODE` |
| `/api/runs/:id/stream` | `GET` | SSE Stream (`step`, `plan_ready`, `error`) | Live telemetry for tool steps |
| `/api/runs/:id` | `GET` | Resp: `Run` | Complete run object including diffs and hashes |
| `/api/runs/:id/decisions`| `POST` | Body: `{ changeId, decision, excludedPks?, confirmText? }`<br>Resp: `Change` | Stores approvals; enforces `'I ACCEPT THE RISK'` for CRITICAL |
| `/api/runs/:id/revise` | `POST` | Body: `{ notes }`<br>Resp: `{ planVersion }` | Reruns agent with human feedback |
| `/api/runs/:id/apply` | `POST` | Resp: `{ hashes: { base, afterApply }, applied: n }` | Replays approved row operations in 1 transaction |
| `/api/runs/:id/undo` | `POST` | Resp: `{ hashes: { base, afterUndo }, match: boolean }` | Restores snapshot; verifies pre-apply hash match |
| `/api/db/hash` | `GET` | Resp: `{ hash }` | Live canonical hash for the on-screen badge |
| `/api/health` | `GET` | Resp: `{ status: 'ok', mode, model, timestamp }` | Server health check endpoint |

### 2.5 Server & Web Baseline
* **Server Config (`server/src/config.ts`)**: Reads `PORT` (default 3001), `MODE` (`live` | `replay`), `MODEL` (`claude-3-5-sonnet-20241022`), and `ANTHROPIC_API_KEY`.
* **Server App (`server/src/app.ts`)**: Express 4 app configured with CORS, JSON body parser, and `GET /api/health`.
* **AI Skills**: Installed `impeccable` into `.agents/skills/impeccable` and registered `.agents/rules/frontend-intelligence.md`.

---

## 3. Phase 1: Data World, Shadow DB & Hashing

### 3.1 ChaiCraft SQLite Schema (`server/src/db/schema.ts`)
Created 7 tables using `better-sqlite3`:
1. **`customers`**: `id INTEGER PRIMARY KEY, name TEXT, email TEXT, city TEXT`
2. **`orders`**: `id INTEGER PRIMARY KEY, customer_id INTEGER, amount_inr INTEGER, status TEXT, paid INTEGER, is_test INTEGER, created_at TEXT`
3. **`complaints`**: `id INTEGER PRIMARY KEY, order_id INTEGER, customer_id INTEGER, reason TEXT`
4. **`refunds`**: `id INTEGER PRIMARY KEY, order_id INTEGER, amount_inr INTEGER, reason TEXT, status TEXT`
5. **`email_outbox`**: `id INTEGER PRIMARY KEY, to_email TEXT, subject TEXT, body TEXT`
6. **`infra_volumes`**: `id TEXT PRIMARY KEY, name TEXT, environment TEXT, is_backup INTEGER, status TEXT`
7. **`files`**: `path TEXT PRIMARY KEY, content TEXT`

### 3.2 Deterministic Seeding Pipeline (`server/src/db/seed.ts`)
Uses a fixed-seed Mulberry32 PRNG (seed `42`) to produce 100% reproducible data across runs:

```typescript
// Mulberry32 32-bit PRNG
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

#### Exact Data Breakdown:
* **Customers (300)**: Profiles with Indian names across 10 major metropolitan cities.
* **Orders (5,000 Total)**:
  * **4,700 Delivered Real Orders**: `status = 'delivered'`, `paid = 1`, `is_test = 0`.
  * **262 Test Orders**: `status = 'test'`, `is_test = 1`, `paid = 0`.
  * **38 Processing Paid Real Orders**: `status = 'processing'`, `paid = 1`, `is_test = 0`, summing to exactly **₹2,10,000** (≈ ₹2.1L).
* **Complaints (50 Total)**:
  * All 50 complaints specify reason `'damaged parcel'`.
  * **41 Distinct Orders**: Totalling **₹96,400**.
  * **9 Duplicate Complaints** on orders 1–9: Totalling **₹10,500**.
  * Total combined refund value: **₹1,06,900** (₹96,400 + ₹10,500).
* **Infrastructure Volumes (3 Total)**:
  * `staging-db`: `environment = 'staging'`, `is_backup = 0`, `status = 'active'`
  * `prod-db`: `environment = 'production'`, `is_backup = 0`, `status = 'active'`
  * `prod-db-backup`: `environment = 'production'`, `is_backup = 1`, `status = 'active'`
* **Virtual Files (2 Total)**:
  * `.env.staging`: Contains a database credential mismatch.
  * `ops-notes.txt`: Contains an emergency production token leak (`PROD_TOKEN_SECRET_9872138947`).

### 3.3 Database Primitives

#### Primitive 1: In-Memory Shadow DB (`server/src/db/shadow.ts`)
```typescript
export function createShadow(base: string | Database.Database): Database.Database {
  let buffer: Buffer;
  if (typeof base === 'string') {
    const baseDb = new Database(base, { readonly: true });
    buffer = baseDb.serialize();
    baseDb.close();
  } else {
    buffer = base.serialize();
  }
  return new Database(buffer); // Instantiated in memory
}
```
* **Execution Isolation**: When `createShadow()` is invoked, the entire on-disk state is serialized to a binary Buffer and loaded into RAM.
* **Query Consistency**: Any subsequent writes (e.g. `INSERT INTO refunds`) land purely in the shadow instance, allowing later tool calls in the same session to see the staged mutations while the physical `base.db` file on disk remains 100% unaltered.

#### Primitive 2: Canonical SHA-256 Hashing (`server/src/db/hash.ts`)
```typescript
export const TRACKED_TABLES = [
  'complaints',
  'customers',
  'email_outbox',
  'infra_volumes',
  'orders',
  'refunds'
];

export function hashDb(db: Database.Database, tables: string[] = TRACKED_TABLES): string {
  const sortedTables = [...tables].sort();
  const hash = crypto.createHash('sha256');

  for (const table of sortedTables) {
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (tableExists) {
      const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();
      hash.update(table + ':' + JSON.stringify(rows));
    }
  }
  return hash.digest('hex');
}
```
* **Deterministic Output**: Because tables are sorted alphabetically and rows are read by `rowid`, every fresh seed produces the exact identical canonical SHA-256 hash:
  `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`

#### Primitive 3: Snapshot & Restore (`server/src/db/snapshot.ts`)
* `snapshot(runId)`: Copies `data/base.db` to `snapshots/${runId}.db` prior to executing an Apply action.
* `restore(runId)`: Copies `snapshots/${runId}.db` back over `data/base.db` when an operator invokes Undo. Enables immediate mathematical proof that `afterUndo` hash matches the original `base` hash.

---

## 4. Frontend Experience & Design Polish

The frontend in `web/` was developed to satisfy the highest craft standards outlined in Frontend Intelligence:
* **Typography**: Imported Google Fonts **Inter** (for crisp legibility) and **JetBrains Mono** (for cryptographic hashes, currency values, and SQL syntax).
* **Color System**: Dark Slate base (`#030712`, `bg-slate-950`), warm Orange primary accent (`#f97316`), and dedicated PRD risk tokens:
  * Low: Emerald (`#10b981`)
  * Medium: Amber (`#f59e0b`)
  * High: Orange-Red (`#ea580c`)
  * Critical: Crimson Red (`#ef4444`)
* **Live Interactive Components**:
  * **"0 Real Writes" Badge**: A pulsing status indicator proving zero writes have reached the disk.
  * **Interactive Shadow DB Visualizer**: An interactive panel where operators can click **"Simulate Shadow Write"** to watch staged mutations increment in RAM while the base disk hash remains completely locked and unchanged.
  * **Scenario Inspector**: Previews for:
    * **Scenario A (Dangerous Cleanup)**: 300 orders targeted (262 test + 38 real paid orders worth ₹2.1L).
    * **Scenario B (Money & Messages)**: 50 refunds totaling ₹1,06,900 with 9 duplicate complaints flagged (₹10,500).
    * **Scenario C (Incident Replay)**: Token read leading to `infra.deleteVolume` on `prod-db` and `prod-db-backup` (CRITICAL threat).

---

## 5. Verification Matrix & Acceptance Test Results

All acceptance criteria across Phase 0 and Phase 1 pass without warnings:

```
> npm test

 ✓ tests/hash.test.ts  (2 tests)
   - produces identical hash when seeded twice (deterministic) -> PASS
   - verifies exact PRD counts and totals -> PASS
 ✓ src/health.test.ts  (1 test)
   - GET /api/health returns 200 and valid JSON -> PASS
 ✓ tests/shadow.test.ts  (2 tests)
   - guarantees shadow DB isolation: writes to shadow do not change base hash -> PASS
   - verifies snapshot -> mutate base -> restore -> hash equals original -> PASS
 ✓ src/App.test.ts  (1 test)
   - web workspace smoke test -> PASS

 Test Files  4 passed (4)
      Tests  6 passed (6) (100% GREEN)
```

```
> npm run seed
> npm run seed

[ChaiCraft Seed] Successfully seeded database:
- Customers: 300
- Orders: 5000 (Test: 262, Paid Processing: 38 totaling ₹210000)
- Complaints: 50 (Distinct: 41 totaling ₹96400, Duplicates: 9 totaling ₹10500)
- Total Complaints Amount: ₹106900
- Canonical Hash: 28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385 (MATCHES 100%)
```

```
> npm run build
- shared: tsc -> 0 errors
- server: tsc -> 0 errors
- web: tsc && vite build -> 0 errors (built in 4.62s)
```

---

## 6. Complete File Inventory

| File Path | Phase | Role / Content |
| :--- | :---: | :--- |
| `package.json` | 0 | Root monorepo definition and lifecycle scripts |
| `tsconfig.base.json` | 0 | Strict TypeScript base compiler configuration |
| `.gitignore` | 0 & 1 | Clean production git ignore rules (builds, local `.db`, temp files) |
| `docs/PRD.md` | 0 | Full 20-page PRD specification saved as Markdown |
| `docs/CONTRACTS.md` | 0 | Shared types and REST + SSE API specification |
| `docs/PHASE_0_1_COMPLETE.md` | 0 & 1 | Consolidated master document (this file) |
| `docs/handoff/phase-0.md` | 0 | Phase 0 handoff log |
| `docs/handoff/phase-1.md` | 1 | Phase 1 handoff log |
| `shared/package.json` | 0 | Shared package definition |
| `shared/src/types.ts` | 0 | Frozen core types (`Row`, `Pk`, `RowOp`, `Risk`, `Change`, `Step`, `Run`) |
| `server/package.json` | 0 & 1 | Express server package definition with `better-sqlite3` and `vitest` |
| `server/src/config.ts` | 0 | Environment configuration reader (`PORT`, `MODE`, `MODEL`, etc.) |
| `server/src/app.ts` | 0 | Express application setup with `GET /api/health` |
| `server/src/index.ts` | 0 | HTTP listener entry point |
| `server/src/seed.ts` | 1 | CLI seed runner for `npm run seed` |
| `server/src/db/schema.ts` | 1 | ChaiCraft 7-table SQLite schema |
| `server/src/db/seed.ts` | 1 | Deterministic Mulberry32 seeding implementation |
| `server/src/db/shadow.ts` | 1 | In-memory shadow database factory |
| `server/src/db/hash.ts` | 1 | Canonical SHA-256 database hashing |
| `server/src/db/snapshot.ts` | 1 | File-based snapshot and restore primitives |
| `server/tests/hash.test.ts` | 1 | Vitest suite for seed determinism and exact counts |
| `server/tests/shadow.test.ts` | 1 | Vitest suite for shadow isolation and snapshot rollback |
| `server/src/health.test.ts` | 0 | Vitest suite for `GET /api/health` |
| `web/package.json` | 0 | React 18, Vite, Tailwind CSS, Framer Motion, and Lucide React |
| `web/index.html` | 1 | HTML entry point with Google Fonts Inter & JetBrains Mono |
| `web/tailwind.config.js` | 1 | Custom palette, typography, and PRD risk color tokens |
| `web/src/index.css` | 1 | Global Tailwind directives and ambient radial background styling |
| `web/src/App.tsx` | 1 | Interactive dashboard, shadow visualizer, and scenario inspector |
| `web/src/App.test.ts` | 0 | Web workspace smoke test |

---

## 7. Next Step: Phase 2 Handoff (Tools, Executor & Diff Engine)

Preflight is fully primed for **Phase 2 of 8**:
* **Tools (`server/src/tools/`)**: Implement the 7 tools (`db.query`, `db.execute`, `payments.refund`, `email.send`, `fs.read`, `infra.listVolumes`, `infra.deleteVolume`).
* **Diff Engine (`server/src/executor/diff.ts`)**: Read state before and after tool calls, diff table maps, and produce `RowOp[]`.
* **Plan Executor (`server/src/executor/planExecutor.ts`)**: Execute all tool calls on the shadow instance and assert base hash unchanged.
* **Grouping (`server/src/executor/group.ts`)**: Group `RowOp`s into structured `Change` objects with human summaries and risk placeholders.
