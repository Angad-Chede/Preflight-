import { motion } from 'framer-motion';
import { ArrowRight, Bot, Shield, CheckCircle2 } from 'lucide-react';

interface ArchitectureFlowProps {
  currentStage?: 'idle' | 'running' | 'planned' | 'applied';
}

export function ArchitectureFlow({ currentStage = 'idle' }: ArchitectureFlowProps) {
  const stages = [
    {
      id: 'task',
      label: 'Agent Task',
      sub: 'Natural language instruction',
      icon: Bot,
    },
    {
      id: 'shadow',
      label: 'Shadow Rehearsal',
      sub: 'In-memory copy (0 real writes)',
      icon: Shield,
    },
    {
      id: 'risk',
      label: 'Risk & Drift Engine',
      sub: 'Deterministic rules & intent judge',
      icon: Shield,
    },
    {
      id: 'apply',
      label: 'Controlled Apply',
      sub: 'Row exclusion & instant undo',
      icon: CheckCircle2,
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-neutral-100/80">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Rehearsal Pipeline
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Every operation executes safely in RAM before any real bytes change
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 bg-neutral-50/60 px-3 py-1 rounded-full border border-neutral-200/40 self-start md:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Shadow Isolation Active</span>
          </div>
        </div>

        {/* Pipeline Stages */}
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className={`relative rounded-xl p-3.5 border transition-all ${
                  isCurrent
                    ? 'bg-orange-50/30 border-orange-300/60 ring-1 ring-orange-400/15 shadow-sm'
                    : 'surface-inset hover:bg-neutral-50 hover:border-neutral-300/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white text-neutral-600 border border-neutral-200/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-neutral-800 truncate">
                      {stage.label}
                    </h3>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {stage.sub}
                    </p>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-neutral-300">
                    <ArrowRight className="h-3 w-3" />
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
