import { useState } from 'react';
import type { Change, Pk } from '@preflight/shared';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChangeCardProps {
  change: Change;
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
  onToggleExcludePk: (changeId: string, pk: Pk) => void;
  onRequestCriticalConfirm: (change: Change) => void;
}

export function ChangeCard({
  change,
  onApprove,
  onReject,
  onToggleExcludePk,
  onRequestCriticalConfirm
}: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState<boolean>(true);

  const isCritical = change.risk.level === 'CRITICAL';
  const isHigh = change.risk.level === 'HIGH';

  const getBorderColor = () => {
    switch (change.risk.level) {
      case 'CRITICAL':
        return 'border-red-200/50 ring-1 ring-red-500/8';
      case 'HIGH':
        return 'border-orange-200/50 ring-1 ring-orange-500/8';
      case 'MEDIUM':
        return 'border-amber-200/50 ring-1 ring-amber-500/8';
      case 'LOW':
      default:
        return 'border-emerald-200/50 ring-1 ring-emerald-500/8';
    }
  };

  const getRiskBadge = () => {
    switch (change.risk.level) {
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

  const handleApproveClick = () => {
    if (isCritical) {
      onRequestCriticalConfirm(change);
    } else {
      onApprove(change.id);
    }
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl rounded-2xl border p-5 sm:p-6 shadow-card transition-all ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getRiskBadge()}`}>
            {change.risk.level} · {change.risk.score}/100
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-neutral-50/80 text-neutral-600 border border-neutral-200/40 font-semibold">
            {change.tool}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-50/60 text-neutral-500 border border-neutral-200/30">
            {change.target}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-50/60 text-neutral-500 border border-neutral-200/30">
            {change.scope}
          </span>
        </div>

        {/* Decision Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {change.decision === 'approved' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50/50 text-emerald-600 border border-emerald-200/40">
              <CheckCircle2 className="h-3 w-3" />
              <span>Approved</span>
            </span>
          )}

          {change.decision === 'rejected' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-red-50/50 text-red-600 border border-red-200/40">
              <XCircle className="h-3 w-3" />
              <span>Rejected</span>
            </span>
          )}

          {change.decision === 'pending' && (
            <>
              <button
                onClick={handleApproveClick}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97] ${
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                    : isHigh
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                }`}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(change.id)}
                className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold bg-neutral-100/60 hover:bg-neutral-200/60 text-neutral-600 transition-all border border-neutral-200/50 active:scale-[0.97]"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="my-4">
        <h3 className="text-sm sm:text-base font-bold text-neutral-800 leading-snug">
          {change.summary}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400 flex-wrap">
          <span>Rows: <strong className="text-neutral-600">{change.rowsAffected}</strong></span>
          {change.amountInr !== undefined && (
            <span>Volume: <strong className="text-neutral-600">{change.amountInr.toLocaleString('en-IN')}</strong></span>
          )}
          {change.recipients !== undefined && (
            <span>Recipients: <strong className="text-neutral-600">{change.recipients}</strong></span>
          )}
          <span>Effect: <strong className="font-mono text-neutral-600">{change.effect}</strong></span>
        </div>
      </div>

      {/* Risk Factors */}
      {change.risk.reasons.length > 0 && (
        <div className="p-3.5 rounded-xl surface-inset mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-orange-500" />
            <span>Risk Factors</span>
          </div>
          <ul className="space-y-1">
            {change.risk.reasons.map((reason, idx) => (
              <li key={idx} className="text-[11px] text-neutral-600 flex items-start gap-2">
                <span className="text-orange-400 font-bold mt-px">·</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intent Drift */}
      {change.drift && (
        <div className="p-3.5 rounded-xl surface-inset mb-4 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-neutral-600 text-[11px]">Intent Drift</span>
            <span className="font-mono text-neutral-400 text-[10px] font-medium">{change.drift.score} / 1.0</span>
          </div>
          <div className="w-full bg-neutral-200/50 h-1 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${
                change.drift.score > 0.6
                  ? 'bg-red-500'
                  : change.drift.score > 0.3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.round(change.drift.score * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 italic leading-relaxed">
            "{change.drift.reason}"
          </p>
        </div>
      )}

      {/* Diff Table Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="w-full flex items-center justify-between py-2 text-[11px] font-semibold text-neutral-500 hover:text-neutral-700 border-t border-neutral-100/60 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>Row Mutations ({change.ops.length})</span>
            {change.excludedPks && change.excludedPks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50/60 text-amber-700 text-[9px] font-bold border border-amber-200/40">
                {change.excludedPks.length} Excluded
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-neutral-400">
            {showDiff ? 'Hide' : 'Show'}
            {showDiff ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </span>
        </button>

        {/* Diff Table */}
        {showDiff && (
          <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200/50">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-neutral-50/60 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-200/40">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center" title="Toggle row exclusion">Incl</th>
                  <th className="py-2.5 px-3">PK</th>
                  <th className="py-2.5 px-3">Op</th>
                  <th className="py-2.5 px-3">Before</th>
                  <th className="py-2.5 px-3">After</th>
                  <th className="py-2.5 px-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100/50 bg-white font-mono text-[10px]">
                {change.ops.slice(0, 50).map((op) => {
                  const isExcluded = change.excludedPks?.includes(op.pk);
                  return (
                    <tr
                      key={String(op.pk)}
                      className={`transition-colors ${
                        isExcluded
                          ? 'bg-neutral-50/60 text-neutral-400 line-through opacity-50'
                          : op.flags && op.flags.length > 0
                          ? 'bg-orange-50/15 hover:bg-orange-50/25'
                          : 'hover:bg-neutral-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 text-center no-underline">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => onToggleExcludePk(change.id, op.pk)}
                          title={isExcluded ? 'Re-include' : 'Exclude from apply'}
                          className="h-3 w-3 rounded text-orange-600 focus:ring-orange-500/30 border-neutral-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-neutral-700">
                        {String(op.pk)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                            op.op === 'delete'
                              ? 'bg-red-50/60 text-red-600'
                              : op.op === 'insert'
                              ? 'bg-emerald-50/60 text-emerald-600'
                              : 'bg-blue-50/60 text-blue-600'
                          }`}
                        >
                          {op.op}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-neutral-500 max-w-xs truncate" title={JSON.stringify(op.before)}>
                        {op.before ? JSON.stringify(op.before) : '—'}
                      </td>
                      <td className="py-2 px-3 text-neutral-500 max-w-xs truncate" title={JSON.stringify(op.after)}>
                        {op.after ? JSON.stringify(op.after) : '—'}
                      </td>
                      <td className="py-2 px-3">
                        {op.flags && op.flags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {op.flags.map((flag) => (
                              <span
                                key={flag}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-50/60 text-orange-700 border border-orange-200/30"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {change.ops.length > 50 && (
              <div className="py-2 px-3 bg-neutral-50/40 text-center text-[10px] text-neutral-400 font-sans border-t border-neutral-200/30">
                Showing first 50 of {change.ops.length} operations
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
