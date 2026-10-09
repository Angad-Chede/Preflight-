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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-neutral-200/50 p-6 relative animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-orange-50/50 text-orange-500 flex items-center justify-center shrink-0">
            <Edit3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-800">
              Request Safer Revision
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Guide the agent to produce plan version v+1
            </p>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-orange-500" />
            <span>Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNotes(s)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-50/80 hover:bg-neutral-100/80 text-neutral-600 transition-colors text-left border border-neutral-200/30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
              Reviewer Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Only delete test orders where paid is 0."
              className="w-full text-[11px] px-3 py-2.5 rounded-xl border border-neutral-200/60 focus:outline-hidden focus:ring-2 focus:ring-orange-500/15 focus:border-orange-400 leading-relaxed transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!notes.trim()}
              className="btn-accent disabled:opacity-35 text-[11px]"
            >
              Dispatch Revision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
