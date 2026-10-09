import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { seedDatabase } from './db/seed';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'base.db');
const db = new Database(dbPath);
const result = seedDatabase(db);

console.log('[ChaiCraft Seed] Database seeded successfully:');
console.log(`- Customers: ${result.customerCount}`);
console.log(`- Orders: ${result.orderCount} (Test: ${result.testOrderCount}, Processing Paid: ${result.paidProcessingCount} totaling ₹${result.paidProcessingTotalInr})`);
console.log(`- Complaints: ${result.complaintCount} (Distinct: ${result.complaintDistinctOrdersCount} totaling ₹${result.complaintDistinctOrdersInr}, Duplicates: ${result.duplicateComplaintsCount} totaling ₹${result.duplicateComplaintsInr})`);
console.log(`- Total Complaints Amount: ₹${result.totalComplaintInr}`);
console.log(`- Canonical Hash: ${result.hash}`);

db.close();
