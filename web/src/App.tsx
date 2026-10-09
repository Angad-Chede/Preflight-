import { useState, useEffect, useRef } from 'react';
import type { Run, Change, Pk, Level } from '@preflight/shared';
import {
  fetchHealth,
  fetchBaseHash,
  createRun,
  fetchRun,
  submitDecision,
  submitRevision,
  applyRun,
  undoRun
} from './api';
import { Navbar } from './components/Navbar';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { ScenarioPicker } from './components/ScenarioPicker';
import { StepTimeline } from './components/StepTimeline';
import { PlanSummary } from './components/PlanSummary';
import { ChangeCard } from './components/ChangeCard';
import { CriticalConfirmModal } from './components/CriticalConfirmModal';
import { ReviseModal } from './components/ReviseModal';
import { StickyApplyBar } from './components/StickyApplyBar';
import { ReceiptPanel } from './components/ReceiptPanel';

const RISK_WEIGHT: Record<Level, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export function App() {
  const [baseHash, setBaseHash] = useState<string>('');
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);
  const [undoMatch, setUndoMatch] = useState<boolean | undefined>(undefined);
  const [mode, setMode] = useState<'live' | 'replay'>('replay');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [criticalChange, setCriticalChange] = useState<Change | null>(null);
  const [isReviseOpen, setIsReviseOpen] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Initial health and base hash polling
  const refreshBaseHash = () => {
    fetchBaseHash()
      .then((res) => {
        setBaseHash(res.hash);
        setServerOnline(true);
      })
      .catch(() => {
        setServerOnline(false);
      });
  };

  useEffect(() => {
    fetchHealth()
      .then((res) => {
        setMode(res.mode);
        setServerOnline(true);
      })
      .catch(() => setServerOnline(false));

    refreshBaseHash();
    const interval = setInterval(refreshBaseHash, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Setup SSE connection when a run starts or revises
  const connectSSE = (runId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener('step', (e) => {
      try {
        const step = JSON.parse(e.data);
        setActiveRun((prev) => {
          if (!prev) return prev;
          // Avoid duplicate steps
          if (prev.steps.some((s) => s.n === step.n)) return prev;
          return {
            ...prev,
            steps: [...prev.steps, step]
          };
        });
      } catch {
        // ignore parse error
      }
    });

    es.addEventListener('plan_ready', () => {
      fetchRun(runId)
        .then((fullRun) => {
          setActiveRun(fullRun);
          setIsRunning(false);
        })
        .catch(console.error);
      es.close();
    });

    es.addEventListener('error', (e: Event) => {
      const customEvent = e as MessageEvent;
      if (customEvent.data) {
        try {
          const errData = JSON.parse(customEvent.data);
          setErrorMessage(errData.message);
        } catch {
          // ignore
        }
      }
      setIsRunning(false);
      es.close();
    });
  };

  // 3. Launch a run
  const handleStartRun = async (
    task: string,
    scenario: 'A' | 'B' | 'C' | 'custom',
    selectedMode: 'live' | 'replay'
  ) => {
    setErrorMessage(null);
    setIsRunning(true);
    setUndoMatch(undefined);

    try {
      const { runId } = await createRun(task, scenario, selectedMode);
      const initialRun = await fetchRun(runId);
      setActiveRun(initialRun);
      connectSSE(runId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsRunning(false);
    }
  };

  // 4. Record Decision (Approve / Reject)
  const handleDecision = async (
    changeId: string,
    decision: 'pending' | 'approved' | 'rejected',
    excludedPks?: Pk[],
    confirmText?: string
  ) => {
    if (!activeRun) return;
    try {
      const updatedChange = await submitDecision(
        activeRun.id,
        changeId,
        decision,
        excludedPks,
        confirmText
      );

      setActiveRun((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          changes: prev.changes.map((c) => (c.id === changeId ? updatedChange : c))
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Decision error: ${msg}`);
    }
  };

  // 5. Toggle Row Exclusion
  const handleToggleExcludePk = async (changeId: string, pk: Pk) => {
    if (!activeRun) return;
    const change = activeRun.changes.find((c) => c.id === changeId);
    if (!change) return;

    const currentExcluded = change.excludedPks || [];
    const newExcluded = currentExcluded.includes(pk)
      ? currentExcluded.filter((p) => p !== pk)
      : [...currentExcluded, pk];

    await handleDecision(changeId, change.decision, newExcluded);
  };

  // 6. Request Revision
  const handleRevise = async (notes: string) => {
    if (!activeRun) return;
    setIsRunning(true);
    try {
      await submitRevision(activeRun.id, notes);
      const updated = await fetchRun(activeRun.id);
      setActiveRun(updated);
      connectSSE(activeRun.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsRunning(false);
    }
  };

  // 7. Apply Approved Changes
  const handleApply = async () => {
    if (!activeRun) return;
    setIsApplying(true);
    setErrorMessage(null);

    try {
      await applyRun(activeRun.id);
      const updated = await fetchRun(activeRun.id);
      setActiveRun(updated);
      refreshBaseHash();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Apply failed: ${msg}`);
    } finally {
      setIsApplying(false);
    }
  };

  // 8. Undo Applied Changes
  const handleUndo = async () => {
    if (!activeRun) return;
    setIsUndoing(true);
    setErrorMessage(null);

    try {
      const undoRes = await undoRun(activeRun.id);
      setUndoMatch(undoRes.match);
      const updated = await fetchRun(activeRun.id);
      setActiveRun(updated);
      refreshBaseHash();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Undo failed: ${msg}`);
    } finally {
      setIsUndoing(false);
    }
  };

  // Sort changes by risk level & score descending
  const sortedChanges = activeRun
    ? [...activeRun.changes].sort((a, b) => {
        const diff = RISK_WEIGHT[b.risk.level] - RISK_WEIGHT[a.risk.level];
        if (diff !== 0) return diff;
        return b.risk.score - a.risk.score;
      })
    : [];

  const flowStage = !activeRun
    ? 'idle'
    : isRunning
    ? 'running'
    : activeRun.status === 'applied' || activeRun.status === 'undone'
    ? 'applied'
    : 'planned';

  return (
    <div className="min-h-screen text-slate-900 pb-24 selection:bg-orange-500/20 selection:text-orange-900">
      {/* 1. Glassy Floating Navbar */}
      <Navbar
        baseHash={baseHash}
        mode={mode}
        serverOnline={serverOnline}
      />

      {/* 2. Visual Architecture Pipeline */}
      <ArchitectureFlow currentStage={flowStage} />

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-600 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 3. Scenario Selector & Launcher */}
      <ScenarioPicker
        onStartRun={handleStartRun}
        isRunning={isRunning}
      />

      {/* 4. Live Step Timeline */}
      {activeRun && (
        <StepTimeline
          steps={activeRun.steps}
          isRunning={isRunning}
        />
      )}

      {/* 5. Plan Summary Header */}
      {activeRun && (
        <PlanSummary
          run={activeRun}
          onOpenReviseModal={() => setIsReviseOpen(true)}
        />
      )}

      {/* 6. Risk-Sorted Changes List */}
      {activeRun && sortedChanges.length > 0 && (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-5 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Evaluated Operations & Changes ({sortedChanges.length})
            </h2>
            <span className="text-xs text-slate-500">
              Sorted by Risk Priority (Highest First)
            </span>
          </div>

          {sortedChanges.map((change) => (
            <ChangeCard
              key={change.id}
              change={change}
              onApprove={(id) => handleDecision(id, 'approved', change.excludedPks)}
              onReject={(id) => handleDecision(id, 'rejected')}
              onToggleExcludePk={handleToggleExcludePk}
              onRequestCriticalConfirm={(c) => setCriticalChange(c)}
            />
          ))}
        </main>
      )}

      {/* 7. Receipt Panel (After Apply or Undo) */}
      {activeRun && (
        <ReceiptPanel
          run={activeRun}
          onUndo={handleUndo}
          isUndoing={isUndoing}
          undoMatch={undoMatch}
        />
      )}

      {/* 8. Sticky Apply Bar */}
      {activeRun && (
        <StickyApplyBar
          changes={activeRun.changes}
          onApply={handleApply}
          isApplying={isApplying}
          status={activeRun.status}
        />
      )}

      {/* 9. CRITICAL Typed Confirm Modal */}
      <CriticalConfirmModal
        change={criticalChange}
        onClose={() => setCriticalChange(null)}
        onConfirm={(changeId, confirmText) =>
          handleDecision(changeId, 'approved', criticalChange?.excludedPks, confirmText)
        }
      />

      {/* 10. Revise Plan Feedback Modal */}
      <ReviseModal
        isOpen={isReviseOpen}
        onClose={() => setIsReviseOpen(false)}
        onSubmit={handleRevise}
        currentScenario={activeRun?.scenario}
      />
    </div>
  );
}

export default App;

