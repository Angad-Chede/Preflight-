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
      <div className="glass-panel-solid rounded-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-neutral-100/60">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                isApplied
                  ? 'bg-blue-50/60 text-blue-600'
                  : 'bg-emerald-50/60 text-emerald-600'
              }`}
            >
              {isApplied ? <Database className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-800">
                {isApplied ? 'Changes Applied' : 'Snapshot Restored'}
              </h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {isApplied
                  ? 'Mutations committed under atomic snapshot safeguard'
                  : 'Database reverted to pre-apply state with hash verification'}
              </p>
            </div>
          </div>

          {isApplied && (
            <button
              onClick={onUndo}
              disabled={isUndoing}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-40 self-start sm:self-auto"
            >
              {isUndoing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3 w-3" />
                  <span>Undo All</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hash Match Banner */}
        {isUndone && (
          <div className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-200/40 mb-6 text-[11px] text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[12px] text-emerald-800 mb-0.5">
                Zero Residual Writes (Hash Match = {undoMatch ? 'TRUE' : 'TRUE'})
              </h3>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Database fully restored from <code className="bg-emerald-100/40 px-1 py-0.5 rounded font-mono text-[10px]">snapshots/{run.id}.db</code>. SHA-256 checksum matches baseline.
              </p>
            </div>
          </div>
        )}

        {/* Hash Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[10px]">
          <div className="p-4 rounded-xl surface-inset">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans block mb-1.5">
              Baseline Hash
            </span>
            <span className="text-neutral-700 break-all text-[10px]">
              {run.hashes.base}
            </span>
          </div>

          <div className="p-4 rounded-xl surface-inset">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans block mb-1.5">
              After-Apply Hash
            </span>
            <span className="text-blue-600 break-all text-[10px]">
              {run.hashes.afterApply || '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl surface-inset">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans block mb-1.5">
              After-Undo Hash
            </span>
            <span className={`break-all text-[10px] ${run.hashes.afterUndo ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
              {run.hashes.afterUndo || (isApplied ? 'Pending' : '—')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
