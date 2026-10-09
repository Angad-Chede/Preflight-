import type Database from 'better-sqlite3';

export function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      amount_inr INTEGER NOT NULL,
      status TEXT NOT NULL,
      paid INTEGER NOT NULL,
      is_test INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL,
      amount_inr INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id INTEGER PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS infra_volumes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      environment TEXT NOT NULL,
      is_backup INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL
    );
  `);
}
