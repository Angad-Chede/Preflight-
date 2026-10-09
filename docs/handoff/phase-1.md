# Phase 1 Handoff: Data World, Shadow DB and Hashing

## Summary
Completed Phase 1 of 8 for Preflight:
1. **ChaiCraft SQLite Schema (`server/src/db/schema.ts`)**:
   - `customers(id, name, email, city)`
   - `orders(id, customer_id, amount_inr, status, paid, is_test, created_at)`
   - `complaints(id, order_id, customer_id, reason)`
   - `refunds(id, order_id, amount_inr, reason, status)`
   - `email_outbox(id, to_email, subject, body)`
   - `infra_volumes(id, name, environment, is_backup, status)`
   - `files(path, content)`
2. **Deterministic Seed (`server/src/db/seed.ts`)**:
   - Built using fixed pseudo-random Mulberry32 PRNG (seed 42).
   - 300 Indian customers.
   - 5,000 orders:
     - 4,700 delivered real orders.
     - 262 test orders (`status = 'test'`, `is_test = 1`, `paid = 0`).
     - 38 real paid orders in status `'processing'` totalling exactly ₹2,10,000 (≈ ₹2.1L).
   - 50 complaints about `'damaged parcel'`:
     - 41 distinct orders totalling ₹96,400.
     - 9 duplicate complaints on orders 1..9 totalling ₹10,500.
     - Total complaint order amount = ₹1,06,900.
   - `infra_volumes`: `staging-db` (staging), `prod-db` (production), `prod-db-backup` (production, is_backup=1).
   - `files`: `.env.staging` (credential mismatch) and `ops-notes.txt` (prod token leak).
3. **Shadow Database (`server/src/db/shadow.ts`)**:
   - `createShadow(base)` serializes the base database to buffer and initializes an in-memory SQLite database (`new Database(buffer)`).
   - Isolated in RAM: mutations do not alter the base database.
4. **Canonical Hashing (`server/src/db/hash.ts`)**:
   - `hashDb(db)` computes SHA-256 over all 6 tracked tables sorted alphabetically (`complaints`, `customers`, `email_outbox`, `infra_volumes`, `orders`, `refunds`), ordering rows by `rowid`.
   - Seeded database hash is 100% deterministic:
     `28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385`
5. **Snapshot & Restore (`server/src/db/snapshot.ts`)**:
   - `snapshot(runId)` copies `base.db` to `snapshots/{runId}.db`.
   - `restore(runId)` restores `snapshots/{runId}.db` back to `base.db`.
6. **Frontend Experience (`web/`)**:
   - High-craft UI built with Inter & JetBrains Mono typography, dark slate palette, orange accent, and PRD risk color tokens.
   - Features live "0 Real Writes" badge, HashProof indicator, and an interactive Shadow DB isolation simulator.

## Verification & Acceptance
- `npm run seed`: Seeded twice, confirmed identical hash (`28d35c...`).
- `npm test`: Passes 6/6 tests across all workspaces:
  - `tests/hash.test.ts`: Determinism and exact count/rupee assertions pass.
  - `tests/shadow.test.ts`: Shadow isolation and snapshot round-trip pass.
  - `src/health.test.ts`: Health check passes.
  - `src/App.test.ts`: Web smoke test passes.
- `npm run build`: Passes cleanly without TypeScript or bundler errors.

## Next Phase Handoff (Phase 2)
Ready for Phase 2: Implement the seven tools (`manifest.ts`, `impl.ts`), the diff engine (`diff.ts`), the plan executor (`planExecutor.ts`), and the grouping into `Change` objects (`group.ts`).
