import React from 'react';
import { CPU } from '../core/cpu/cpu';
import { Layers, ArrowRight } from 'lucide-react';

interface StackVisualizerProps {
  cpu: CPU;
}

export const StackVisualizer: React.FC<StackVisualizerProps> = ({ cpu }) => {
  const stackEntries: Array<{
    offset: number;
    linear: number;
    wordVal: number;
    isTop: boolean;
  }> = [];

  // Show 12 words around current SP (from SP-4 up to SP+18)
  for (let i = -4; i <= 16; i += 2) {
    const off = (cpu.SP + i) & 0xFFFF;
    const linear = cpu.linearAddress(cpu.SS, off);
    const wordVal = cpu.readWord(cpu.SS, off);
    stackEntries.push({
      offset: off,
      linear,
      wordVal,
      isTop: i === 0
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-[#141b2a] border-b border-slate-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Call Stack</span>
        </div>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
          SS:SP = {cpu.SS.toString(16).padStart(4, '0').toUpperCase()}:{cpu.SP.toString(16).padStart(4, '0').toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-3 flex flex-col gap-1.5 font-mono text-xs">
        {stackEntries.map(entry => (
          <div
            key={entry.offset}
            className={`flex items-center justify-between p-2 rounded-lg border transition ${
              entry.isTop
                ? 'bg-amber-950/30 border-amber-500/80 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {entry.isTop ? (
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                  <span>SP</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              ) : (
                <div className="w-7 text-slate-400 text-[10px] text-right">
                  {entry.offset > cpu.SP ? `+${entry.offset - cpu.SP}` : `-${cpu.SP - entry.offset}`}
                </div>
              )}
              <span className="text-slate-400 font-mono text-[11px]">
                {cpu.SS.toString(16).padStart(4, '0').toUpperCase()}:{entry.offset.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-[11px]">
                {entry.wordVal} dec
              </span>
              <span className={`font-semibold tracking-wider ${entry.isTop ? 'text-amber-300' : 'text-slate-100'}`}>
                {entry.wordVal.toString(16).padStart(4, '0').toUpperCase()}h
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
