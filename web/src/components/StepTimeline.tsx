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
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    if (tool.startsWith('payments_')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (tool.startsWith('email_')) {
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    }
    if (tool.startsWith('infra_')) {
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (steps.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-[0_6px_30px_rgba(15,23,42,0.03)]">
        {/* Timeline Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              Execution Step Timeline
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {steps.length} Steps
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            {isRunning ? (
              <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Rehearsing in real-time...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Shadow Rehearsal Complete</span>
              </span>
            )}
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-100">
          {steps.map((step) => {
            const Icon = getToolIcon(step.tool);
            const isExpanded = !!expandedSteps[step.n];
            const badgeStyle = getToolBadgeStyle(step.tool);

            return (
              <div key={step.n} className="relative flex items-start gap-3.5 group">
                {/* Node indicator */}
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-105">
                  <Icon className="h-4 w-4 text-slate-700" />
                </div>

                {/* Step Body */}
                <div className="flex-1 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 transition-all text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">Step {step.n}</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${badgeStyle}`}>
                        {step.tool}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(step.ts).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => toggleExpand(step.n)}
                        className="p-1 rounded hover:bg-slate-200/70 text-slate-500"
                        title={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="font-mono text-[11px] text-slate-600 truncate bg-white/70 px-2.5 py-1.5 rounded border border-slate-200/60">
                    <span className="text-slate-400 mr-2">Args:</span>
                    {JSON.stringify(step.args)}
                  </div>

                  {/* Expanded Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Raw Arguments
                        </span>
                        <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
                          {JSON.stringify(step.args, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Execution Output
                        </span>
                        <pre className="mt-1 p-2 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
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
