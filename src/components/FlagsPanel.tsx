import React from 'react';
import { Flags } from '../types/emulator';
import { Flag, X } from 'lucide-react';

interface FlagsPanelProps {
  flags: Flags;
  onToggleFlag: (flagName: keyof Flags) => void;
  onClose?: () => void;
}

export const FlagsPanel: React.FC<FlagsPanelProps> = ({ flags, onToggleFlag, onClose }) => {
  const flagInfo: Array<{
    key: keyof Flags;
    name: string;
    desc: string;
  }> = [
    { key: 'OF', name: 'Overflow', desc: 'Set if signed arithmetic overflow occurred' },
    { key: 'DF', name: 'Direction', desc: '0=Forward string increment (CLD), 1=Backward (STD)' },
    { key: 'IF', name: 'Interrupt', desc: '1=Hardware interrupts enabled (STI), 0=Disabled (CLI)' },
    { key: 'TF', name: 'Trap', desc: '1=Single-step CPU debug mode active' },
    { key: 'SF', name: 'Sign', desc: 'Set if result is negative (MSB=1)' },
    { key: 'ZF', name: 'Zero', desc: 'Set if arithmetic/logic result was zero' },
    { key: 'AF', name: 'Aux Carry', desc: 'Auxiliary carry between lower 4 bits (BCD arithmetic)' },
    { key: 'PF', name: 'Parity', desc: 'Set if lower byte has even number of set bits' },
    { key: 'CF', name: 'Carry', desc: 'Set if unsigned arithmetic carry or borrow occurred' }
  ];

  return (
    <div className="glass-panel p-2 flex items-center justify-between border border-white/20 dark:border-white/10 shadow-lg shrink-0">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pl-2 pr-3 border-r border-slate-300 dark:border-slate-800">
        <Flag className="w-3.5 h-3.5 text-blue-500" />
        <span>flags</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-around px-2 overflow-x-auto">
        {flagInfo.map(f => {
          const isSet = flags[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onToggleFlag(f.key)}
              title={`${f.key} (${f.name}): ${isSet ? '1 (Set)' : '0 (Clear)'}\n${f.desc}\nClick to toggle`}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer select-none active:scale-95 border ${
                isSet
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/40'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700/80 hover:border-slate-400'
              }`}
            >
              <span>{f.key}</span>
              <span className={`text-[10px] ${isSet ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {isSet ? '1' : '0'}
              </span>
            </button>
          );
        })}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded"
          title="Close Flags bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
