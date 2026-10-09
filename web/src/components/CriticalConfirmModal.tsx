import { useState } from 'react';
import type { Change } from '@preflight/shared';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface CriticalConfirmModalProps {
  change: Change | null;
  onClose: () => void;
  onConfirm: (changeId: string, confirmText: string) => void;
}

export function CriticalConfirmModal({
  change,
  onClose,
  onConfirm
}: CriticalConfirmModalProps) {
  const [typedText, setTypedText] = useState('');
  const REQUIRED_TEXT = 'I ACCEPT THE RISK';

  if (!change) return null;

  const isMatch = typedText === REQUIRED_TEXT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatch) {
      onConfirm(change.id, typedText);
      setTypedText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm Critical Operation
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
              Score: {change.risk.score}/100 • Irreversible Effect
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          This operation proposes <strong className="text-slate-900">{change.summary}</strong> in the production scope. Deleting live database volumes or backup files cannot be undone by simple rollbacks.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-950 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Strict Safety Guardrail Enforced</p>
              <p className="text-[11px] leading-relaxed">
                To approve this critical change, type <code className="bg-red-200/60 px-1 py-0.5 rounded font-mono font-bold text-red-900">{REQUIRED_TEXT}</code> below:
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type 'I ACCEPT THE RISK'"
            autoFocus
            className="w-full font-mono text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Critical Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
