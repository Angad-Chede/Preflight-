# Preflight

AI Agent Rehearsal & Dry-Run Engine.

Preflight intercepts operations agent writes, simulates them on an in-memory shadow SQLite copy, scores risk deterministically, produces reviewable row-level diffs, and guarantees zero real writes before human approval, with hash-proven undo.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed database deterministically
npm run seed

# 3. Run all tests
npm test

# 4. Start development servers (Server on http://localhost:3001, Web on http://localhost:3000)
npm run dev
```

---

## Configuration

Copy `.env.example` to `.env`:

```bash
GROQ_API_KEY=               # free tier key from console.groq.com
GROQ_MODEL=                 # tool-calling model from console.groq.com/docs/models
LLM_BASE_URL=https://api.groq.com/openai/v1
MODE=replay                 # replay (default) or live
PORT=3001
```

Server runs on port **3001** and Vite web proxies `/api` to port **3001**.