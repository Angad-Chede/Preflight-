# Phase 8 Handoff: Polish, Documentation, Rehearsal & Offline Reliability

**Goal**: Complete Phase 8 of 8:
1. Master `README.md` documenting the system, the 9-second problem story, architecture flow, the three incident scenarios, full REST & SSE API reference, security isolation guarantees, and setup commands.
2. Verification of offline reliability (all scenarios run from deterministic fixtures without network or external LLM dependencies).
3. Final build, typecheck, and test matrix across all 3 workspaces.

**Result**: 100% complete, 100% green tests (43/43 tests passing), 0 TypeScript errors, production bundles built.

---

## 1. What Exists & Was Completed

### 1.1 Complete Monorepo Overview
Across 8 development phases, the complete Preflight engine has been constructed:
- **Phase 0 & 1**: Monorepo foundation, frozen contracts (`@preflight/shared`), ChaiCraft 7-table SQLite schema, deterministic Mulberry32 seed (`28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`), in-memory shadow database factory (`createShadow()`), canonical SHA-256 table hashing, and filesystem snapshotting.
- **Phase 2**: The 7 sandboxed tools, SQL injection and sandbox guard (`ATTACH`, `PRAGMA`, comment stripping), row-level diff engine before/after maps (`RowOp[]`), plan executor with step tagging and base hash immutability assertions, and grouping into `Change` objects.
- **Phase 3**: Deterministic risk engine (0–100 score, `LOW`/`MEDIUM`/`HIGH`/`CRITICAL` levels, plain-English reasons citing real numbers), financial blast radius calculation, anomaly detectors (`paid-real-order`, `duplicate-refund`, `backup-volume`), and LLM intent-drift judge interface with heuristic fallback.
- **Phase 4**: Groq LLM integration via OpenAI client SDK (`baseURL: LLM_BASE_URL`), exponential backoff retry on HTTP 429 rate limits, live tool-calling loop (max 10 steps, truncated outputs), and deterministic replay engine with fixtures for Scenarios A, B, C and revisions.
- **Phase 5**: Orchestrator service with SSE streaming (`step`, `plan_ready`, `error`), JSON persistence in `runs/{runId}.json`, atomic transaction apply with snapshot, hash-proven undo with pre-apply hash comparison, and strict typed confirmation for `CRITICAL` changes.
- **Phase 6**: High-fidelity frontend (React 18 + Vite + Tailwind + Framer Motion) with a clean light theme, floating glassmorphic navbar with live "0 Real Writes" base hash badge, interactive pipeline flow diagram, scenario picker, live step timeline, plan summary, diff tables with flagged-row exclusion, typed confirm modal, revise modal, sticky apply bar, and receipt panel.
- **Phase 7**: Security audit test suite (`server/tests/security.test.ts`), `ATTACH DATABASE` isolation bypass defense, secret leak sweep, database reset endpoint (`POST /api/reset`) with frontend Reset button, and automated E2E test suite (`server/tests/e2e.test.ts`).
- **Phase 8**: Master `README.md`, offline reliability verification, demo scripts, and final handoff.

---

## 2. Final Verification Matrix

| Check | Command | Status |
|---|---|---|
| **All Test Suites** | `npm test` | **43 / 43 Passed (100% Green)** |
| **End-to-End Suite** | `npm run e2e` | **4 / 4 Passed** |
| **TypeScript Validation** | `npm run build` | **0 errors across shared, server, web** |
| **Offline Reliability** | Replay mode | **Runs 100% offline with zero network calls** |
| **Database Determinism**| `npm run seed` | Hash: `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385` |

---

## 3. How to Run the Demo

### Option 1: Web Interface
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000):
1. **Scenario A (Dangerous Cleanup)**:
   - Click "Launch Rehearsal".
   - Watch the live step timeline stream.
   - Review proposed deletion of 300 orders: notice the **HIGH Risk** badge and the reason: *"Includes 38 paid orders worth ₹2.1L"*.
   - Click "Reject & Request Safer Plan" and enter: *"Only delete test orders where paid is 0."*
   - Plan v2 appears: 262 orders, **MEDIUM Risk**, 0 paid orders.
   - Click "Apply Approved Changes". Notice base hash changes.
   - Click "Undo All Changes". Notice green banner confirming restored hash matches original base hash!
2. **Scenario B (Money & Messages)**:
   - Select Scenario B.
   - Notice 50 refunds with 9 duplicate complaints flagged.
   - Uncheck the duplicate rows in the diff table to exclude them.
   - Approve and apply: exactly 41 refunds applied (₹96,400).
3. **Scenario C (Incident Replay)**:
   - Select Scenario C.
   - Notice deletion of `prod-db` volume flagged as **CRITICAL**.
   - Attempting to approve prompts the typed confirmation modal requiring typing `'I ACCEPT THE RISK'` exactly.
4. **Reset Database**:
   - Click the "Reset DB" button on the navbar to instantly reset back to the pristine seed state.

### Option 2: CLI Demo Script
```bash
# In a second terminal while server is running:
npm run demo
```
Proves the entire lifecycle (Health -> Hash -> Plan -> Revise -> Approve -> Apply -> Undo -> Hash Match) from the terminal.
