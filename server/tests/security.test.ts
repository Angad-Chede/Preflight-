import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createPlanSession } from '../src/executor/planExecutor';
import { validateSql } from '../src/tools/guard';
import { getBaseDbPath } from '../src/storage/runs';
import { hashDb } from '../src/db/hash';

describe('Phase 7 Security Audit & Isolation Defense', () => {
  let baseDbPath: string;
  let initialHash: string;

  beforeEach(() => {
    baseDbPath = getBaseDbPath();
    const db = new Database(baseDbPath, { readonly: true });
    try {
      initialHash = hashDb(db);
    } finally {
      db.close();
    }
  });

  describe('SQL Injection & ATTACH Defense', () => {
    it('blocks ATTACH DATABASE across db_execute and db_query', () => {
      // In db_execute
      const execResult1 = validateSql(`ATTACH DATABASE '${baseDbPath}' AS real`, 'execute');
      expect(execResult1.ok).toBe(false);
      expect(execResult1.error).toContain('Forbidden SQL keyword: ATTACH');

      // Case insensitive ATTACH
      const execResult2 = validateSql(`attach database 'evil.db' as evil`, 'execute');
      expect(execResult2.ok).toBe(false);
      expect(execResult2.error).toContain('Forbidden SQL keyword: ATTACH');

      // In db_query
      const queryResult1 = validateSql(`ATTACH DATABASE '${baseDbPath}' AS real`, 'query');
      expect(queryResult1.ok).toBe(false);
      expect(queryResult1.error).toContain('Forbidden SQL keyword: ATTACH');

      // Multi-statement injection attempting ATTACH
      const queryResult2 = validateSql(`SELECT 1; ATTACH DATABASE 'evil.db' AS evil;`, 'query');
      expect(queryResult2.ok).toBe(false);
    });

    it('blocks dangerous SQLite keywords and primitives', () => {
      const dangerousCommands = [
        { sql: 'DETACH DATABASE evil', mode: 'execute' as const },
        { sql: 'PRAGMA foreign_keys = OFF', mode: 'execute' as const },
        { sql: "SELECT LOAD_EXTENSION('evil.dll')", mode: 'query' as const },
        { sql: 'VACUUM', mode: 'execute' as const },
        { sql: 'DROP TABLE orders', mode: 'execute' as const },
        { sql: 'CREATE TABLE backdoor (id int)', mode: 'execute' as const },
        { sql: 'ALTER TABLE orders ADD COLUMN leaked text', mode: 'execute' as const },
        { sql: 'SELECT * FROM sqlite_master', mode: 'query' as const },
        { sql: 'REPLACE INTO orders (id) VALUES (1)', mode: 'execute' as const },
        { sql: 'REINDEX orders', mode: 'execute' as const }
      ];

      for (const { sql, mode } of dangerousCommands) {
        const res = validateSql(sql, mode);
        expect(res.ok, `Expected '${sql}' to be rejected`).toBe(false);
      }
    });

    it('rejects SQL comments to prevent parser evasion', () => {
      const commentQueries = [
        'SELECT * FROM orders -- bypass',
        'SELECT * FROM orders /* comment */ WHERE id = 1',
        'DELETE FROM orders /* evil */ WHERE is_test = 1'
      ];

      for (const sql of commentQueries) {
        const mode = sql.startsWith('DELETE') ? 'execute' : 'query';
        const res = validateSql(sql, mode as 'query' | 'execute');
        expect(res.ok, `Expected comment query '${sql}' to be rejected`).toBe(false);
        expect(res.error).toContain('SQL comments are not allowed');
      }
    });

    it('blocks writes to untracked or system tables', () => {
      const unTrackedExec = validateSql('INSERT INTO sqlite_sequence VALUES (1, 2)', 'execute');
      expect(unTrackedExec.ok).toBe(false);

      const arbitraryTable = validateSql('DELETE FROM passwords WHERE 1=1', 'execute');
      expect(arbitraryTable.ok).toBe(false);
      expect(arbitraryTable.error).toContain('not a tracked table');
    });

    it('guarantees base database hash remains untouched through simulated attacks', () => {
      const session = createPlanSession('Malicious task', 'C', { baseDbPath });

      // Run multiple malicious attempts in session
      const maliciousCalls = [
        { tool: 'db_execute', args: { sql: `ATTACH DATABASE '${baseDbPath}' AS real` } },
        { tool: 'db_execute', args: { sql: 'DROP TABLE customers' } },
        { tool: 'db_query', args: { sql: 'SELECT * FROM sqlite_master' } },
        { tool: 'db_execute', args: { sql: 'DELETE FROM passwords WHERE 1=1' } },
        { tool: 'db_query', args: { sql: 'SELECT * FROM orders -- attempt comment' } }
      ];

      for (const call of maliciousCalls) {
        const result = session.run(call.tool, call.args);
        expect(result).toMatch(/Rejection|error|Forbidden/i);
      }

      // Finalize session asserts base hash equality and closes
      const planResult = session.finalize();
      expect(planResult.baseHash).toBe(initialHash);

      const db = new Database(baseDbPath, { readonly: true });
      try {
        const currentHash = hashDb(db);
        expect(currentHash).toBe(initialHash);
      } finally {
        db.close();
      }
    });
  });

  describe('Secret Leak Sweep', () => {
    it('verifies no API keys or private tokens are committed to source files', () => {
      const projectRoot = path.resolve(__dirname, '..', '..');
      const filesToIgnore = new Set([
        '.git',
        'node_modules',
        'dist',
        'build',
        '.db',
        'base.db',
        'snapshots',
        '.env.example'
      ]);

      const keyPatterns = [
        /gsk_[a-zA-Z0-9]{20,}/, // Groq API key format
        /sk-[a-zA-Z0-9]{20,}/,  // OpenAI API key format
        /AIzaSy[a-zA-Z0-9_-]{33}/ // Google API key format
      ];

      function scanDir(dir: string): string[] {
        const findings: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (filesToIgnore.has(entry.name) || entry.name.endsWith('.db')) continue;

          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            findings.push(...scanDir(fullPath));
          } else if (entry.isFile()) {
            // Check text files only
            if (/\.(ts|tsx|js|jsx|json|md|html|sh|css)$/i.test(entry.name)) {
              const content = fs.readFileSync(fullPath, 'utf-8');
              for (const pattern of keyPatterns) {
                if (pattern.test(content)) {
                  findings.push(`${fullPath} matches ${pattern}`);
                }
              }
            }
          }
        }
        return findings;
      }

      const leaks = scanDir(projectRoot);
      expect(leaks, `Found secret key leaks: ${leaks.join(', ')}`).toHaveLength(0);
    });
  });
});
