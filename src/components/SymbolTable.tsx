import React, { useState } from 'react';
import { SymbolEntry } from '../types/emulator';
import { CPU } from '../core/cpu/cpu';
import { Tag, Search, Variable, Bookmark, Edit3, Check, X, RefreshCw } from 'lucide-react';

interface SymbolTableProps {
  symbols: Record<string, SymbolEntry>;
  cpu?: CPU;
  onUpdateVariable?: (segment: number, offset: number, value: number, isWord: boolean) => void;
}

export const SymbolTable: React.FC<SymbolTableProps> = ({ symbols, cpu, onUpdateVariable }) => {
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'all' | 'variables' | 'labels'>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const symbolList = Object.values(symbols).filter(s => {
    const matchesFilter = s.name.toLowerCase().includes(filter.toLowerCase());
    if (!matchesFilter) return false;
    if (category === 'variables') return s.type === 'byte' || s.type === 'word';
    if (category === 'labels') return s.type === 'label';
    return true;
  });

  const getVariableRuntimeData = (sym: SymbolEntry) => {
    if (!cpu) return null;
    if (sym.type !== 'byte' && sym.type !== 'word') return null;

    const seg = sym.segment !== undefined ? sym.segment : cpu.DS;
    const isWord = sym.type === 'word';
    const val = isWord ? cpu.readWord(seg, sym.value) : cpu.readByte(seg, sym.value);

    const hex = isWord
      ? val.toString(16).padStart(4, '0').toUpperCase() + 'h'
      : val.toString(16).padStart(2, '0').toUpperCase() + 'h';

    // Signed decimal
    let signedDec = val;
    if (isWord) {
      if (val >= 0x8000) signedDec = val - 0x10000;
    } else {
      if (val >= 0x80) signedDec = val - 0x100;
    }

    // ASCII char
    let char = '';
    const byteVal = val & 0xFF;
    if (byteVal >= 32 && byteVal <= 126) {
      char = `'${String.fromCharCode(byteVal)}'`;
    } else if (byteVal === 0) {
      char = 'NULL';
    } else {
      char = '.';
    }

    // Binary
    const bin = val.toString(2).padStart(isWord ? 16 : 8, '0') + 'b';

    return {
      segment: seg,
      offset: sym.value,
      val,
      hex,
      dec: val,
      signedDec,
      char,
      bin
    };
  };

  const handleStartEdit = (sym: SymbolEntry, currentHex: string) => {
    setEditingKey(sym.name);
    setEditValue(currentHex.replace(/h$/i, ''));
  };

  const handleSaveEdit = (sym: SymbolEntry) => {
    if (!cpu) return;
    const isWord = sym.type === 'word';
    let parsed = parseInt(editValue, 16);
    if (isNaN(parsed)) {
      parsed = parseInt(editValue, 10);
    }
    if (!isNaN(parsed)) {
      const seg = sym.segment !== undefined ? sym.segment : cpu.DS;
      if (isWord) {
        cpu.writeWord(seg, sym.value, parsed & 0xFFFF);
      } else {
        cpu.writeByte(seg, sym.value, parsed & 0xFF);
      }
      onUpdateVariable?.(seg, sym.value, parsed, isWord);
    }
    setEditingKey(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 dark:bg-[#0c1222]/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 overflow-hidden shadow-xl text-slate-800 dark:text-slate-100">
      {/* Header bar */}
      <div className="bg-white/40 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Variable className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Variables & Symbol Inspector
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Live memory variable inspector ({symbolList.length} items)
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-300/50 dark:border-slate-700/60 text-[11px] font-semibold">
          <button
            onClick={() => setCategory('all')}
            className={`px-2 py-0.5 rounded-md transition ${
              category === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategory('variables')}
            className={`px-2 py-0.5 rounded-md transition ${
              category === 'variables'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Variables (DB/DW)
          </button>
          <button
            onClick={() => setCategory('labels')}
            className={`px-2 py-0.5 rounded-md transition ${
              category === 'labels'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Labels
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter vars..."
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none w-28 font-mono placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-3 font-mono text-xs">
        {symbolList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center gap-2">
            <Variable className="w-8 h-8 opacity-40 text-slate-500" />
            <p className="text-sm font-semibold">No symbols or variables found</p>
            <p className="text-xs text-slate-500">
              Assemble your code with <code className="text-blue-400">DB</code>, <code className="text-blue-400">DW</code> or labels to inspect values.
            </p>
          </div>
        ) : (
          <div className="border border-white/20 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Address</th>
                  <th className="py-2 px-3">Value (Hex)</th>
                  <th className="py-2 px-3">Decimal</th>
                  <th className="py-2 px-3">ASCII Char</th>
                  <th className="py-2 px-3">Binary</th>
                  <th className="py-2 px-3 text-right">Defined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                {symbolList.map(sym => {
                  const runtime = getVariableRuntimeData(sym);
                  const isEditing = editingKey === sym.name;
                  const isVar = sym.type === 'byte' || sym.type === 'word';

                  const segFormatted = sym.segment !== undefined
                    ? sym.segment.toString(16).padStart(4, '0').toUpperCase()
                    : (cpu ? (isVar ? cpu.DS.toString(16).padStart(4, '0').toUpperCase() : cpu.CS.toString(16).padStart(4, '0').toUpperCase()) : '0700');

                  const offsetFormatted = sym.value.toString(16).padStart(4, '0').toUpperCase();

                  return (
                    <tr
                      key={sym.name}
                      className="hover:bg-blue-500/5 dark:hover:bg-blue-400/5 transition duration-150"
                    >
                      {/* Name */}
                      <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                        {isVar ? (
                          <Variable className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span>{sym.name}</span>
                      </td>

                      {/* Type */}
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          sym.type === 'byte'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : sym.type === 'word'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : sym.type === 'label'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                        }`}>
                          {sym.type}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-semibold font-mono">
                        {segFormatted}:{offsetFormatted}
                      </td>

                      {/* Value (Hex) */}
                      <td className="py-2 px-3">
                        {runtime ? (
                          isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(sym);
                                  if (e.key === 'Escape') setEditingKey(null);
                                }}
                                autoFocus
                                className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-blue-500 rounded text-xs font-mono text-blue-600 dark:text-blue-300 outline-none"
                              />
                              <button
                                onClick={() => handleSaveEdit(sym)}
                                className="p-0.5 text-emerald-600 hover:text-emerald-500"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="p-0.5 text-red-500 hover:text-red-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group">
                              <span
                                className="px-1.5 py-0.5 rounded font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 cursor-pointer border border-emerald-500/20"
                                onClick={() => handleStartEdit(sym, runtime.hex)}
                                title="Click to edit value"
                              >
                                {runtime.hex}
                              </span>
                              <Edit3
                                className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer transition"
                                onClick={() => handleStartEdit(sym, runtime.hex)}
                              />
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400">
                            {sym.value.toString(16).padStart(4, '0').toUpperCase()}h
                          </span>
                        )}
                      </td>

                      {/* Decimal */}
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">
                        {runtime ? (
                          <span>
                            {runtime.dec}{' '}
                            {runtime.signedDec !== runtime.dec && (
                              <span className="text-slate-400 text-[10px]">({runtime.signedDec})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">{sym.value}</span>
                        )}
                      </td>

                      {/* ASCII Char */}
                      <td className="py-2 px-3 font-mono text-amber-600 dark:text-amber-400">
                        {runtime ? runtime.char : '-'}
                      </td>

                      {/* Binary */}
                      <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {runtime ? runtime.bin : '-'}
                      </td>

                      {/* Defined Line */}
                      <td className="py-2 px-3 text-right text-slate-400">
                        Line {sym.line}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
