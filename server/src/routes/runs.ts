import { Router } from 'express';
import { z } from 'zod';
import { orchestrator } from '../orchestrator/service';
import { getRun } from '../storage/runs';

export const runsRouter = Router();

const CreateRunSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  scenario: z.enum(['A', 'B', 'C', 'custom']),
  mode: z.enum(['live', 'replay']).optional()
});

const DecisionSchema = z.object({
  changeId: z.string().min(1),
  decision: z.enum(['pending', 'approved', 'rejected']),
  excludedPks: z.array(z.union([z.string(), z.number()])).optional(),
  confirmText: z.string().optional()
});

const ReviseSchema = z.object({
  notes: z.string().min(1, 'Revision notes are required')
});

// POST /api/runs
runsRouter.post('/', async (req, res) => {
  const parsed = CreateRunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
    return;
  }

  const { task, scenario, mode } = parsed.data;
  try {
    const runId = await orchestrator.startRun(task, scenario, mode);
    res.status(201).json({ runId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET /api/runs/:id
runsRouter.get('/:id', (req, res) => {
  const run = getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.status(200).json(run);
});

// GET /api/runs/:id/stream (SSE)
runsRouter.get('/:id/stream', (req, res) => {
  const runId = req.params.id;
  const run = getRun(runId);

  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Initial handshake
  res.write(': ok\n\n');

  // If already processed steps exist, replay them to the connecting client
  for (const step of run.steps) {
    res.write(`event: step\ndata: ${JSON.stringify(step)}\n\n`);
  }

  if (run.status === 'planned' || run.status === 'applied' || run.status === 'undone') {
    res.write(
      `event: plan_ready\ndata: ${JSON.stringify({
        planVersion: run.planVersion,
        changesCount: run.changes.length
      })}\n\n`
    );
    res.end();
    return;
  } else if (run.status === 'failed') {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Run failed' })}\n\n`);
    res.end();
    return;
  }

  // Subscribe to live orchestrator events if still running
  if (run.status === 'running') {
    const unsubscribe = orchestrator.subscribe(runId, (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (event === 'plan_ready' || event === 'error') {
        res.end();
      }
    });

    req.on('close', () => {
      unsubscribe();
    });
  }
});

// POST /api/runs/:id/decisions
runsRouter.post('/:id/decisions', (req, res) => {
  const parsed = DecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
    return;
  }

  const { changeId, decision, excludedPks, confirmText } = parsed.data;

  try {
    const change = orchestrator.recordDecision(
      req.params.id,
      changeId,
      decision,
      excludedPks,
      confirmText
    );
    res.status(200).json(change);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to record decision' });
  }
});

// POST /api/runs/:id/revise
runsRouter.post('/:id/revise', async (req, res) => {
  const parsed = ReviseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
    return;
  }

  try {
    const planVersion = await orchestrator.reviseRun(req.params.id, parsed.data.notes);
    res.status(200).json({ planVersion });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to start revision' });
  }
});

// POST /api/runs/:id/apply
runsRouter.post('/:id/apply', (req, res) => {
  try {
    const result = orchestrator.applyRun(req.params.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to apply changes' });
  }
});

// POST /api/runs/:id/undo
runsRouter.post('/:id/undo', (req, res) => {
  try {
    const result = orchestrator.undoRun(req.params.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to undo changes' });
  }
});
