import type { Run, Level } from '@preflight/shared';
import { Layers, AlertTriangle, ShieldAlert, Edit3 } from 'lucide-react';

interface PlanSummaryProps {
  run: Run;
  onOpenReviseModal: () => void;
  onSelectVersion?: (version: number) => void;
}

export function PlanSummary({ run, onOpenReviseModal }: PlanSummaryProps) {
  // Derive all metrics from active run changes
  const totalChanges = run.changes.length;
  const totalRowsAffected = run.changes.reduce((sum, c) => sum + (c.rowsAffected || 0), 0);
  const totalAmountInr = run.changes.reduce((sum, c) => sum + (c.amountInr || 0), 0);

  // Determine highest risk level
  const riskLevels: Level[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const highestRisk = run.changes.reduce<Level>((highest, c) => {
    const curIdx = riskLevels.indexOf(c.risk.level);
    const highIdx = riskLevels.indexOf(highest);
    return curIdx > highIdx ? c.risk.level : highest;
  }, 'LOW');

  // Average intent drift score
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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.03)]">
        {/* Version Banner & Revise CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Plan Version {run.planVersion}</span>
            </div>

            {run.status === 'planned' && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ready for Review
              </span>
            )}
            {run.status === 'applied' && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Applied to Base DB
              </span>
            )}
            {run.status === 'undone' && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Undone / Restored
              </span>
            )}
          </div>

          <button
            onClick={onOpenReviseModal}
            disabled={run.status === 'running'}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          >
            <Edit3 className="h-3.5 w-3.5 text-orange-600" />
            <span>Reject & Request Safer Plan</span>
          </button>
        </div>

        {/* Reviewer Feedback Notes if revision was performed */}
        {run.notes && (
          <div className="mb-6 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reviewer Rejection Feedback: </span>
              <span className="italic">"{run.notes}"</span>
            </div>
          </div>
        )}

        {/* Derived Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Operations count */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Changes Proposed
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {totalChanges}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalRowsAffected} rows affected
            </div>
          </div>

          {/* Financial Exposure */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Financial Exposure
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {totalAmountInr > 0 ? formatInr(totalAmountInr) : '₹0'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total transaction volume
            </div>
          </div>

          {/* Peak Risk Level */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Peak Risk Level
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border ${getRiskStyle(highestRisk)}`}>
                {highestRisk}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-slate-400" />
              <span>Multi-vector assessment</span>
            </div>
          </div>

          {/* Average Intent Drift */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Intent Drift Score
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {avgDrift}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              0.0 = exact, 1.0 = divergence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
