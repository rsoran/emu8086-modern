import React from 'react';
import { X, Heart, Cpu, ExternalLink, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#0c1224]/95 text-slate-800 dark:text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Modern Emu8086 v1.2
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                8086 Microprocessor Studio & Assembler
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Creator Profile Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border border-blue-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                RS
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Author & Developer
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Ravindra Soran
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  @rsoran
                </div>
              </div>
            </div>

            <a
              href="https://github.com/rsoran"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 text-[11px]"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Follow</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Links & Information */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Links & Repository
            </div>
            <div className="grid grid-cols-1 gap-1.5 font-mono">
              <a
                href="https://github.com/rsoran/emu8086-modern"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 hover:bg-blue-500/10 border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 group-hover:text-blue-500">
                  <GithubIcon className="w-4 h-4" />
                  <span className="font-semibold">github.com/rsoran/emu8086-modern</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
              </a>

              <a
                href="https://github.com/rsoran"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 hover:bg-purple-500/10 border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 group-hover:text-purple-500">
                  <Heart className="w-4 h-4 text-purple-500 fill-purple-500/20" />
                  <span className="font-semibold">github.com/rsoran</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500" />
              </a>
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Features in v1.2:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
              <li>16-bit 8086 Real Mode CPU & multi-segment architecture</li>
              <li>Real-time memory variable inspector (<code className="text-blue-400">[vars]</code>)</li>
              <li>Built-in 8086 Hex Calculator & CPU flag verifier</li>
              <li>Virtual peripherals: Traffic Lights, Stepper Motor, 7-Seg LED, Thermometer</li>
              <li>Liquid Glass Theme with Dark & Light mode toggle</li>
              <li>Offline deterministic autocompletion (100% local, no AI)</li>
            </ul>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 pt-1">
            MIT License © 2026 Ravindra Soran. Open Source.
          </div>
        </div>
      </div>
    </div>
  );
};
