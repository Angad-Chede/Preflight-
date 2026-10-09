# Preflight — Phase 0 & Phase 1 Comprehensive Engineering Report

**Project**: Preflight (AI Agent Rehearsal & Dry-Run Engine)  
**Timeline**: Hackathon Build (Phase 0 and Phase 1 Complete)  
**Status**: All Tests Green (6/6 Vitest Passed), Build Verified, Deterministic Hash Verified  

---

## 1. Executive Summary

Preflight is an execution safety harness for AI coding and operations agents. When an agent is assigned a task with database credentials, Preflight intercepts the writes and runs the entire session against an in-memory **Shadow Copy** of the data. 

* The real database remains **100% untouched** (guaranteed with a live `0 Real Writes` badge).
* Preflight records row-level diffs, scores risks deterministically, and presents a visual review plan to human operators.
* Once approved, operations are replayed in a single atomic transaction with snapshot rollback capability.
* Post-undo verification uses cryptographic SHA-256 canonical table hashing to prove the data returned to its exact pristine state.

This document details all work completed across **Phase 0 (Foundation & Contracts)** and **Phase 1 (Data World, Shadow DB & Hashing)**.

---

## 2. Phase 0: Foundation & Contracts

### 2.1 Monorepo Architecture
Configured an **npm-workspaces** monorepo containing three interconnected packages:
* **`shared` (`@preflight/shared`)**: Single source of truth for contracts and TypeScript types.
* **`server` (`@preflight/server`)**: Express 4 backend with TypeScript, better-sqlite3, and vitest.
* **`web` (`@preflight/web`)**: Vite React 18 client with Tailwind CSS, Framer Motion, and Lucide React.

### 2.2 Root Scripts & Workspaces
Defined uniform lifecycle scripts in root [package.json](file:///c:/Users/USER/OneDrive/Desktop/Preflight/package.json):
* `npm run dev`: Concurrently runs server (port 3001) and web frontend (port 3000).
* `npm test`: Executes vitest suites across all workspaces simultaneously.
* `npm run seed`: Executes the deterministic database seeding pipeline.
* `npm run e2e`: Executes end-to-end acceptance checks.
* `npm run build`: Type-checks and compiles all workspaces (`tsc` + `vite build`).

### 2.3 Strict TypeScript Baseline
Enforced across the entire monorepo in [tsconfig.base.json](file:///c:/Users/USER/OneDrive/Desktop/Preflight/tsconfig.base.json):
* `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
* `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noImplicitReturns": true`
* Zero `any` policy in shared contracts.

### 2.4 Frozen Shared Types ([shared/src/types.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/shared/src/types.ts))
Implemented exactly as specified in PRD Section 5:
* **`Row`**: `Record<string, string | number | null>`
* **`Pk`**: `string | number`
* **`Effect`**: `'READ' | 'WRITE' | 'EXTERNAL' | 'IRREVERSIBLE'`
* **`Level`**: `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`
* **`RowOp`**: Atomic row-level mutation (`insert`, `update`, `delete`) with before/after state, primary key, step number, and anomaly flags.
* **`Risk`**: Score (0–100), severity level, and plain-English reasons.
* **`Change`**: Grouped changes by tool and table, capturing blast radius, amounts, recipients, and approval status (`pending`, `approved`, `rejected`).
* **`Step`**: Agent tool execution telemetry.
* **`Run`**: Lifecycle state machine (`running`, `planned`, `applied`, `undone`, `failed`) holding cryptographic base, pre-apply, and post-undo hashes.

### 2.5 API Contracts ([docs/CONTRACTS.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/docs/CONTRACTS.md))
Specified all endpoints with request/response schemas:
* `POST /api/runs`: Initiates asynchronous rehearsal run.
* `GET /api/runs/:id/stream`: SSE stream broadcasting step progression and plan readiness.
* `GET /api/runs/:id`: Pollable full run state.
* `POST /api/runs/:id/decisions`: Approves/rejects changes and enforces typed confirmation for CRITICAL cards (`'I ACCEPT THE RISK'`).
* `POST /api/runs/:id/revise`: Re-runs agent with rejection feedback.
* `POST /api/runs/:id/apply`: Atomic transaction application of approved row ops.
* `POST /api/runs/:id/undo`: Rollback via snapshot with SHA-256 hash validation.
* `GET /api/db/hash`: Live base hash for badge polling.
* `GET /api/health`: Health status, runtime mode, and model configuration.

### 2.6 Server Configuration & Health Endpoint
* [server/src/config.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/config.ts): Reads `PORT` (default 3001), `MODE` (`live` | `replay`), `MODEL` (`claude-3-5-sonnet-20241022`), and `ANTHROPIC_API_KEY`.
* [server/src/app.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/app.ts): Implements `GET /api/health` with automated tests in [server/src/health.test.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/health.test.ts).

### 2.7 AI Skills & Design Intelligence
* Installed **Impeccable** design system CLI tools into `.agents/skills/impeccable`.
* Integrated **Frontend Intelligence** knowledge base into [.agents/rules/frontend-intelligence.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/.agents/rules/frontend-intelligence.md), setting rules for typography, spacing, motion physics, and accessible interactions.

---

## 3. Phase 1: Data World, Shadow DB & Hashing

### 3.1 ChaiCraft SQLite Schema ([server/src/db/schema.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/schema.ts))
Built with `better-sqlite3`, representing the ChaiCraft business domain:
1. `customers(id, name, email, city)`
2. `orders(id, customer_id, amount_inr, status, paid, is_test, created_at)`
3. `complaints(id, order_id, customer_id, reason)`
4. `refunds(id, order_id, amount_inr, reason, status)`
5. `email_outbox(id, to_email, subject, body)`
6. `infra_volumes(id, name, environment, is_backup, status)`
7. `files(path, content)`

### 3.2 Deterministic Seeding Pipeline ([server/src/db/seed.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/seed.ts))
Uses a fixed-seed Mulberry32 PRNG (seed `42`) to produce 100% reproducible data across runs:

| Table / Slice | Count | Details & Exact PRD Specifications |
| :--- | :--- | :--- |
| **Customers** | 300 | Indian customer names across 10 major metropolitan cities |
| **Delivered Orders** | 4,700 | Real customer purchases (`status = 'delivered'`, `paid = 1`, `is_test = 0`) |
| **Test Orders** | 262 | Automated test rows (`status = 'test'`, `is_test = 1`, `paid = 0`) |
| **Paid Processing Orders** | 38 | Real paid orders in processing (`status = 'processing'`, `paid = 1`, `is_test = 0`), totaling **₹2,10,000** (≈ ₹2.1L) |
| **Total Orders** | **5,000** | Sum of delivered (4,700) + test (262) + processing (38) |
| **Distinct Complaints** | 41 | Damaged parcel complaints across 41 distinct orders, totaling **₹96,400** |
| **Duplicate Complaints** | 9 | Duplicate complaints for orders 1–9, totaling **₹10,500** |
| **Total Complaints** | **50** | Total order amount at stake = **₹1,06,900** (₹96,400 + ₹10,500) |
| **Infra Volumes** | 3 | `staging-db` (staging), `prod-db` (production), `prod-db-backup` (production backup) |
| **Virtual Files** | 2 | `.env.staging` (mismatched password) and `ops-notes.txt` (leaked production emergency token) |

### 3.3 Core Database Primitives

#### 1. In-Memory Shadow DB ([server/src/db/shadow.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/shadow.ts))
* Function: `createShadow(base: string | Database.Database): Database.Database`
* Implementation: Serializes the on-disk SQLite database into a binary Buffer using `base.serialize()`, then initializes an in-memory SQLite database instance with `new Database(buffer)`.
* Guarantee: Rehearsal tool execution occurs purely in RAM. Read queries see pending staged writes, but the physical `base.db` file is completely isolated and untouched.

#### 2. Canonical SHA-256 Hashing ([server/src/db/hash.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/hash.ts))
* Function: `hashDb(db: Database.Database): string`
* Implementation: Iterates over all 6 tracked tables (`complaints`, `customers`, `email_outbox`, `infra_volumes`, `orders`, `refunds`) sorted alphabetically. Queries `SELECT * FROM table ORDER BY rowid`, stringifies rows into canonical JSON, and feeds them into a single Node `crypto.createHash('sha256')`.
* Result: Seeded database consistently yields canonical hash:  
  `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`

#### 3. Snapshot & Atomic Restore ([server/src/db/snapshot.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/snapshot.ts))
* `snapshot(runId)`: Copies `data/base.db` to `snapshots/${runId}.db` before any apply operation.
* `restore(runId)`: Restores `snapshots/${runId}.db` over `data/base.db` on undo, enabling instant mathematical equality verification.

### 3.4 Automated Verification Suites
Located in [server/tests/](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/tests):
1. **`tests/hash.test.ts`**:
   * Seeds database twice in independent memory instances; asserts exact SHA-256 hash match.
   * Asserts exact counts: 5,000 orders, 262 test orders, 38 processing paid orders (summing to ₹2,10,000), 50 complaints, and ₹1,06,900 refund potential.
2. **`tests/shadow.test.ts`**:
   * **Shadow Isolation**: Writes heavy mutations (deleting test orders, inserting refunds) into the shadow instance; asserts shadow hash changes while `base.db` hash remains 100% identical.
   * **Snapshot Round-Trip**: Snapshots base DB -> mutates base DB -> restores from snapshot -> proves restored hash is strictly identical to pre-apply hash.
3. **`src/health.test.ts`**:
   * Supertest integration test confirming `GET /api/health` returns status `200` with active configuration.

---

## 4. Frontend Experience & Craft Polish

In accordance with frontend intelligence design principles, the UI in [web/](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web) was upgraded:
* **Typography**: Imported Google Fonts **Inter** (for UI clarity) and **JetBrains Mono** (for cryptographic hashes, currency figures, and SQL previews).
* **Color System**: Dark Slate base (`bg-slate-950`), warm Orange primary accent (`#f97316`), and dedicated PRD risk tokens:
  * Low Risk: Emerald (`#10b981`)
  * Medium Risk: Amber (`#f59e0b`)
  * High Risk: Orange-Red (`#ea580c`)
  * Critical: Crimson Red (`#ef4444`)
* **Live Interactive Features**:
  * **"0 Real Writes" Live Badge**: Pulsing indicator reflecting zero disk mutations.
  * **Interactive Shadow DB Visualizer**: Allows users to click "Simulate Shadow Write" to watch staged mutations increment in RAM while the base database disk hash remains locked and protected.
  * **Scenario Picker**: Interactive inspection cards for Scenario A (Dangerous Cleanup), Scenario B (Money & Messages), and Scenario C (Incident Replay).

---

## 5. File Inventory & Status Matrix

| Path | Phase | Role / Description | Status |
| :--- | :---: | :--- | :---: |
| [package.json](file:///c:/Users/USER/OneDrive/Desktop/Preflight/package.json) | 0 | Root monorepo configuration with `dev`, `test`, `seed`, `e2e` scripts | Complete |
| [tsconfig.base.json](file:///c:/Users/USER/OneDrive/Desktop/Preflight/tsconfig.base.json) | 0 | Strict TypeScript base compiler configuration | Complete |
| [.gitignore](file:///c:/Users/USER/OneDrive/Desktop/Preflight/.gitignore) | 0 | Production ignore rules (builds, local `.db`, keys, test artifacts) | Complete |
| [docs/PRD.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/docs/PRD.md) | 0 | Full 20-page PRD specification saved as Markdown | Complete |
| [docs/CONTRACTS.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/docs/CONTRACTS.md) | 0 | Data models & API contracts documentation | Complete |
| [shared/src/types.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/shared/src/types.ts) | 0 | Frozen shared contracts (Row, Pk, RowOp, Change, Risk, Run) | Complete |
| [server/src/config.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/config.ts) | 0 | Runtime environment configuration loader | Complete |
| [server/src/app.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/app.ts) | 0 | Express application setup with `GET /api/health` | Complete |
| [server/src/db/schema.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/schema.ts) | 1 | 7-table SQLite schema creation | Complete |
| [server/src/db/seed.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/seed.ts) | 1 | Deterministic Mulberry32 seeding algorithm | Complete |
| [server/src/db/shadow.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/shadow.ts) | 1 | In-memory shadow database factory | Complete |
| [server/src/db/hash.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/hash.ts) | 1 | Canonical SHA-256 database hashing | Complete |
| [server/src/db/snapshot.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/src/db/snapshot.ts) | 1 | File-based snapshot & restore primitives | Complete |
| [server/tests/hash.test.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/tests/hash.test.ts) | 1 | Vitest suite for seed determinism & exact counts | Complete |
| [server/tests/shadow.test.ts](file:///c:/Users/USER/OneDrive/Desktop/Preflight/server/tests/shadow.test.ts) | 1 | Vitest suite for shadow isolation & snapshot rollback | Complete |
| [web/src/App.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/App.tsx) | 1 | High-craft dashboard, shadow simulator & scenario inspector | Complete |
| [docs/handoff/phase-0.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/docs/handoff/phase-0.md) | 0 | Phase 0 handoff log | Complete |
| [docs/handoff/phase-1.md](file:///c:/Users/USER/OneDrive/Desktop/Preflight/docs/handoff/phase-1.md) | 1 | Phase 1 handoff log | Complete |

---

## 6. How to Verify Everything

Run these commands from the root directory to confirm system health:

```bash
# 1. Verify all automated tests across workspaces
npm test

# 2. Verify deterministic seed output (run twice and compare hash)
npm run seed
npm run seed

# 3. Verify clean production build across all workspaces
npm run build

# 4. Start development server (concurrently runs server :3001 & web :3000)
npm run dev
```

---

## 7. Upcoming Phase: Phase 2 (Tools, Executor & Diff Engine)

* Implement the 7 agent tools in `server/src/tools/` (`manifest.ts`, `impl.ts`).
* Implement the diff engine in `server/src/executor/diff.ts` to map row mutations into `RowOp[]`.
* Implement `server/src/executor/planExecutor.ts` to execute tool calls on the shadow copy and enforce the base-hash-unchanged guarantee.
* Implement `server/src/executor/group.ts` to group `RowOp`s into structured `Change` objects.
