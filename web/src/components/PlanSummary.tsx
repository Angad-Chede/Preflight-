import type { Run, Level } from '@preflight/shared';
import { Layers, AlertTriangle, ShieldAlert, Edit3 } from 'lucide-react';

interface PlanSummaryProps {
  run: Run;
  onOpenReviseModal: () => void;
  onSelectVersion?: (version: number) => void;
}

export function PlanSummary({ run, onOpenReviseModal }: PlanSummaryProps) {
  const totalChanges = run.changes.length;
  const totalRowsAffected = run.changes.reduce((sum, c) => sum + (c.rowsAffected || 0), 0);
  const totalAmountInr = run.changes.reduce((sum, c) => sum + (c.amountInr || 0), 0);

  const riskLevels: Level[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const highestRisk = run.changes.reduce<Level>((highest, c) => {
    const curIdx = riskLevels.indexOf(c.risk.level);
    const highIdx = riskLevels.indexOf(highest);
    return curIdx > highIdx ? c.risk.level : highest;
  }, 'LOW');

  const avgDrift = run.changes.length > 0
    ? (run.changes.reduce((sum, c) => sum + (c.drift?.score || 0), 0) / run.changes.length).toFixed(2)
    : '0.00';

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskStyle = (level: Level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-50/60 text-red-600 border-red-200/50';
      case 'HIGH':
        return 'bg-orange-50/60 text-orange-600 border-orange-200/50';
      case 'MEDIUM':
        return 'bg-amber-50/60 text-amber-600 border-amber-200/50';
      case 'LOW':
      default:
        return 'bg-emerald-50/60 text-emerald-600 border-emerald-200/50';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-panel-solid rounded-2xl p-6 sm:p-7">
        {/* Version & Revision */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-neutral-100/80">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50/80 border border-neutral-200/50 text-[11px] font-bold text-neutral-700">
              <Layers className="h-3 w-3 text-neutral-400" />
              <span>Plan v{run.planVersion}</span>
            </div>

            {run.status === 'planned' && (
              <span className="badge-pill bg-emerald-50/50 text-emerald-600 border border-emerald-200/40">
                Ready for Review
              </span>
            )}
            {run.status === 'applied' && (
              <span className="badge-pill bg-blue-50/50 text-blue-600 border border-blue-200/40">
                Applied
              </span>
            )}
            {run.status === 'undone' && (
              <span className="badge-pill bg-neutral-50/80 text-neutral-600 border border-neutral-200/40">
                Undone
              </span>
            )}
          </div>

          <button
            onClick={onOpenReviseModal}
            disabled={run.status === 'running'}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-100/60 hover:bg-neutral-200/60 text-neutral-700 text-[11px] font-semibold transition-all border border-neutral-200/50 active:scale-[0.97] disabled:opacity-40 self-start sm:self-auto"
          >
            <Edit3 className="h-3 w-3 text-orange-500" />
            <span>Request Safer Plan</span>
          </button>
        </div>

        {/* Reviewer Notes */}
        {run.notes && (
          <div className="mb-6 p-3.5 rounded-xl bg-orange-50/30 border border-orange-200/40 text-[11px] text-orange-900 flex items-start gap-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reviewer Feedback: </span>
              <span className="italic text-orange-800">"{run.notes}"</span>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl surface-inset">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-1">
              Changes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {totalChanges}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              {totalRowsAffected} rows affected
            </div>
          </div>

          <div className="p-4 rounded-xl surface-inset">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-1">
              Exposure
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">
              {totalAmountInr > 0 ? formatInr(totalAmountInr) : '—'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Transaction volume
            </div>
          </div>

          <div className="p-4 rounded-xl surface-inset">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-1">
              Peak Risk
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getRiskStyle(highestRisk)}`}>
                {highestRisk}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="h-2.5 w-2.5" />
              <span>Multi-vector</span>
            </div>
          </div>

          <div className="p-4 rounded-xl surface-inset">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-1">
              Intent Drift
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {avgDrift}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              0.0 = exact, 1.0 = divergent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
