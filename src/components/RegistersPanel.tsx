import React, { useState } from 'react';
import { Registers, RegisterName16 } from '../types/emulator';

interface RegistersPanelProps {
  registers: Registers;
  prevRegisters?: Registers;
  onUpdateRegister: (name: RegisterName16, val: number) => void;
  onUpdateHighLow?: (reg: 'AX' | 'BX' | 'CX' | 'DX', isHigh: boolean, val8: number) => void;
}

export const RegistersPanel: React.FC<RegistersPanelProps> = ({
  registers,
  prevRegisters,
  onUpdateRegister
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const formatHex = (val: number, len = 4) => {
    return (val & (len === 4 ? 0xFFFF : 0xFF)).toString(16).padStart(len, '0').toUpperCase();
  };

  const hasChanged = (reg: keyof Registers) => {
    if (!prevRegisters) return false;
    return prevRegisters[reg] !== registers[reg];
  };

  const startEdit16 = (name: RegisterName16) => {
    setEditingField(name);
    setEditValue(formatHex(registers[name], 4));
  };

  const startEdit8 = (reg: 'AX' | 'BX' | 'CX' | 'DX', isHigh: boolean) => {
    setEditingField(`${reg}_${isHigh ? 'H' : 'L'}`);
    const val = isHigh ? (registers[reg] >> 8) & 0xFF : registers[reg] & 0xFF;
    setEditValue(formatHex(val, 2));
  };

  const commitEdit = () => {
    if (!editingField) return;

    if (editingField.includes('_')) {
      const [regName, part] = editingField.split('_') as ['AX' | 'BX' | 'CX' | 'DX', 'H' | 'L'];
      const parsed8 = parseInt(editValue, 16);
      if (!isNaN(parsed8)) {
        const cur16 = registers[regName];
        let new16 = cur16;
        if (part === 'H') {
          new16 = ((parsed8 & 0xFF) << 8) | (cur16 & 0xFF);
        } else {
          new16 = (cur16 & 0xFF00) | (parsed8 & 0xFF);
        }
        onUpdateRegister(regName, new16);
      }
    } else {
      const parsed = parseInt(editValue, 16);
      if (!isNaN(parsed)) {
        onUpdateRegister(editingField as RegisterName16, parsed & 0xFFFF);
      }
    }

    setEditingField(null);
  };

  const generalRegs: Array<{ name: 'AX' | 'BX' | 'CX' | 'DX'; role: string }> = [
    { name: 'AX', role: 'Accumulator' },
    { name: 'BX', role: 'Base' },
    { name: 'CX', role: 'Count' },
    { name: 'DX', role: 'Data' }
  ];

  const singleRegs: Array<{ name: RegisterName16; role: string }> = [
    { name: 'CS', role: 'Code Segment' },
    { name: 'IP', role: 'Instruction Pointer' },
    { name: 'SS', role: 'Stack Segment' },
    { name: 'SP', role: 'Stack Pointer' },
    { name: 'BP', role: 'Base Pointer' },
    { name: 'SI', role: 'Source Index' },
    { name: 'DI', role: 'Destination Index' },
    { name: 'DS', role: 'Data Segment' },
    { name: 'ES', role: 'Extra Segment' }
  ];

  return (
    <div className="glass-panel p-3 flex flex-col font-mono text-xs select-none w-56 shrink-0 shadow-lg border border-white/20 dark:border-white/10">
      {/* Title with Classic Emu8086 Group Legend */}
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          registers
        </span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
          16-BIT
        </span>
      </div>

      {/* Header H & L */}
      <div className="flex justify-end gap-1.5 pr-1 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-400">
        <span className="w-10 text-center">H</span>
        <span className="w-10 text-center">L</span>
      </div>

      {/* General Purpose AX, BX, CX, DX */}
      <div className="flex flex-col gap-1.5 mb-2">
        {generalRegs.map(reg => {
          const val = registers[reg.name];
          const highVal = (val >> 8) & 0xFF;
          const lowVal = val & 0xFF;
          const changed = hasChanged(reg.name);

          return (
            <div
              key={reg.name}
              className={`flex items-center justify-between p-1 rounded-lg transition-all ${
                changed ? 'changed-value bg-blue-500/20' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span
                onClick={() => startEdit16(reg.name)}
                title={`${reg.name} (${reg.role}): ${val} dec\nClick to edit 16-bit word`}
                className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer w-7 pl-1 hover:underline"
              >
                {reg.name}
              </span>

              <div className="flex gap-1.5">
                {/* High Byte [ H ] */}
                {editingField === `${reg.name}_H` ? (
                  <input
                    type="text"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.slice(0, 2))}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    className="w-10 h-6 bg-blue-600 text-white font-bold text-center text-xs rounded border border-blue-400 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit8(reg.name, true)}
                    title={`${reg.name} High byte: ${highVal} dec`}
                    className="w-10 h-6 rounded border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 font-bold text-center text-xs shadow-inner hover:border-blue-400 transition cursor-text"
                  >
                    {formatHex(highVal, 2)}
                  </button>
                )}

                {/* Low Byte [ L ] */}
                {editingField === `${reg.name}_L` ? (
                  <input
                    type="text"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.slice(0, 2))}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    className="w-10 h-6 bg-blue-600 text-white font-bold text-center text-xs rounded border border-blue-400 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit8(reg.name, false)}
                    title={`${reg.name} Low byte: ${lowVal} dec`}
                    className="w-10 h-6 rounded border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 font-bold text-center text-xs shadow-inner hover:border-blue-400 transition cursor-text"
                  >
                    {formatHex(lowVal, 2)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[1px] bg-slate-200 dark:bg-slate-800/80 my-1" />

      {/* Single 16-Bit Registers (CS, IP, SS, SP, BP, SI, DI, DS, ES) */}
      <div className="flex flex-col gap-1">
        {singleRegs.map(reg => {
          const val = registers[reg.name];
          const changed = hasChanged(reg.name);
          const isIP = reg.name === 'IP';
          const isCS = reg.name === 'CS';

          return (
            <div
              key={reg.name}
              className={`flex items-center justify-between p-1 rounded-lg transition-all ${
                changed ? 'changed-value bg-amber-500/20' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span
                onClick={() => startEdit16(reg.name)}
                title={`${reg.name} (${reg.role})\nClick to edit`}
                className={`font-bold cursor-pointer w-7 pl-1 hover:underline ${
                  isIP || isCS ? 'text-amber-500 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {reg.name}
              </span>

              {editingField === reg.name ? (
                <input
                  type="text"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.slice(0, 4))}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditingField(null);
                  }}
                  className="w-[5.3rem] h-6 bg-blue-600 text-white font-bold text-center text-xs rounded border border-blue-400 outline-none"
                />
              ) : (
                <button
                  onClick={() => startEdit16(reg.name)}
                  title={`${reg.name}: ${val} dec\nClick to edit value`}
                  className={`w-[5.3rem] h-6 rounded border font-bold text-center text-xs shadow-inner transition cursor-text ${
                    isIP
                      ? 'border-amber-400/80 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                      : isCS
                      ? 'border-purple-400/80 bg-purple-500/10 text-purple-600 dark:text-purple-300'
                      : 'border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 hover:border-blue-400'
                  }`}
                >
                  {formatHex(val, 4)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
