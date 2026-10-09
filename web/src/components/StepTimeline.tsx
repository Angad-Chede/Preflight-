import { useState } from 'react';
import type { Step } from '@preflight/shared';
import {
  Database,
  Mail,
  CreditCard,
  FileCode,
  HardDrive,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface StepTimelineProps {
  steps: Step[];
  isRunning: boolean;
}

export function StepTimeline({ steps, isRunning }: StepTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleExpand = (n: number) => {
    setExpandedSteps((prev) => ({ ...prev, [n]: !prev[n] }));
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'db_query':
      case 'db_execute':
        return Database;
      case 'payments_refund':
        return CreditCard;
      case 'email_send':
        return Mail;
      case 'fs_read':
        return FileCode;
      case 'infra_list_volumes':
      case 'infra_delete_volume':
        return HardDrive;
      default:
        return Terminal;
    }
  };

  const getToolBadgeStyle = (tool: string) => {
    if (tool.startsWith('db_')) {
      return 'bg-blue-50/60 text-blue-600 border-blue-200/40';
    }
    if (tool.startsWith('payments_')) {
      return 'bg-emerald-50/60 text-emerald-600 border-emerald-200/40';
    }
    if (tool.startsWith('email_')) {
      return 'bg-purple-50/60 text-purple-600 border-purple-200/40';
    }
    if (tool.startsWith('infra_')) {
      return 'bg-rose-50/60 text-rose-600 border-rose-200/40';
    }
    return 'bg-neutral-50 text-neutral-600 border-neutral-200/50';
  };

  if (steps.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100/80">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[11px] font-bold tracking-[0.12em] text-neutral-400 uppercase">
              Step Timeline
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-50/80 text-neutral-500 border border-neutral-200/40">
              {steps.length} Steps
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium">
            {isRunning ? (
              <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50/40 px-2.5 py-1 rounded-full border border-orange-200/40">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Rehearsing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/40 px-2.5 py-1 rounded-full border border-emerald-200/40">
                <CheckCircle2 className="h-3 w-3" />
                <span>Complete</span>
              </span>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-[18px] before:w-px before:bg-neutral-200/50">
          {steps.map((step) => {
            const Icon = getToolIcon(step.tool);
            const isExpanded = !!expandedSteps[step.n];
            const badgeStyle = getToolBadgeStyle(step.tool);

            return (
              <div key={step.n} className="relative flex items-start gap-3 group">
                {/* Timeline Node */}
                <div className="h-9 w-9 rounded-lg bg-white border border-neutral-200/60 shadow-card flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-105">
                  <Icon className="h-3.5 w-3.5 text-neutral-600" />
                </div>

                {/* Step Content */}
                <div className="flex-1 surface-inset rounded-xl p-3 transition-all text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800 text-[11px]">Step {step.n}</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border ${badgeStyle}`}>
                        {step.tool}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(step.ts).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => toggleExpand(step.n)}
                        className="p-1 rounded hover:bg-neutral-200/40 text-neutral-400"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline preview */}
                  <div className="font-mono text-[10px] text-neutral-500 truncate bg-white/60 px-2.5 py-1.5 rounded-lg border border-neutral-200/30">
                    <span className="text-neutral-300 mr-1.5">args:</span>
                    {JSON.stringify(step.args)}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-200/40 space-y-2">
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Arguments
                        </span>
                        <pre className="mt-1 p-2.5 bg-neutral-900 text-neutral-200 rounded-lg font-mono text-[10px] overflow-x-auto">
                          {JSON.stringify(step.args, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Output
                        </span>
                        <pre className="mt-1 p-2.5 bg-neutral-900 text-emerald-300 rounded-lg font-mono text-[10px] overflow-x-auto max-h-48">
                          {step.result}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
