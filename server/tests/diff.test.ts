import { describe, it, expect } from 'vitest';
import type { RowOp } from '@preflight/shared';
import { collapseOps } from '../src/executor/collapse';

describe('Diff Engine & Ops Collapsing', () => {
  it('collapses update-then-delete on the same row into a single delete op', () => {
    const ops: RowOp[] = [
      {
        table: 'orders',
        pk: 101,
        op: 'update',
        before: { id: 101, status: 'delivered', amount_inr: 500 },
        after: { id: 101, status: 'processing', amount_inr: 500 },
        step: 2
      },
      {
        table: 'orders',
        pk: 101,
        op: 'delete',
        before: { id: 101, status: 'processing', amount_inr: 500 },
        step: 5
      }
    ];

    const collapsed = collapseOps(ops);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]!.op).toBe('delete');
    expect(collapsed[0]!.pk).toBe(101);
    expect(collapsed[0]!.before).toEqual({ id: 101, status: 'delivered', amount_inr: 500 });
    expect(collapsed[0]!.step).toBe(2); // Keeps earliest step
  });

  it('cancels out insert followed by delete on the same row in the same session', () => {
    const ops: RowOp[] = [
      {
        table: 'refunds',
        pk: 999,
        op: 'insert',
        after: { id: 999, amount_inr: 1200 },
        step: 1
      },
      {
        table: 'refunds',
        pk: 999,
        op: 'delete',
        before: { id: 999, amount_inr: 1200 },
        step: 3
      }
    ];

    const collapsed = collapseOps(ops);
    expect(collapsed).toHaveLength(0);
  });

  it('collapses multiple updates into one single update holding initial before and final after', () => {
    const ops: RowOp[] = [
      {
        table: 'infra_volumes',
        pk: 'prod-db',
        op: 'update',
        before: { id: 'prod-db', status: 'active', environment: 'production' },
        after: { id: 'prod-db', status: 'pending', environment: 'production' },
        step: 2
      },
      {
        table: 'infra_volumes',
        pk: 'prod-db',
        op: 'update',
        before: { id: 'prod-db', status: 'pending', environment: 'production' },
        after: { id: 'prod-db', status: 'deleted', environment: 'production' },
        step: 4
      }
    ];

    const collapsed = collapseOps(ops);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]!.op).toBe('update');
    expect(collapsed[0]!.before).toEqual({ id: 'prod-db', status: 'active', environment: 'production' });
    expect(collapsed[0]!.after).toEqual({ id: 'prod-db', status: 'deleted', environment: 'production' });
    expect(collapsed[0]!.step).toBe(2);
  });
});
