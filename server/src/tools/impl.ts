import type Database from 'better-sqlite3';
import { z } from 'zod';
import { validateSql } from './guard';

// Zod schemas for tool arguments
const DbQuerySchema = z.object({
  sql: z.string().min(1)
});

const DbExecuteSchema = z.object({
  sql: z.string().min(1)
});

const PaymentsRefundSchema = z.object({
  order_id: z.number().int(),
  amount_inr: z.number().int(),
  reason: z.string().min(1)
});

const EmailSendSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string()
});

const FsReadSchema = z.object({
  path: z.string().min(1)
});

const InfraDeleteVolumeSchema = z.object({
  volume_id: z.string().min(1)
});

export const toolsImpl = {
  db_query(db: Database.Database, rawArgs: unknown): string {
    const parse = DbQuerySchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid db_query arguments: ${parse.error.message}`;
    }

    const { sql } = parse.data;
    const guard = validateSql(sql, 'query');
    if (!guard.ok) {
      return `SQL Guard Rejection: ${guard.error}`;
    }

    try {
      const rows = db.prepare(sql).all() as Record<string, unknown>[];
      // Limit to 20 rows, each cell truncated to 80 chars
      const truncatedRows = rows.slice(0, 20).map((row) => {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          if (typeof val === 'string' && val.length > 80) {
            out[key] = val.slice(0, 77) + '...';
          } else {
            out[key] = val;
          }
        }
        return out;
      });
      return JSON.stringify(truncatedRows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `SQL Error: ${msg}`;
    }
  },

  db_execute(db: Database.Database, rawArgs: unknown): string {
    const parse = DbExecuteSchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid db_execute arguments: ${parse.error.message}`;
    }

    const { sql } = parse.data;
    const guard = validateSql(sql, 'execute');
    if (!guard.ok) {
      return `SQL Guard Rejection: ${guard.error}`;
    }

    try {
      const info = db.prepare(sql).run();
      return `Executed successfully: ${info.changes} rows changed`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `SQL Error: ${msg}`;
    }
  },

  payments_refund(db: Database.Database, rawArgs: unknown): string {
    const parse = PaymentsRefundSchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid payments_refund arguments: ${parse.error.message}`;
    }

    const { order_id, amount_inr, reason } = parse.data;
    try {
      const info = db
        .prepare(
          `INSERT INTO refunds (order_id, amount_inr, reason, status) VALUES (?, ?, ?, 'completed')`
        )
        .run(order_id, amount_inr, reason);

      return `Refund recorded: ID ${info.lastInsertRowid} for Order ${order_id} (₹${amount_inr})`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Error executing payments_refund: ${msg}`;
    }
  },

  email_send(db: Database.Database, rawArgs: unknown): string {
    const parse = EmailSendSchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid email_send arguments: ${parse.error.message}`;
    }

    const { to, subject, body } = parse.data;
    try {
      const info = db
        .prepare(`INSERT INTO email_outbox (to_email, subject, body) VALUES (?, ?, ?)`)
        .run(to, subject, body);

      return `Email queued: ID ${info.lastInsertRowid} to ${to}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Error executing email_send: ${msg}`;
    }
  },

  fs_read(db: Database.Database, rawArgs: unknown): string {
    const parse = FsReadSchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid fs_read arguments: ${parse.error.message}`;
    }

    const { path } = parse.data;
    try {
      const row = db.prepare(`SELECT content FROM files WHERE path = ?`).get(path) as
        | { content: string }
        | undefined;

      if (!row) {
        return `File not found: ${path}`;
      }
      return row.content;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Error reading file ${path}: ${msg}`;
    }
  },

  infra_list_volumes(db: Database.Database, _rawArgs: unknown): string {
    try {
      const rows = db
        .prepare(`SELECT id, name, environment, is_backup, status FROM infra_volumes`)
        .all();
      return JSON.stringify(rows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Error listing infra volumes: ${msg}`;
    }
  },

  infra_delete_volume(db: Database.Database, rawArgs: unknown): string {
    const parse = InfraDeleteVolumeSchema.safeParse(rawArgs);
    if (!parse.success) {
      return `Error: Invalid infra_delete_volume arguments: ${parse.error.message}`;
    }

    const { volume_id } = parse.data;
    try {
      const info = db
        .prepare(`UPDATE infra_volumes SET status = 'deleted' WHERE id = ?`)
        .run(volume_id);

      if (info.changes === 0) {
        return `Volume ${volume_id} not found or already deleted`;
      }
      return `Volume ${volume_id} status updated to deleted`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Error deleting infra volume ${volume_id}: ${msg}`;
    }
  }
};
