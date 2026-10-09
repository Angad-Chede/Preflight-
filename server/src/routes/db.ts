import { Router } from 'express';
import { orchestrator } from '../orchestrator/service';

export const dbRouter = Router();

// GET /api/db/hash
dbRouter.get('/hash', (_req, res) => {
  try {
    const hash = orchestrator.getBaseHash();
    res.status(200).json({ hash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST /api/db/reset
dbRouter.post('/reset', (_req, res) => {
  try {
    const result = orchestrator.resetDatabase();
    res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
