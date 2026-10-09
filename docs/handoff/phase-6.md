# Phase 6 Handoff: Frontend UI (React + Tailwind + Framer Motion)

**Goal**: Build a light-themed, professional frontend UI inspired by the design brief and reference layout, connecting all Phase 5 backend APIs with live SSE streaming, risk-sorted cards, diff tables, flagged-row exclusion, CRITICAL typed confirm, sticky apply bar, revision workflows, receipt panel, and instant snapshot undo with hash-match verification.  
**Result**: Complete, tested, fully responsive at 390px+, and verified with 0 compilation errors.

---

## 1. What Exists

### 1.1 Architecture & Visual Design
- **Light Theme & Glassmorphism**: Clean off-white canvas (`#fafafc`) with subtle ambient radial illumination, floating glassy pill navbar (`backdrop-blur-xl bg-white/80 border border-slate-200/90 shadow-[0_6px_30px_rgba(15,23,42,0.04)]`), and elevated cards with soft slate borders.
- **Reference-Inspired Pipeline**: [ArchitectureFlow.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/ArchitectureFlow.tsx) visualizes the 4-stage safety flow:
  `[ 1. AGENT TASK ] ---> [ 2. SHADOW REHEARSAL (0 WRITES) ] ---> [ 3. RISK & DRIFT ENGINE ] ---> [ 4. CONTROLLED APPLY ]`
- **Zero Emoji Clutter**: Strict, professional typography using **Plus Jakarta Sans** and **Inter** paired with clean **Lucide** icons.
- **Responsive Layout**: Designed and styled with flexible grids and overflow handling down to 390px mobile viewports.

### 1.2 Core Components & Features
1. [Navbar.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/Navbar.tsx)
   - Brand logo with safety shield icon and uppercase Preflight wordmark.
   - Live **"0 Real Writes"** base hash badge polling `/api/db/hash` (pulsating indicator, truncated SHA-256 checksum with one-click copy).
   - Real-time backend connectivity status pill (`:3001`).

2. [ScenarioPicker.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/ScenarioPicker.tsx)
   - Interactive selector for Scenarios **A** (Cleanup), **B** (Refunds & Duplicates), **C** (Incident Replay), and **Custom**.
   - Mode switcher: **Replay** (Fast & Deterministic default) vs. **Live Groq** (with automatic TPM free-tier badge safeguard).
   - Launch Rehearsal button with spinner state.

3. [StepTimeline.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/StepTimeline.tsx)
   - Live event stream (SSE) capturing each tool execution step in real time.
   - Shows step index, tool type icon, execution latency, formatted arguments, and expandable inspector for raw output.

4. [PlanSummary.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/PlanSummary.tsx)
   - Dynamic plan version badge (v1, v2...) and reviewer rejection feedback callout banner.
   - Real-time metrics grid computed directly from API data:
     - Total proposed changes & rows affected
     - Financial transaction exposure (formatted in Indian Rupee format e.g. `₹1,06,900`)
     - Peak risk level badge (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
     - Intent drift score (0.00 – 1.00)
   - "Reject & Request Safer Plan" button.

5. [ChangeCard.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/ChangeCard.tsx)
   - Sorted in descending order of risk priority (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`).
   - Detailed header: Tool, Target, Effect (`WRITE`, `EXTERNAL`, `IRREVERSIBLE`), Scope (`production` / `staging`).
   - Multi-vector risk explanation list with plain-English reasons citing real data.
   - Intent drift progress bar with AI rationale.
   - **Interactive Diff Table**:
     - Shows row primary keys, operation type (`insert`, `update`, `delete`), before/after states, and anomaly flags (`paid-real-order`, `duplicate-refund`, `backup-volume`).
     - **Flagged-Row Exclusion Checkbox**: Toggling row checkboxes adds/removes PKs from `excludedPks` via `/api/runs/:id/decisions` with immediate visual strikethrough styling.

6. [CriticalConfirmModal.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/CriticalConfirmModal.tsx)
   - Enforces the strict safety rule: Approving any `CRITICAL` change requires typing `'I ACCEPT THE RISK'` exactly before the submit button unlocks.

7. [ReviseModal.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/ReviseModal.tsx)
   - Modal to provide reviewer notes to the agent.
   - Includes quick-suggestion chips tailored to the active scenario.
   - Submits to `/api/runs/:id/revise` to generate plan version v+1.

8. [StickyApplyBar.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/StickyApplyBar.tsx)
   - Floating action dock showing approved changes count and warning pills for approved High/Critical items.
   - "Apply Approved Changes" button triggering atomic snapshot transaction.

9. [ReceiptPanel.tsx](file:///c:/Users/USER/OneDrive/Desktop/Preflight/web/src/components/ReceiptPanel.tsx)
   - Summarizes applied changes and records `afterApply` hash.
   - "Undo All Changes" button calling `/api/runs/:id/undo`.
   - **Hash-Match Restoration Banner**: Celebratory checkmark banner confirming that `afterUndo` strictly equals `base` hash (`match === true`).

---

## 2. Verification

| Check | Result |
|---|---|
| `npm run build` | **Passed (0 errors)** across `@preflight/shared`, `@preflight/server`, and `@preflight/web` |
| `npm test` | **Passed (100% green)** across all 8 test suites (33 tests) |
| Scenario A (Cleanup) | Replays in shadow: 300 deletions (38 paid orders flagged) -> Revision safely filters to 262 test orders -> Apply & Undo verified |
| Scenario B (Refunds) | Replays 50 refunds (₹1,06,900) -> 9 duplicates flagged -> Row exclusion & approval flow verified |
| Scenario C (Incident) | Flags CRITICAL on prod-db deletion -> Typed confirm modal enforced -> Revision yields 0 changes |
| Viewport Responsiveness | Fully usable at 390px (mobile) through 1920px (desktop) |

---

## 3. Handoff to Phase 7 (Integration & E2E)
- Phase 6 successfully connects the real backend API with the frontend client.
- Ready for Phase 7:
  - Automated E2E verification test suite.
  - Security audit: Verify SQL guard blocks `ATTACH DATABASE` isolation bypass.
  - Secret leak sweep: Ensure zero API keys or secrets are committed.
  - Reset endpoints and reset controls.
