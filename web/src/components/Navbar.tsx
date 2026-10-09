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
    <header className="sticky top-3 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto mb-8">
      <div className="bg-white/70 backdrop-blur-2xl border border-neutral-200/60 rounded-full px-5 sm:px-6 py-2.5 shadow-glass flex items-center justify-between gap-3 transition-all hover:shadow-glass-hover">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-neutral-900 text-[13px] sm:text-sm uppercase">
                Preflight
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-orange-50 text-orange-600 border border-orange-200/50">
                Agent Dry-Run
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium hidden md:inline tracking-wide">
              Production Safety Guardrail
            </span>
          </div>
        </div>

        {/* Center: Mode Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-50/80 border border-neutral-200/50 text-[11px] text-neutral-500">
          <Sparkles className="h-3 w-3 text-orange-500" />
          <span>Sandbox:</span>
          <span className="font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
            {mode === 'live' ? 'Live Groq' : 'Deterministic Replay'}
          </span>
        </div>

        {/* Right: Hash & Server */}
        <div className="flex items-center gap-2">
          {/* Hash Badge */}
          <button
            onClick={handleCopyHash}
            title={`Base DB Hash: ${baseHash}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/50 text-emerald-800 text-[11px] font-semibold transition-all active:scale-95 group"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline text-[10px] tracking-wide uppercase">0 Writes</span>
            <span className="font-mono text-[10px] text-emerald-600/80 bg-emerald-100/40 px-1.5 py-0.5 rounded border border-emerald-200/30">
              {truncatedHash}
            </span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Server Dot */}
          <div
            title={serverOnline ? 'API :3001' : 'Connecting...'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-50/60 text-neutral-500 text-[11px] border border-neutral-200/40"
          >
            <Server className={`h-3 w-3 ${serverOnline ? 'text-neutral-600' : 'text-amber-500 animate-pulse'}`} />
            <span className="hidden md:inline font-mono text-[10px]">
              {serverOnline ? ':3001' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
