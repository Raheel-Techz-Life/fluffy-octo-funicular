import React from 'react';
import { ShieldCheck, Zap, Mic } from 'lucide-react';

const AARTI_VOICE_BOT_URL = 'https://kaam-saathi-inky.vercel.app/';

interface TopNavigationProps {
  onOpenAgentManager: () => void;
  onRunElectricianDemo: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  onOpenAgentManager,
  onRunElectricianDemo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-orange-500 flex items-center justify-center font-black text-base shadow-xs group-hover:bg-slate-800 transition-colors">
                K
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap leading-none">
                  Kaam<span className="text-orange-600">Karo</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap mt-0.5">
                  Worker Intelligence
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: 4-5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={onRunElectricianDemo}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>Electrician Demo</span>
            </button>
            <button
              onClick={onOpenAgentManager}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agent Availability</span>
            </button>
          </nav>

          {/* Zone 3: Voice pitch CTA — links workers to the Aarti voice bot */}
          <a
            href={AARTI_VOICE_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs hover:bg-slate-800 transition-colors shrink-0"
          >
            <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20">
              <Mic className="w-3 h-3 text-orange-400" />
              <span className="absolute inset-0 rounded-full bg-orange-500/40 animate-ping" />
            </span>
            <span className="hidden sm:inline whitespace-nowrap">Talk to Aarti</span>
            <span className="sm:hidden whitespace-nowrap">Aarti</span>
          </a>
        </div>
      </div>
    </header>
  );
};
