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
        return 'border-red-200 ring-1 ring-red-500/10';
      case 'HIGH':
        return 'border-orange-200 ring-1 ring-orange-500/10';
      case 'MEDIUM':
        return 'border-amber-200 ring-1 ring-amber-500/10';
      case 'LOW':
      default:
        return 'border-emerald-200 ring-1 ring-emerald-500/10';
    }
  };

  const getRiskBadge = () => {
    switch (change.risk.level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'LOW':
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
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
      className={`bg-white/85 backdrop-blur-xl rounded-2xl border p-5 sm:p-6 shadow-[0_6px_30px_rgba(15,23,42,0.03)] transition-all ${getBorderColor()}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase ${getRiskBadge()}`}>
            {change.risk.level} • {change.risk.score}/100
          </span>
          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
            {change.tool}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
            target: {change.target}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
            scope: {change.scope}
          </span>
        </div>

        {/* Action Decision Badges / Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {change.decision === 'approved' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approved</span>
            </span>
          )}

          {change.decision === 'rejected' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
              <XCircle className="h-3.5 w-3.5" />
              <span>Rejected</span>
            </span>
          )}

          {change.decision === 'pending' && (
            <>
              <button
                onClick={handleApproveClick}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95 ${
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : isHigh
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(change.id)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 active:scale-95"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="my-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {change.summary}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
          <span>Rows Affected: <strong>{change.rowsAffected}</strong></span>
          {change.amountInr !== undefined && (
            <span>• Volume: <strong>₹{change.amountInr.toLocaleString('en-IN')}</strong></span>
          )}
          {change.recipients !== undefined && (
            <span>• Recipients: <strong>{change.recipients}</strong></span>
          )}
          <span>• Effect: <strong className="font-mono text-slate-700">{change.effect}</strong></span>
        </div>
      </div>

      {/* Risk Reasons Callout */}
      {change.risk.reasons.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
            <span>Risk Factors & Anomaly Evidence</span>
          </div>
          <ul className="space-y-1.5">
            {change.risk.reasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intent Drift Widget */}
      {change.drift && (
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700">Intent Drift Assessment</span>
            <span className="font-mono text-slate-500 font-medium">{change.drift.score} / 1.0</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
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
          <p className="text-slate-600 italic leading-relaxed">
            "{change.drift.reason}"
          </p>
        </div>
      )}

      {/* Diff Table Header / Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border-t border-slate-100 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>Proposed Row Mutations ({change.ops.length})</span>
            {change.excludedPks && change.excludedPks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {change.excludedPks.length} Excluded
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            {showDiff ? 'Hide Diff Table' : 'Show Diff Table'}
            {showDiff ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </button>

        {/* Diff Table with Exclusion Checkbox */}
        {showDiff && (
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center" title="Toggle row exclusion">Exclude</th>
                  <th className="py-2.5 px-3">PK / ID</th>
                  <th className="py-2.5 px-3">Op</th>
                  <th className="py-2.5 px-3">Before State</th>
                  <th className="py-2.5 px-3">After State</th>
                  <th className="py-2.5 px-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {change.ops.slice(0, 50).map((op) => {
                  const isExcluded = change.excludedPks?.includes(op.pk);
                  return (
                    <tr
                      key={String(op.pk)}
                      className={`transition-colors ${
                        isExcluded
                          ? 'bg-slate-100/60 text-slate-400 line-through opacity-60'
                          : op.flags && op.flags.length > 0
                          ? 'bg-orange-50/30 hover:bg-orange-50/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center no-underline">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => onToggleExcludePk(change.id, op.pk)}
                          title={isExcluded ? 'Click to re-include' : 'Click to exclude from apply'}
                          className="h-3.5 w-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {String(op.pk)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            op.op === 'delete'
                              ? 'bg-red-50 text-red-700'
                              : op.op === 'insert'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {op.op}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={JSON.stringify(op.before)}>
                        {op.before ? JSON.stringify(op.before) : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={JSON.stringify(op.after)}>
                        {op.after ? JSON.stringify(op.after) : '—'}
                      </td>
                      <td className="py-2 px-3">
                        {op.flags && op.flags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {op.flags.map((flag) => (
                              <span
                                key={flag}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {change.ops.length > 50 && (
              <div className="py-2 px-3 bg-slate-50 text-center text-xs text-slate-400 font-sans border-t border-slate-200">
                Showing first 50 of {change.ops.length} row operations
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
