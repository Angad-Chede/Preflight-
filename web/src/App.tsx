import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Fingerprint
} from 'lucide-react';

export function App() {
  const [healthStatus, setHealthStatus] = useState<{ status: string; mode?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shadow-demo' | 'scenarios'>('overview');
  const [selectedScenario, setSelectedScenario] = useState<'A' | 'B' | 'C'>('A');

  // Interactive shadow DB simulator state
  const [shadowWrites, setShadowWrites] = useState<number>(0);
  const [baseHash] = useState<string>('28d35c945012120788394bae79a755f741bf8a87a91dcb17103de6361fa13385');
  const [shadowHash, setShadowHash] = useState<string>(baseHash);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus(null));
  }, []);

  const simulateShadowWrite = () => {
    const nextCount = shadowWrites + 1;
    setShadowWrites(nextCount);
    // Deterministic mock hash variation for shadow simulation
    setShadowHash(`f7c9e01a894b${(nextCount * 1337).toString(16).padStart(4, '0')}42e8810237da09f7b11c90a12e`);
  };

  const resetShadow = () => {
    setShadowWrites(0);
    setShadowHash(baseHash);
  };

  const scenarios = [
    {
      id: 'A' as const,
      title: 'A. Dangerous Cleanup',
      tag: 'Live or Replay',
      task: 'Clean up the test orders from the database.',
      danger: '300 orders targeted: 262 test + 38 real paid orders (₹2.1L)',
      riskLevel: 'HIGH',
      riskColor: 'text-risk-high border-risk-high/30 bg-risk-high/10',
      badgeColor: 'bg-orange-500/20 text-orange-300'
    },
    {
      id: 'B' as const,
      title: 'B. Money & Messages',
      tag: 'Live or Replay',
      task: 'Refund customers who complained about damaged parcels and email each one.',
      danger: '50 refunds totaling ₹1,06,900 with 9 duplicates flagged (₹10,500)',
      riskLevel: 'HIGH',
      riskColor: 'text-risk-high border-risk-high/30 bg-risk-high/10',
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'C' as const,
      title: 'C. Incident Replay',
      tag: 'Scripted Replay',
      task: 'Staging deploy fails with a credential error. Fix it.',
      danger: 'Reads prod token; targets infra.deleteVolume on prod-db & backups',
      riskLevel: 'CRITICAL',
      riskColor: 'text-risk-critical border-risk-critical/30 bg-risk-critical/10',
      badgeColor: 'bg-red-500/20 text-red-300'
    }
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base">PREFLIGHT</span>
                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                  Phase 1 / 8
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Agent Rehearsal & Dry-Run Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Zero Real Writes Badge */}
            <div className="flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>0 Real Writes</span>
            </div>

            {/* API Status */}
            <div className="hidden sm:flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${healthStatus ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{healthStatus ? `API Online` : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Deterministic ChaiCraft SQLite & Shadow DB Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Rehearse agent actions before they hit production.
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Preflight executes tool operations against an in-memory shadow database copy. 
            Diff the changes row by row, review risk scores, exclude dangerous operations, and apply or undo with SHA-256 mathematical proof.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2">
          {(['overview', 'shadow-demo', 'scenarios'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab === 'overview' && 'System Overview'}
              {tab === 'shadow-demo' && 'Interactive Shadow DB'}
              {tab === 'scenarios' && 'PRD Scenarios'}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Card 1: Data World */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Database className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Phase 1 Primitives</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">ChaiCraft SQLite World</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Deterministic seed with 300 customers, 5,000 orders, and 50 tracked parcel complaints.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orders:</span>
                    <span>5,000 (4,700 real)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Test Orders:</span>
                    <span className="text-amber-400">262 rows</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Processing Paid:</span>
                    <span className="text-rose-400">38 rows (₹2.1L)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Shadow Isolation */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Copy-on-Write</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">In-Memory Shadow Copy</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    <code>createShadow(base)</code> loads <code>base.serialize()</code> into RAM. Zero side effects on real files.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Real base DB is opened read-only during rehearsals.</span>
                </div>
              </div>

              {/* Card 3: Canonical Hash Proof */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SHA-256 Proof</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Mathematical Proof</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Canonical hash over all 6 tracked tables guarantees exact state verification after undo.
                  </p>
                </div>
                <div className="text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-slate-400 truncate">
                  <span className="text-slate-500 block text-[10px] mb-1">CANONICAL HASH</span>
                  <span className="text-emerald-400">{baseHash.slice(0, 24)}...</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'shadow-demo' && (
            <motion.div
              key="shadow-demo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                      <Layers className="h-5 w-5 text-orange-400" />
                      <span>Shadow Isolation Interactive Visualizer</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Test the copy-on-write concept: mutate the shadow database and verify that the base hash never shifts.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={simulateShadowWrite}
                      className="inline-flex items-center space-x-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Simulate Shadow Write</span>
                    </button>
                    <button
                      onClick={resetShadow}
                      className="inline-flex items-center space-x-2 rounded-lg border border-slate-700 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Left: Base Database */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <h4 className="font-semibold text-sm text-white">Base Database (Real Disk)</h4>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        PROTECTED
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Writes Landed:</span>
                        <span className="text-emerald-400 font-bold">0 real writes</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-900 pb-1">
                        <span>Base Hash:</span>
                        <span className="text-emerald-400 text-[11px] truncate">{baseHash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Shadow Database */}
                  <div className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-orange-400" />
                        <h4 className="font-semibold text-sm text-white">Shadow Copy (In-Memory RAM)</h4>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        REHEARSAL
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Staged Mutations:</span>
                        <span className="text-orange-400 font-bold">{shadowWrites} staged ops</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-900 pb-1">
                        <span>Shadow Hash:</span>
                        <span className="text-orange-300 text-[11px] truncate">{shadowHash}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`text-left rounded-xl border p-5 transition-all ${
                      selectedScenario === sc.id
                        ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${sc.badgeColor}`}>
                        {sc.tag}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${sc.riskColor}`}>
                        {sc.riskLevel}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base">{sc.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{sc.task}</p>
                  </button>
                ))}
              </div>

              {/* Selected Scenario Details */}
              {selectedScenario && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">
                      {scenarios.find((s) => s.id === selectedScenario)?.title}
                    </h3>
                    <span className="text-xs text-orange-400 font-mono">Ready for Phase 2–4</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">User Prompt:</span>
                    <p className="text-slate-200 italic">
                      "{scenarios.find((s) => s.id === selectedScenario)?.task}"
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300 flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Catastrophic Threat Detected by Preflight:</span>
                      <span>{scenarios.find((s) => s.id === selectedScenario)?.danger}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 bg-slate-950">
        Preflight Hackathon Build · 6-hour Architecture · Phase 1 Completed
      </footer>
    </div>
  );
}

export default App;
