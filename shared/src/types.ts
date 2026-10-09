export type Row = Record<string, string | number | null>;
export type Pk = string | number;
export type Effect = 'READ' | 'WRITE' | 'EXTERNAL' | 'IRREVERSIBLE';
export type Level = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RowOp {
  table: string;
  pk: Pk;
  op: 'insert' | 'update' | 'delete';
  before?: Row;
  after?: Row;
  step: number;
  flags?: string[];
}

export interface Risk {
  score: number;
  level: Level;
  reasons: string[];
}

export interface Change {
  id: string;
  planVersion: number;
  tool: string;
  kind: string;
  effect: Effect;
  target: string;
  summary: string;
  ops: RowOp[];
  rowsAffected: number;
  amountInr?: number;
  recipients?: number;
  scope: 'staging' | 'production';
  risk: Risk;
  drift?: { score: number; reason: string };
  decision: 'pending' | 'approved' | 'rejected';
  excludedPks: Pk[];
  state: 'planned' | 'applied' | 'undone';
}

export interface Step {
  n: number;
  tool: string;
  args: unknown;
  result: string;
  changeIds: string[];
  ts: number;
}

export interface Run {
  id: string;
  task: string;
  scenario: 'A' | 'B' | 'C' | 'custom';
  mode: 'live' | 'replay';
  planVersion: number;
  status: 'running' | 'planned' | 'applied' | 'undone' | 'failed';
  steps: Step[];
  changes: Change[];
  notes?: string;
  hashes: {
    base: string;
    afterApply?: string;
    afterUndo?: string;
  };
}
