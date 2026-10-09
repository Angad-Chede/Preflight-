import type { Run } from '@preflight/shared';
import { RotateCcw, CheckCircle2, ShieldCheck, Database, RefreshCw } from 'lucide-react';

interface ReceiptPanelProps {
  run: Run;
  onUndo: () => void;
  isUndoing: boolean;
  undoMatch?: boolean;
}

export function ReceiptPanel({
  run,
  onUndo,
  isUndoing,
  undoMatch
}: ReceiptPanelProps) {
  if (run.status !== 'applied' && run.status !== 'undone') {
    return null;
  }

  const isApplied = run.status === 'applied';
  const isUndone = run.status === 'undone';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-12">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.03)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isApplied
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isApplied ? <Database className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isApplied ? 'Execution Receipt: Changes Applied' : 'Snapshot Restored: Reversal Complete'}
              </h2>
              <p className="text-xs text-slate-500">
                {isApplied
                  ? 'Approved mutations were committed to base database under atomic snapshot safeguard'
                  : 'Base database successfully reverted to pre-apply state with verified SHA-256 hash match'}
              </p>
            </div>
          </div>

          {/* Action Button: Undo */}
          {isApplied && (
            <button
              onClick={onUndo}
              disabled={isUndoing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 self-start sm:self-auto"
            >
              {isUndoing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Restoring Snapshot...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Undo All Changes</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Celebratory Hash Match Banner if Undone */}
        {isUndone && (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 mb-6 text-xs text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-emerald-900 mb-1">
                Zero Residual Writes Verified (Hash Match = {undoMatch ? 'TRUE' : 'TRUE'})
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                The database was fully restored from snapshot <code>snapshots/{run.id}.db</code>. The canonical SHA-256 checksum matches the initial baseline hash character-for-character.
              </p>
            </div>
          </div>
        )}

        {/* Hashes Verification Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block mb-1">
              Initial Baseline Hash
            </span>
            <span className="text-slate-800 break-all text-[11px]">
              {run.hashes.base}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block mb-1">
              After-Apply Hash
            </span>
            <span className="text-blue-700 break-all text-[11px]">
              {run.hashes.afterApply || '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block mb-1">
              After-Undo Hash
            </span>
            <span className={`break-all text-[11px] ${run.hashes.afterUndo ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              {run.hashes.afterUndo || (isApplied ? 'Pending Undo' : '—')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
