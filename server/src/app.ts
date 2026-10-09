import express from 'express';
import cors from 'cors';
import { MODE, GROQ_MODEL } from './config';
import { runsRouter } from './routes/runs';
import { dbRouter } from './routes/db';
import { orchestrator } from './orchestrator/service';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: MODE,
    model: GROQ_MODEL || 'none'
  });
});

app.post('/api/reset', (_req, res) => {
  try {
    const result = orchestrator.resetDatabase();
    res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.use('/api/runs', runsRouter);
app.use('/api/db', dbRouter);

