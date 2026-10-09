import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [healthStatus, setHealthStatus] = useState<{ status: string; mode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setHealthStatus(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Plane className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Preflight</h1>
            <p className="text-xs text-slate-400">Phase 0: Workspace Scaffolding</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">API Health Status</span>
            <div className="mt-2 flex items-center space-x-2">
              {healthStatus ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-emerald-300">
                    Online (Mode: {healthStatus.mode || 'N/A'})
                  </span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <span className="text-amber-300">Connecting ({error})</span>
                </>
              ) : (
                <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
