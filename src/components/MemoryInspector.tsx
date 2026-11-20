import React, { useState } from 'react';
import { CPU } from '../core/cpu/cpu';
import { Search, Navigation } from 'lucide-react';

interface MemoryInspectorProps {
  cpu: CPU;
  onMemoryChange: (address: number, val: number) => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  cpu,
  onMemoryChange
}) => {
  const [segmentStr, setSegmentStr] = useState<string>(
    cpu.DS.toString(16).padStart(4, '0').toUpperCase()
  );
  const [offsetStr, setOffsetStr] = useState<string>('0100');
  const [editingAddr, setEditingAddr] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  const seg = parseInt(segmentStr, 16) || 0;
  const off = parseInt(offsetStr, 16) || 0;
  const startLinear = cpu.linearAddress(seg, off);

  const rowCount = 14;
  const rows: Array<{
    linear: number;
    segOff: string;
    bytes: number[];
  }> = [];

  for (let r = 0; r < rowCount; r++) {
    const rowOffset = (off + r * 16) & 0xFFFF;
    const linear = cpu.linearAddress(seg, rowOffset);
    const bytes: number[] = [];
    for (let c = 0; c < 16; c++) {
      const b = (linear + c) < cpu.memory.length ? cpu.memory[linear + c] : 0;
      bytes.push(b);
    }
    rows.push({
      linear,
      segOff: `${seg.toString(16).padStart(4, '0').toUpperCase()}:${rowOffset.toString(16).padStart(4, '0').toUpperCase()}`,
      bytes
    });
  }

  const jumpTo = (targetSeg: number, targetOff: number) => {
    setSegmentStr(targetSeg.toString(16).padStart(4, '0').toUpperCase());
    setOffsetStr(targetOff.toString(16).padStart(4, '0').toUpperCase());
  };

  const handleByteClick = (linear: number, currentByte: number) => {
    setEditingAddr(linear);
    setEditVal(currentByte.toString(16).padStart(2, '0').toUpperCase());
  };

  const commitByteEdit = (linear: number) => {
    const parsed = parseInt(editVal, 16);
    if (!isNaN(parsed)) {
      onMemoryChange(linear, parsed & 0xFF);
    }
    setEditingAddr(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Navigation Bar */}
      <div className="bg-[#141b2a] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Address:</span>
          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="text"
              value={segmentStr}
              onChange={(e) => setSegmentStr(e.target.value.slice(0, 4))}
              className="w-14 bg-slate-900 border border-slate-700 text-center text-slate-100 rounded px-1 py-0.5 outline-none focus:border-blue-500"
              placeholder="0700"
            />
            <span className="text-slate-500">:</span>
            <input
              type="text"
              value={offsetStr}
              onChange={(e) => setOffsetStr(e.target.value.slice(0, 4))}
              className="w-14 bg-slate-900 border border-slate-700 text-center text-slate-100 rounded px-1 py-0.5 outline-none focus:border-blue-500"
              placeholder="0100"
            />
          </div>
        </div>

        {/* Quick Jump Badges */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => jumpTo(cpu.CS, cpu.IP)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600/30 text-blue-300 border border-slate-700 transition"
          >
            CS:IP
          </button>
          <button
            onClick={() => jumpTo(cpu.DS, 0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600/30 text-blue-300 border border-slate-700 transition"
          >
            DS:0000
          </button>
          <button
            onClick={() => jumpTo(cpu.SS, cpu.SP)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600/30 text-blue-300 border border-slate-700 transition"
          >
            SS:SP
          </button>
        </div>
      </div>

      {/* Hex Dump Grid */}
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex items-center text-slate-400 border-b border-slate-800 pb-1 mb-1 font-semibold text-[11px]">
            <span className="w-24 text-slate-400">Address</span>
            <div className="flex gap-2 mr-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-5 text-center">
                  {i.toString(16).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="text-slate-400">ASCII</span>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.linear}
              className="flex items-center hover:bg-slate-800/40 py-0.5 rounded transition"
            >
              <span className="w-24 text-slate-400 select-none">{row.segOff}</span>

              {/* 16 Hex Bytes */}
              <div className="flex gap-2 mr-4">
                {row.bytes.map((b, colIdx) => {
                  const addr = row.linear + colIdx;
                  const isIp = addr === cpu.linearAddress(cpu.CS, cpu.IP);
                  const isSp = addr === cpu.linearAddress(cpu.SS, cpu.SP);

                  return (
                    <span
                      key={colIdx}
                      onClick={() => handleByteClick(addr, b)}
                      className={`w-5 text-center cursor-pointer rounded transition select-none ${
                        isIp
                          ? 'bg-blue-500/30 text-blue-300 font-bold border border-blue-500/60'
                          : isSp
                          ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/60'
                          : b === 0
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-200 font-medium hover:bg-slate-800'
                      }`}
                    >
                      {editingAddr === addr ? (
                        <input
                          type="text"
                          autoFocus
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value.slice(0, 2))}
                          onBlur={() => commitByteEdit(addr)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitByteEdit(addr);
                            if (e.key === 'Escape') setEditingAddr(null);
                          }}
                          className="w-5 bg-blue-600 text-white text-center rounded outline-none"
                        />
                      ) : (
                        b.toString(16).padStart(2, '0').toUpperCase()
                      )}
                    </span>
                  );
                })}
              </div>

              {/* ASCII Representation */}
              <div className="text-slate-400 tracking-widest select-none">
                {row.bytes.map((b, i) => {
                  const ch = b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
                  return (
                    <span key={i} className={b >= 32 && b <= 126 ? 'text-slate-200' : 'text-slate-400'}>
                      {ch}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
