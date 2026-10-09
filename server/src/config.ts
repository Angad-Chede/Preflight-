import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export interface AppConfig {
  PORT: number;
  MODE: 'live' | 'replay';
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  LLM_BASE_URL: string;
}

export const config: AppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  MODE: (process.env.MODE as 'live' | 'replay') || 'replay',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || '', // pick a tool-calling model from console.groq.com/docs/models; no default
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1'
};

export const { PORT, MODE, GROQ_API_KEY, GROQ_MODEL, LLM_BASE_URL } = config;
