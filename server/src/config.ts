import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export interface AppConfig {
  PORT: number;
  MODE: string;
  MODEL: string;
  ANTHROPIC_API_KEY: string;
}

export const config: AppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  MODE: process.env.MODE || process.env.NODE_ENV || 'development',
  MODEL: process.env.MODEL || 'claude-3-5-sonnet-20241022',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
};

export const { PORT, MODE, MODEL, ANTHROPIC_API_KEY } = config;
