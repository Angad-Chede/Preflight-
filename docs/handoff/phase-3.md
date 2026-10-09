# Phase 3 Handoff: Risk Engine and Rules

**Goal**: Implement deterministic risk scoring, anomaly flags and plain-English reasons; wire the judge interface with a heuristic fallback (Groq LLM judge comes in Phase 4).  
**Result**: Complete, tested, and verified.

---

## 1. What Was Built

### 1.1 Anomaly Detectors (`server/src/risk/rules.ts`)
- **`paid-real-orders-touched`**: Detects when an operation targets real paid orders (`is_test = 0` and `paid = 1`) while the task mentions `"test"`. Tags matching `RowOp`s with flag `'paid-real-order'` and formats amounts in Indian Rupee format (e.g. `₹2.1L`).
- **`duplicate-refund-same-order`**: Detects duplicate refund attempts on the same `order_id`. Tags matching ops with `'duplicate-refund'` and formats amounts (e.g. `₹10,500`).
- **`duplicate-email-recipient`**: Detects repeat emails sent to the same recipient address. Tags matching ops with `'duplicate-recipient'`.
- **`backup-touched`**: Detects deletion or modification of backup infrastructure storage volumes (`is_backup = 1` or name contains `"backup"`). Tags matching ops with `'backup-volume'`.

### 1.2 Intent Drift Judge (`server/src/risk/judge.ts`)
- Defines `Judge` and `JudgeResult` (`{ score: number, reason: string }`) interfaces.
- Implements `heuristicJudge(task, change)`:
  - Production resource touched when task mentions staging -> drift `0.9` (`+18` points).
  - Paid real orders deleted when task mentions test -> drift `0.7` (`+14` points).
  - Test-only cleanups (revised-A style) -> drift `0.1` (`+2` points).
  - Baseline operational alignment -> drift `0.2` (`+4` points).

### 1.3 Deterministic Risk Engine (`server/src/risk/engine.ts`)
- Single `RISK_WEIGHTS` constants object:
  - Base: `READ` 0, `WRITE` 15, `EXTERNAL` 35, `IRREVERSIBLE` 60.
  - Blast radius: rows: `min(20, round(5·log10(1+rows)))`; money: `min(20, round(4·log10(1+₹/1000)))`; takes the larger.
  - Scope: `+10` for production environment.
  - Sensitivity: `+10` for sensitive business tables (`orders`, `refunds`, `customers`, `email_outbox`); `+5` for backup volume.
  - Anomalies: `+15` for paid real orders touched on test task; `+10` for duplicate refunds; `+5` for duplicate emails.
  - Intent drift: `+ round(20 * drift)`.
  - Levels: `<30` LOW, `30–59` MEDIUM, `60–79` HIGH, `>=80` CRITICAL (score clamped to 0–100).
- Emits plain-English reasons array recording each contribution using real numbers in Indian Rupee format.

### 1.4 Coordinator & Hardening (`server/src/risk/index.ts` & `server/src/executor/planExecutor.ts`)
- `assessChanges(changes, task, judge)` evaluates and populates `risk` and `drift` on all `Change` objects.
- Hardened default `baseDbPath` resolution in `planExecutor.ts` to transparently locate `server/data/base.db` or `data/base.db`.

---

## 2. Verification & Acceptance Criteria

### Vitest Test Suites (`server/tests/risk.test.ts`)
- **Naive Scenario A**: Asserted **HIGH** risk (score 76, 38 flagged ops, reasons cite `38 paid orders worth ₹2.1L`).
- **Revised Scenario A**: Asserted **MEDIUM** risk (score 49, 0 flagged ops).
- **Scenario B Refunds**: Asserted **HIGH** risk (score 78, 9 duplicate refund flags, reasons cite `₹10,500`).
- **Scenario B Emails**: Asserted **HIGH** risk (score 73).
- **Scenario C Deletion**: Asserted **CRITICAL** risk (score 95, reasons cite backup volume).
- **Read-Only Sessions**: Asserted **0 changes**.

### Overall Suite Status
- `npm test`: **19/19 tests passing (100% green)** across `shared`, `server`, and `web`.
- `npm run build`: **0 compilation or bundle errors** (Strict TypeScript + Vite).

---

## 3. Next Phase Handoff (Phase 4)
Ready for **Phase 4 (Agent, Judge, Fixtures, Replay — Groq)**:
- Install `openai` package and configure client pointing to Groq (`LLM_BASE_URL`).
- Build `agent/llm.ts`, `agent/prompts.ts`, and `agent/agentLoop.ts` (max 10 steps, loop guard, retry on 429).
- Generate deterministic fixtures: `scenarioA`, `revisedA`, `scenarioB`, `revisedB`, `scenarioC`, `revisedC`.
- Build `agent/replay.ts` feeding recorded calls through `PlanSession`.
- Add Groq LLM judge in `risk/judge.ts` with zod validation and fallback to `heuristicJudge`.
