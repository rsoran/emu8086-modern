import React, { useState, useEffect, useRef } from 'react';
import { CPU } from '../core/cpu/cpu';
import { SourceMapping } from '../types/emulator';
import { Search, Navigation } from 'lucide-react';

interface DualEmulatorViewProps {
  cpu: CPU;
  sourceMap: SourceMapping[];
  currentIP: number;
  currentCS: number;
}

export const DualEmulatorView: React.FC<DualEmulatorViewProps> = ({
  cpu,
  sourceMap,
  currentIP,
  currentCS
}) => {
  const [addressInput, setAddressInput] = useState<string>(
    `${currentCS.toString(16).padStart(4, '0')}:${currentIP.toString(16).padStart(4, '0')}`.toUpperCase()
  );
  const [viewSegment, setViewSegment] = useState<number>(currentCS);
  const [viewOffset, setViewOffset] = useState<number>(0);
  const activeRowRef = useRef<HTMLDivElement | null>(null);

  // Sync address with CPU IP on execution step
  useEffect(() => {
    setViewSegment(currentCS);
    setAddressInput(`${currentCS.toString(16).padStart(4, '0')}:${currentIP.toString(16).padStart(4, '0')}`.toUpperCase());
    
    // Auto-scroll active row into view
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentCS, currentIP]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = addressInput.trim().split(':');
    if (parts.length === 2) {
      const seg = parseInt(parts[0], 16);
      const off = parseInt(parts[1], 16);
      if (!isNaN(seg) && !isNaN(off)) {
        setViewSegment(seg & 0xFFFF);
        setViewOffset(off & 0xFFFF);
      }
    } else {
      const off = parseInt(parts[0], 16);
      if (!isNaN(off)) {
        setViewOffset(off & 0xFFFF);
      }
    }
  };

  // Generate 60 lines of memory representation matching the screenshot
  const memoryLines: Array<{
    linear: number;
    segment: number;
    offset: number;
    addrStr: string;
    hexByte: string;
    decByte: number;
    asciiStr: string;
    isActive: boolean;
  }> = [];

  const startOffset = Math.max(0, viewOffset === 0 ? Math.max(0, currentIP - 6) : viewOffset);
  for (let i = 0; i < 45; i++) {
    const off = (startOffset + i) & 0xFFFF;
    const linear = cpu.linearAddress(viewSegment, off);
    const b = linear < cpu.memory.length ? cpu.memory[linear] : 0;

    let asciiChar = '.';
    if (b === 0) asciiChar = 'NULL';
    else if (b === 7) asciiChar = 'BEEP';
    else if (b === 9) asciiChar = 'TAB';
    else if (b === 32) asciiChar = 'SPA';
    else if (b >= 33 && b <= 126) asciiChar = String.fromCharCode(b);

    const addrStr = ((viewSegment << 4) + off).toString(16).padStart(5, '0').toUpperCase();
    const hexByte = b.toString(16).padStart(2, '0').toUpperCase();

    memoryLines.push({
      linear,
      segment: viewSegment,
      offset: off,
      addrStr,
      hexByte,
      decByte: b,
      asciiStr: asciiChar,
      isActive: off === currentIP && viewSegment === currentCS
    });
  }

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden border border-white/20 dark:border-white/10 shadow-xl select-none">
      {/* Top Address Bar (matches classic 0721:0000 input) */}
      <form
        onSubmit={handleAddressSubmit}
        className="h-10 px-3 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Memory Offset:</span>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-32 h-6 px-2 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-900 dark:text-blue-400 outline-none focus:border-blue-500 shadow-inner"
            placeholder="0700:0100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewSegment(currentCS);
              setViewOffset(currentIP);
              setAddressInput(`${currentCS.toString(16).padStart(4, '0')}:${currentIP.toString(16).padStart(4, '0')}`.toUpperCase());
            }}
            className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition active:scale-95"
          >
            Go to CS:IP
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            IP = {currentIP.toString(16).padStart(4, '0').toUpperCase()}h
          </span>
        </div>
      </form>

      {/* Dual Column View Area (matches screenshot layout) */}
      <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-slate-200 dark:divide-slate-800 font-mono text-xs">
        {/* Left Sub-Column: Memory Address + Hex + ASCII */}
        <div className="w-[50%] flex flex-col min-h-0 bg-white/40 dark:bg-slate-950/40">
          <div className="h-7 px-3 bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
            <span>Address & Bytes</span>
            <span>ASCII</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-1 divide-y divide-slate-100 dark:divide-slate-900/50">
            {memoryLines.map((row) => (
              <div
                key={row.linear}
                ref={row.isActive ? activeRowRef : undefined}
                className={`flex items-center justify-between px-2.5 py-1 rounded transition-colors ${
                  row.isActive
                    ? 'emu-active-row'
                    : 'hover:bg-slate-200/40 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${row.isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                    {row.addrStr}:
                  </span>
                  <span className={`font-bold w-6 ${row.isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {row.hexByte}
                  </span>
                  <span className={`w-8 text-right text-[11px] ${row.isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {row.decByte.toString().padStart(3, '0')}
                  </span>
                </div>

                <span className={`font-bold text-[11px] px-1.5 py-0.2 rounded ${
                  row.isActive ? 'text-white bg-white/20' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {row.asciiStr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sub-Column: Disassembly Instructions */}
        <div className="w-[50%] flex flex-col min-h-0 bg-white/30 dark:bg-slate-950/30">
          <div className="h-7 px-3 bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
            <span>Disassembly Stream</span>
            <span>State</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-1 divide-y divide-slate-100 dark:divide-slate-900/50">
            {sourceMap.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">
                Load or assemble a program to view disassembly
              </div>
            ) : (
              sourceMap.map((item, idx) => {
                const isActive = item.address === currentIP;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1 rounded transition-colors ${
                      isActive
                        ? 'emu-active-row'
                        : 'hover:bg-slate-200/40 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.disassembly}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.address.toString(16).padStart(4, '0').toUpperCase()}h
                      </span>
                      {isActive && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-blue-700 font-bold tracking-wider">
                          NEXT IP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
