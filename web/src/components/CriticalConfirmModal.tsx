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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-red-200/40 p-6 relative animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-red-50/60 text-red-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-800">
              Critical Operation
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50/50 text-red-600 border border-red-200/40">
              Score: {change.risk.score}/100
            </span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 leading-relaxed mb-4">
          This proposes <strong className="text-neutral-700">{change.summary}</strong> in production scope. Irreversible effects cannot be undone by simple rollbacks.
        </p>

        <div className="bg-red-50/30 border border-red-200/40 rounded-xl p-3 text-[11px] text-red-900 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Safety Guardrail</p>
              <p className="text-[10px] leading-relaxed text-red-700">
                Type <code className="bg-red-100/40 px-1 py-0.5 rounded font-mono font-bold text-red-800">{REQUIRED_TEXT}</code> to confirm:
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
            className="w-full font-mono text-[11px] px-3 py-2.5 rounded-xl border border-neutral-200/60 focus:outline-hidden focus:ring-2 focus:ring-red-500/15 focus:border-red-400 transition-all"
          />

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch}
              className="px-5 py-2 rounded-xl text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Confirm Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
