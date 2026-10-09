import type { Change } from '@preflight/shared';
import { ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StickyApplyBarProps {
  changes: Change[];
  onApply: () => void;
  isApplying: boolean;
  status: string;
}

export function StickyApplyBar({
  changes,
  onApply,
  isApplying,
  status
}: StickyApplyBarProps) {
  if (changes.length === 0 || status === 'applied' || status === 'undone' || status === 'running') {
    return null;
  }

  const approvedCount = changes.filter((c) => c.decision === 'approved').length;
  const criticalApproved = changes.filter((c) => c.decision === 'approved' && c.risk.level === 'CRITICAL').length;
  const highApproved = changes.filter((c) => c.decision === 'approved' && c.risk.level === 'HIGH').length;

  return (
    <div className="fixed bottom-5 inset-x-0 z-40 max-w-2xl mx-auto px-4 animate-slide-up">
      <div className="bg-neutral-900/95 text-white backdrop-blur-2xl border border-neutral-700/50 rounded-2xl p-4 shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white flex items-center gap-2">
              <span>{approvedCount} of {changes.length} Approved</span>
              {criticalApproved > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/20">
                  {criticalApproved} Critical
                </span>
              )}
              {highApproved > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/20">
                  {highApproved} High
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {approvedCount === 0
                ? 'Review and approve changes to execute'
                : 'Snapshot will be taken before execution'}
            </p>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onApply}
          disabled={approvedCount === 0 || isApplying}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
        >
          {isApplying ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Applying...</span>
            </>
          ) : (
            <>
              <span>Apply {approvedCount} Change{approvedCount > 1 ? 's' : ''}</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
