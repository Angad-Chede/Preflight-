import type { Run, Change, Pk } from '@preflight/shared';

export interface HealthResponse {
  status: string;
  timestamp: string;
  mode: 'live' | 'replay';
  model: string;
}

export interface HashResponse {
  hash: string;
}

export interface CreateRunResponse {
  runId: string;
}

export interface ReviseResponse {
  planVersion: number;
}

export interface ApplyResponse {
  hashes: {
    base: string;
    afterApply: string;
  };
  applied: number;
}

export interface UndoResponse {
  hashes: {
    base: string;
    afterUndo: string;
  };
  match: boolean;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Failed to fetch health status');
  }
  return res.json();
}

export async function fetchBaseHash(): Promise<HashResponse> {
  const res = await fetch('/api/db/hash');
  if (!res.ok) {
    throw new Error('Failed to fetch database hash');
  }
  return res.json();
}

export async function createRun(
  task: string,
  scenario: 'A' | 'B' | 'C' | 'custom',
  mode: 'live' | 'replay' = 'replay'
): Promise<CreateRunResponse> {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, scenario, mode })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start run');
  }
  return res.json();
}

export async function fetchRun(runId: string): Promise<Run> {
  const res = await fetch(`/api/runs/${runId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch run: ${runId}`);
  }
  return res.json();
}

export async function submitDecision(
  runId: string,
  changeId: string,
  decision: 'pending' | 'approved' | 'rejected',
  excludedPks?: Pk[],
  confirmText?: string
): Promise<Change> {
  const res = await fetch(`/api/runs/${runId}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changeId, decision, excludedPks, confirmText })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record decision');
  }
  return res.json();
}

export async function submitRevision(runId: string, notes: string): Promise<ReviseResponse> {
  const res = await fetch(`/api/runs/${runId}/revise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit revision');
  }
  return res.json();
}

export async function applyRun(runId: string): Promise<ApplyResponse> {
  const res = await fetch(`/api/runs/${runId}/apply`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to apply changes');
  }
  return res.json();
}

export async function undoRun(runId: string): Promise<UndoResponse> {
  const res = await fetch(`/api/runs/${runId}/undo`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to undo changes');
  }
  return res.json();
}

export interface ResetResponse {
  ok: boolean;
  hash: string;
  customerCount: number;
  orderCount: number;
}

export async function resetDatabase(): Promise<ResetResponse> {
  const res = await fetch('/api/reset', {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset database');
  }
  return res.json();
}
