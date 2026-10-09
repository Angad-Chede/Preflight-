import { useState } from 'react';
import { ShieldCheck, Copy, Check, Server, Sparkles } from 'lucide-react';

interface NavbarProps {
  baseHash: string;
  isHashVerified?: boolean;
  mode: 'live' | 'replay';
  serverOnline: boolean;
}

export function Navbar({ baseHash, mode, serverOnline }: NavbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (!baseHash) return;
    navigator.clipboard.writeText(baseHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedHash = baseHash
    ? `${baseHash.slice(0, 7)}...${baseHash.slice(-6)}`
    : '28d35c9...13385';

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto mb-6">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-full px-4 sm:px-6 py-2.5 shadow-[0_6px_30px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 transition-all">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-sm ring-2 ring-slate-100">
            <ShieldCheck className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base">
                PREFLIGHT
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-orange-50 text-orange-600 border border-orange-200/60">
                Agent Dry-Run
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
              Production Safety Guardrail
            </span>
          </div>
        </div>

        {/* Center: Rehearsal Mode Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          <span>Rehearsal Sandbox:</span>
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            {mode === 'live' ? 'Live Groq (Scenario A)' : 'Deterministic Replay'}
          </span>
        </div>

        {/* Right: Live Hash Badge & Server Ping */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 0 Real Writes Badge */}
          <button
            onClick={handleCopyHash}
            title={`Base DB Canonical Hash: ${baseHash} (Click to copy)`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200/80 text-emerald-800 text-xs font-semibold transition-all shadow-sm active:scale-95 group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">0 Real Writes</span>
            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200/50">
              {truncatedHash}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Server Status Pill */}
          <div
            title={serverOnline ? 'Backend API connected on port 3001' : 'Connecting to backend...'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100/80 text-slate-600 text-xs border border-slate-200"
          >
            <Server className={`h-3 w-3 ${serverOnline ? 'text-slate-700' : 'text-amber-500 animate-pulse'}`} />
            <span className="hidden md:inline font-mono text-[11px]">
              {serverOnline ? ':3001' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
