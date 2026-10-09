import { motion } from 'framer-motion';
import { ShieldCheck, Database, Layers, RotateCcw, AlertTriangle } from 'lucide-react';

interface ArchitectureFlowProps {
  currentStage?: 'idle' | 'running' | 'planned' | 'applied';
}

export function ArchitectureFlow({ currentStage = 'idle' }: ArchitectureFlowProps) {
  const isRunning = currentStage === 'running';
  const isPlanned = currentStage === 'planned';
  const isApplied = currentStage === 'applied';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/70 backdrop-blur-2xl border border-neutral-200/60 shadow-glass">
        {/* Subtle background ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-orange-100/30 via-amber-50/20 to-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Header pill & status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-100/80">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-50 text-orange-600 border border-orange-200/50">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Safety Architecture
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">
              Zero Real Writes Isolation Flow
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 px-3 py-1 rounded-full border border-emerald-200/50 self-start sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>In-Memory Shadow Active</span>
          </div>
        </div>

        {/* Desktop Visual Diagram (Reference Layout) */}
        <div className="hidden lg:block relative py-6 my-2">
          {/* SVG Connection Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 240"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Left to Center Curves */}
            <path
              d="M 220 50 C 350 50, 400 110, 460 120"
              stroke="#fed7aa"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 220 190 C 350 190, 400 130, 460 120"
              stroke="#fed7aa"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 230 120 L 460 120"
              stroke="#fb923c"
              strokeWidth="1.5"
              className={isRunning ? 'animate-pulse' : ''}
            />

            {/* Center to Right Curves */}
            <path
              d="M 540 120 C 600 110, 650 50, 780 50"
              stroke="#fed7aa"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 540 120 C 600 130, 650 190, 780 190"
              stroke="#fed7aa"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 540 120 L 770 120"
              stroke="#fb923c"
              strokeWidth="1.5"
              className={isPlanned || isApplied ? 'animate-pulse' : ''}
            />
          </svg>

          <div className="grid grid-cols-12 items-center gap-4 relative z-10">
            {/* Left Column: DATA IN / AGENT INTENT */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-full max-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/80 px-2 py-0.5 rounded border border-neutral-200/50 shadow-2xs">
                    Target Data
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/80 px-2 py-0.5 rounded border border-neutral-200/50 shadow-2xs">
                    Tool Input
                  </span>
                </div>
                <div className="text-center my-3">
                  <h3 className="text-3xl font-extrabold tracking-tight text-neutral-900 uppercase">
                    DATA IN
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                    Orders • Refunds • Infrastructure
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    Test Orders
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    Complaints
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    Cloud Volumes
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Glowing Squircle Rehearsal Core */}
            <div className="col-span-4 flex justify-center">
              <motion.div
                animate={
                  isRunning
                    ? { scale: [1, 1.02, 1], boxShadow: ['0 10px 30px rgba(249,115,22,0.15)', '0 15px 40px rgba(249,115,22,0.25)', '0 10px 30px rgba(249,115,22,0.15)'] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-[210px] rounded-3xl p-5 text-center transition-all ${
                  isRunning
                    ? 'bg-gradient-to-b from-white to-orange-50/80 border-2 border-orange-400 shadow-xl'
                    : isPlanned
                    ? 'bg-gradient-to-b from-white to-amber-50/50 border border-amber-300 shadow-md'
                    : 'bg-white/90 border border-neutral-200/80 shadow-glass'
                }`}
              >
                <div className="h-12 w-12 mx-auto rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md mb-3">
                  <ShieldCheck className="h-6 w-6 text-orange-400" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Preflight Core
                </h4>
                <div className="text-[10px] font-semibold text-orange-600 mt-1 uppercase tracking-tight">
                  Rehearses • Diffs • Evaluates
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 text-[10px] font-bold text-white shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  0 REAL WRITES
                </div>
              </motion.div>
            </div>

            {/* Right Column: REVENUE / SAFE APPLY */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-full max-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/80 px-2 py-0.5 rounded border border-neutral-200/50 shadow-2xs">
                    Row-Level Diff
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/80 px-2 py-0.5 rounded border border-neutral-200/50 shadow-2xs">
                    1-Click Undo
                  </span>
                </div>
                <div className="text-center my-3">
                  <h3 className="text-3xl font-extrabold tracking-tight text-neutral-900 uppercase">
                    SAFE APPLY
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                    Atomic Transaction • Hash Proof
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    Row Exclusion
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    CRITICAL Gate
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                    Hash Equality
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Inspired by Reference Bottom Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-neutral-100/80">
          <div className="surface-inset rounded-2xl p-4 transition-all hover:border-neutral-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-700 shadow-2xs">
                <Database className="h-4 w-4 text-orange-500" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900">1. RAM Isolation</h4>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Every tool write executes on an in-memory shadow SQLite copy. Real base database remains untouched.
            </p>
          </div>

          <div className="surface-inset rounded-2xl p-4 transition-all hover:border-neutral-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-700 shadow-2xs">
                <Layers className="h-4 w-4 text-amber-500" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900">2. Row-Level Diffs</h4>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Precise before/after maps track exact rows affected, financial sums, and duplicate anomalies.
            </p>
          </div>

          <div className="surface-inset rounded-2xl p-4 transition-all hover:border-neutral-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-700 shadow-2xs">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900">3. Deterministic Risk</h4>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Calculates 0–100 risk score and level. CRITICAL items require typed confirmation before approval.
            </p>
          </div>

          <div className="surface-inset rounded-2xl p-4 transition-all hover:border-neutral-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-700 shadow-2xs">
                <RotateCcw className="h-4 w-4 text-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900">4. Hash-Proven Undo</h4>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Replays only approved rows in one transaction. Restores snapshot on undo and asserts SHA-256 match.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
