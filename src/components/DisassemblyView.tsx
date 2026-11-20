import React from 'react';
import { SourceMapping } from '../types/emulator';
import { Code, ArrowRight } from 'lucide-react';

interface DisassemblyViewProps {
  sourceMap: SourceMapping[];
  currentIP: number;
  currentCS: number;
}

export const DisassemblyView: React.FC<DisassemblyViewProps> = ({
  sourceMap,
  currentIP,
  currentCS
}) => {
  return (
    <div className="flex flex-col h-full bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-[#141b2a] border-b border-slate-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">Disassembly Stream</span>
        </div>
        <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/30">
          CS:IP = {currentCS.toString(16).padStart(4, '0').toUpperCase()}:{currentIP.toString(16).padStart(4, '0').toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {sourceMap.length === 0 ? (
          <div className="text-slate-400 text-center py-8">
            Assemble the code to inspect disassembly
          </div>
        ) : (
          sourceMap.map((item, idx) => {
            const isCurrent = item.address === currentIP;
            const hexBytes = item.bytes
              .map(b => (b & 0xFF).toString(16).padStart(2, '0').toUpperCase())
              .join(' ');

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 py-1 px-2 rounded-lg transition ${
                  isCurrent
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 shadow-sm'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="w-4 flex items-center justify-center">
                  {isCurrent && <ArrowRight className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                <span className="w-16 text-slate-400 font-bold">
                  {item.address.toString(16).padStart(4, '0').toUpperCase()}
                </span>

                <span className="w-24 text-emerald-400/90 text-[11px] truncate" title={hexBytes}>
                  {hexBytes}
                </span>

                <span className="flex-1 text-slate-100 font-medium">
                  {item.disassembly}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
