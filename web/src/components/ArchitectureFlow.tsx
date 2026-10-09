import { motion } from 'framer-motion';
import { ArrowRight, Bot, Shield, CheckCircle2 } from 'lucide-react';

interface ArchitectureFlowProps {
  currentStage?: 'idle' | 'running' | 'planned' | 'applied';
}

export function ArchitectureFlow({ currentStage = 'idle' }: ArchitectureFlowProps) {
  const stages = [
    {
      id: 'task',
      label: '1. Agent Task',
      sub: 'Natural language instruction',
      icon: Bot,
      color: 'slate'
    },
    {
      id: 'shadow',
      label: '2. Shadow Rehearsal',
      sub: 'In-memory copy (0 real writes)',
      icon: Shield,
      color: 'orange'
    },
    {
      id: 'risk',
      label: '3. Risk & Drift Engine',
      sub: 'Deterministic rules & intent judge',
      icon: Shield,
      color: 'amber'
    },
    {
      id: 'apply',
      label: '4. Controlled Apply',
      sub: 'Row exclusion & instant undo',
      icon: CheckCircle2,
      color: 'emerald'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rehearsal Architecture Flow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every operation executes safely in RAM before any real bytes change
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60 self-start md:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Shadow Isolation: Active</span>
          </div>
        </div>

        {/* Pipeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent =
              (currentStage === 'running' && idx === 1) ||
              (currentStage === 'planned' && idx === 2) ||
              (currentStage === 'applied' && idx === 3);

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative rounded-xl p-3.5 border transition-all ${
                  isCurrent
                    ? 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-400/20 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-slate-900 truncate">
                      {stage.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {stage.sub}
                    </p>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
