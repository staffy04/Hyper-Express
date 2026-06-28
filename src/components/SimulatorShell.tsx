import React from 'react';
import { Wifi, Battery, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';

interface SimulatorShellProps {
  children: React.ReactNode;
  phoneTitle: string;
}

export default function SimulatorShell({ children, phoneTitle }: SimulatorShellProps) {
  return (
    <div className="flex flex-col items-center py-6 px-4 bg-slate-950/20 rounded-3xl border border-slate-800/40 shadow-2xl backdrop-blur-sm max-w-sm mx-auto">
      {/* Device wrapper */}
      <div className="relative w-[370px] h-[780px] bg-slate-950 rounded-[48px] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-black mr-auto ml-3"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-4"></div>
        </div>

        {/* Custom Status Bar */}
        <div className="h-12 bg-slate-900 text-white flex items-end justify-between px-6 pb-2 text-xs font-semibold select-none z-40">
          <div>9:41</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] opacity-75 font-mono">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">94%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* Core Mobile Viewport Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 flex flex-col relative" id="mobile-viewport">
          {children}
        </div>

        {/* Home indicator bar */}
        <div className="h-6 bg-white border-t border-slate-100 flex items-center justify-center pb-1 z-40">
          <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Smartphone className="w-3.5 h-3.5" />
        <span>{phoneTitle} Simulator (Interactive)</span>
      </div>
    </div>
  );
}
