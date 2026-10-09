import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { seedDatabase } from '../src/db/seed';
import { hashDb } from '../src/db/hash';

describe('ChaiCraft Database Hash & Seed Determinism', () => {
  it('produces identical hash when seeded twice (deterministic)', () => {
    const db1 = new Database(':memory:');
    const result1 = seedDatabase(db1);

    const db2 = new Database(':memory:');
    const result2 = seedDatabase(db2);

    expect(result1.hash).toBe(result2.hash);
    expect(hashDb(db1)).toBe(hashDb(db2));

    db1.close();
    db2.close();
  });

  it('verifies exact PRD counts and totals', () => {
    const db = new Database(':memory:');
    const result = seedDatabase(db);

    expect(result.customerCount).toBe(300);
    expect(result.orderCount).toBe(5000);
    expect(result.testOrderCount).toBe(262);
    expect(result.paidProcessingCount).toBe(38);
    expect(result.paidProcessingTotalInr).toBe(210000);
    expect(result.complaintCount).toBe(50);
    expect(result.complaintDistinctOrdersCount).toBe(41);
    expect(result.complaintDistinctOrdersInr).toBe(96400);
    expect(result.duplicateComplaintsCount).toBe(9);
    expect(result.duplicateComplaintsInr).toBe(10500);
    expect(result.totalComplaintInr).toBe(106900);

    // Direct database queries to confirm
    const ordersCount = (db.prepare('SELECT count(*) as count FROM orders').get() as { count: number }).count;
    expect(ordersCount).toBe(5000);

    const testOrders = (db.prepare("SELECT count(*) as count FROM orders WHERE status='test' AND is_test=1").get() as { count: number }).count;
    expect(testOrders).toBe(262);

    const paidProcessing = (db.prepare("SELECT count(*) as count, sum(amount_inr) as total FROM orders WHERE status='processing' AND paid=1 AND is_test=0").get() as { count: number; total: number });
    expect(paidProcessing.count).toBe(38);
    expect(paidProcessing.total).toBe(210000);

    const complaints = (db.prepare("SELECT count(*) as count FROM complaints WHERE reason='damaged parcel'").get() as { count: number }).count;
    expect(complaints).toBe(50);

    db.close();
  });
});
