import express from 'express';
import cors from 'cors';
import { MODE, GROQ_MODEL } from './config';
import { runsRouter } from './routes/runs';
import { dbRouter } from './routes/db';

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

app.use('/api/runs', runsRouter);
app.use('/api/db', dbRouter);

