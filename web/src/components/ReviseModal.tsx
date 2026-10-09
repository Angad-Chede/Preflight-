import { useState } from 'react';
import { X, Edit3, Sparkles } from 'lucide-react';

interface ReviseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  currentScenario?: 'A' | 'B' | 'C' | 'custom';
}

export function ReviseModal({
  isOpen,
  onClose,
  onSubmit,
  currentScenario
}: ReviseModalProps) {
  const getDefaultNote = () => {
    switch (currentScenario) {
      case 'A':
        return 'Only delete test orders where paid is 0. Do not touch real paid customer orders.';
      case 'B':
        return 'Process only the first complaint per distinct order. Do not issue duplicate refunds.';
      case 'C':
        return 'Inspect the environment without deleting any infrastructure volumes.';
      default:
        return 'Produce a safer plan with reduced blast radius.';
    }
  };

  const [notes, setNotes] = useState(getDefaultNote());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim()) {
      onSubmit(notes.trim());
      onClose();
    }
  };

  const suggestions = [
    'Only delete test orders where paid is 0.',
    'Deduplicate complaints by order_id before issuing refunds.',
    'Keep staging inspection read-only.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Reject Plan & Request Safer Revision
            </h3>
            <p className="text-xs text-slate-500">
              Provide instructions to guide the agent to produce plan version v+1
            </p>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-orange-500" />
            <span>Suggested Directives</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNotes(s)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reviewer Notes to Agent
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. A reviewer rejected your previous plan: Only delete test orders where paid is 0."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!notes.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all disabled:opacity-40"
            >
              Dispatch Revision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
