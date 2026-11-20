import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  RotateCcw,
  Binary,
  Hash,
  ArrowRight,
  Maximize2,
  Minimize2,
  Cpu
} from 'lucide-react';
import { Registers } from '../types/emulator';

interface HexCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  registers?: Registers;
}

type BitMode = 8 | 16 | 32;

export const HexCalculator: React.FC<HexCalculatorProps> = ({
  isOpen,
  onClose,
  registers
}) => {
  const [bitMode, setBitMode] = useState<BitMode>(8);
  const [inputVal, setInputVal] = useState<string>('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [history, setHistory] = useState<string>('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Compute max mask based on bitMode
  const getMask = (mode = bitMode) => {
    if (mode === 8) return 0xFF;
    if (mode === 16) return 0xFFFF;
    return 0xFFFFFFFF >>> 0;
  };

  const currentNum = (parseInt(inputVal, 16) || 0) & getMask();

  // Flag calculations for the current number & last operation
  const computeFlags = (val: number, carry = false, overflow = false) => {
    const mask = getMask();
    const signBit = bitMode === 8 ? 0x80 : bitMode === 16 ? 0x8000 : 0x80000000;
    const v = val & mask;

    // Parity: count lowest 8 bits
    let ones = 0;
    let b = v & 0xFF;
    while (b) {
      ones += b & 1;
      b >>= 1;
    }
    const pf = ones % 2 === 0;

    return {
      CF: carry,
      ZF: v === 0,
      SF: (v & signBit) !== 0,
      OF: overflow,
      PF: pf
    };
  };

  const [lastFlags, setLastFlags] = useState(() => computeFlags(0));

  useEffect(() => {
    setLastFlags(computeFlags(currentNum));
  }, [inputVal, bitMode]);

  if (!isOpen) return null;

  // Convert current number to various formats
  const mask = getMask();
  const hexFormatted = currentNum.toString(16).toUpperCase().padStart(bitMode === 8 ? 2 : bitMode === 16 ? 4 : 8, '0');
  const decUnsigned = currentNum >>> 0;
  let decSigned = currentNum;
  if (bitMode === 8 && currentNum >= 0x80) decSigned = currentNum - 0x100;
  if (bitMode === 16 && currentNum >= 0x8000) decSigned = currentNum - 0x10000;
  if (bitMode === 32 && currentNum >= 0x80000000) decSigned = currentNum - 0x100000000;

  const binFormatted = currentNum
    .toString(2)
    .padStart(bitMode, '0')
    .match(/.{1,4}/g)
    ?.join(' ') || '';

  const octFormatted = currentNum.toString(8);

  const asciiChar = (() => {
    const byte = currentNum & 0xFF;
    if (byte >= 32 && byte <= 126) return `'${String.fromCharCode(byte)}'`;
    if (byte === 0) return 'NUL';
    return '.';
  })();

  const handleDigit = (digit: string) => {
    setInputVal(prev => {
      if (prev === '0') return digit;
      const next = prev + digit;
      if (next.length > (bitMode === 8 ? 2 : bitMode === 16 ? 4 : 8)) {
        return next.slice(- (bitMode === 8 ? 2 : bitMode === 16 ? 4 : 8));
      }
      return next;
    });
  };

  const handleClear = () => {
    setInputVal('0');
    setPrevVal(null);
    setPendingOp(null);
    setHistory('');
    setLastFlags(computeFlags(0));
  };

  const handleBackspace = () => {
    setInputVal(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleOperation = (op: string) => {
    const val = currentNum;
    if (prevVal !== null && pendingOp) {
      calculateResult(prevVal, val, pendingOp);
    } else {
      setPrevVal(val);
      setPendingOp(op);
      setHistory(`${val.toString(16).toUpperCase()}h ${op}`);
      setInputVal('0');
    }
  };

  const calculateResult = (a: number, b: number, op: string) => {
    const m = getMask();
    const carryLimit = bitMode === 8 ? 0x100 : bitMode === 16 ? 0x10000 : 0x100000000;
    const signBit = bitMode === 8 ? 0x80 : bitMode === 16 ? 0x8000 : 0x80000000;

    let res = 0;
    let carry = false;
    let overflow = false;

    switch (op) {
      case '+': {
        const raw = a + b;
        res = raw & m;
        carry = raw >= carryLimit;
        const aSign = (a & signBit) !== 0;
        const bSign = (b & signBit) !== 0;
        const rSign = (res & signBit) !== 0;
        overflow = (aSign === bSign) && (aSign !== rSign);
        break;
      }
      case '-': {
        const raw = a - b;
        res = (raw + carryLimit) & m;
        carry = a < b;
        const aSign = (a & signBit) !== 0;
        const bSign = (b & signBit) !== 0;
        const rSign = (res & signBit) !== 0;
        overflow = (aSign !== bSign) && (aSign !== rSign);
        break;
      }
      case '*': {
        const raw = a * b;
        res = raw & m;
        carry = raw >= carryLimit;
        overflow = carry;
        break;
      }
      case '/': {
        if (b === 0) {
          alert('Divide by zero (INT 0)');
          return;
        }
        res = Math.floor(a / b) & m;
        carry = false;
        break;
      }
      case 'AND': res = (a & b) & m; break;
      case 'OR':  res = (a | b) & m; break;
      case 'XOR': res = (a ^ b) & m; break;
      case 'SHL': {
        const raw = a << (b & 0x1F);
        res = raw & m;
        carry = (a & (carryLimit >> 1)) !== 0;
        break;
      }
      case 'SHR': {
        res = (a >>> (b & 0x1F)) & m;
        carry = (a & 1) !== 0;
        break;
      }
      default:
        res = b & m;
    }

    const hexRes = res.toString(16).toUpperCase();
    setInputVal(hexRes);
    setHistory(`${a.toString(16).toUpperCase()}h ${op} ${b.toString(16).toUpperCase()}h = ${hexRes}h`);
    setPrevVal(null);
    setPendingOp(null);
    setLastFlags(computeFlags(res, carry, overflow));
  };

  const handleUnary = (type: 'NOT' | 'NEG') => {
    const val = currentNum;
    const m = getMask();
    let res = 0;
    if (type === 'NOT') {
      res = (~val) & m;
    } else if (type === 'NEG') {
      res = (-val) & m;
    }
    const hexRes = res.toString(16).toUpperCase();
    setInputVal(hexRes);
    setHistory(`${type}(${val.toString(16).toUpperCase()}h) = ${hexRes}h`);
    setLastFlags(computeFlags(res, type === 'NEG' && val !== 0));
  };

  const handleEquals = () => {
    if (prevVal !== null && pendingOp) {
      calculateResult(prevVal, currentNum, pendingOp);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedFormat(label);
    setTimeout(() => setCopiedFormat(null), 1800);
  };

  const injectReg = (val: number) => {
    const m = getMask();
    setInputVal((val & m).toString(16).toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#0c1224]/95 text-slate-800 dark:text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Binary className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                8086 Hex Calculator & Bitwise Verifier
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Manual arithmetic, bitwise verification & CPU flag simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bit Mode Toggle */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setBitMode(8)}
                className={`px-2 py-0.5 rounded-md transition ${
                  bitMode === 8
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                8-bit (BYTE)
              </button>
              <button
                onClick={() => setBitMode(16)}
                className={`px-2 py-0.5 rounded-md transition ${
                  bitMode === 16
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                16-bit (WORD)
              </button>
              <button
                onClick={() => setBitMode(32)}
                className={`px-2 py-0.5 rounded-md transition ${
                  bitMode === 32
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                32-bit
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Close Calculator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 flex flex-col gap-2">
          {/* History line */}
          <div className="h-5 text-right font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
            {history || (pendingOp ? `${prevVal?.toString(16).toUpperCase()}h ${pendingOp}` : '\u00A0')}
          </div>

          {/* Primary Hex Display */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">HEX</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-wider">
                {hexFormatted}h
              </span>
              <button
                onClick={() => copyToClipboard(hexFormatted + 'h', 'hex')}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition"
                title="Copy Hex"
              >
                {copiedFormat === 'hex' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Base Breakdown Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-xs font-mono">
            <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Decimal (U/S)</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {decUnsigned} <span className="text-[10px] text-slate-400">({decSigned})</span>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ASCII Char</div>
              <div className="font-bold text-amber-600 dark:text-amber-400 truncate">
                {asciiChar}
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Octal</div>
              <div className="font-bold text-slate-700 dark:text-slate-300 truncate">
                {octFormatted}o
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Binary</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] truncate">
                {binFormatted}b
              </div>
            </div>
          </div>

          {/* Computed 8086 Flags Result Preview */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Computed 8086 Flags:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                lastFlags.CF ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                CF: {lastFlags.CF ? '1' : '0'}
              </span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                lastFlags.ZF ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                ZF: {lastFlags.ZF ? '1' : '0'}
              </span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                lastFlags.SF ? 'bg-purple-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                SF: {lastFlags.SF ? '1' : '0'}
              </span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                lastFlags.OF ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                OF: {lastFlags.OF ? '1' : '0'}
              </span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                lastFlags.PF ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                PF: {lastFlags.PF ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Registers Injection Row (if registers provided) */}
        {registers && (
          <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-blue-500" /> Insert Reg:
            </span>
            <button onClick={() => injectReg(registers.AX & 0xFF)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition">
              AL ({((registers.AX & 0xFF)).toString(16).toUpperCase()}h)
            </button>
            <button onClick={() => injectReg((registers.AX >> 8) & 0xFF)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition">
              AH ({(((registers.AX >> 8) & 0xFF)).toString(16).toUpperCase()}h)
            </button>
            <button onClick={() => injectReg(registers.AX)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition">
              AX ({registers.AX.toString(16).toUpperCase()}h)
            </button>
            <button onClick={() => injectReg(registers.BX)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition">
              BX ({registers.BX.toString(16).toUpperCase()}h)
            </button>
            <button onClick={() => injectReg(registers.CX)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition">
              CX ({registers.CX.toString(16).toUpperCase()}h)
            </button>
            <button onClick={() => injectReg(registers.DX)} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white font-mono font-bold text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition">
              DX ({registers.DX.toString(16).toUpperCase()}h)
            </button>
          </div>
        )}

        {/* Keypad */}
        <div className="p-4 grid grid-cols-6 gap-2 text-xs font-mono font-bold">
          {/* Operations row 1 */}
          <button onClick={() => handleOperation('AND')} className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">AND</button>
          <button onClick={() => handleOperation('OR')}  className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">OR</button>
          <button onClick={() => handleOperation('XOR')} className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">XOR</button>
          <button onClick={() => handleUnary('NOT')}     className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">NOT</button>
          <button onClick={() => handleOperation('SHL')} className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">SHL</button>
          <button onClick={() => handleOperation('SHR')} className="py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition">SHR</button>

          {/* Hex row 1 */}
          <button onClick={() => handleDigit('A')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">A</button>
          <button onClick={() => handleDigit('B')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">B</button>
          <button onClick={() => handleDigit('7')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">7</button>
          <button onClick={() => handleDigit('8')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">8</button>
          <button onClick={() => handleDigit('9')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">9</button>
          <button onClick={() => handleOperation('+')} className="py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition text-sm">+</button>

          {/* Hex row 2 */}
          <button onClick={() => handleDigit('C')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">C</button>
          <button onClick={() => handleDigit('D')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">D</button>
          <button onClick={() => handleDigit('4')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">4</button>
          <button onClick={() => handleDigit('5')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">5</button>
          <button onClick={() => handleDigit('6')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">6</button>
          <button onClick={() => handleOperation('-')} className="py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition text-sm">-</button>

          {/* Hex row 3 */}
          <button onClick={() => handleDigit('E')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">E</button>
          <button onClick={() => handleDigit('F')} className="py-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition text-sm">F</button>
          <button onClick={() => handleDigit('1')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">1</button>
          <button onClick={() => handleDigit('2')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">2</button>
          <button onClick={() => handleDigit('3')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">3</button>
          <button onClick={() => handleOperation('*')} className="py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition text-sm">×</button>

          {/* Bottom row */}
          <button onClick={handleClear} className="py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition">C</button>
          <button onClick={handleBackspace} className="py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition">⌫</button>
          <button onClick={() => handleDigit('0')} className="py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm">0</button>
          <button onClick={() => handleUnary('NEG')} className="py-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition">NEG</button>
          <button onClick={() => handleOperation('/')} className="py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition text-sm">÷</button>
          <button onClick={handleEquals} className="py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition text-sm font-black">=</button>
        </div>
      </div>
    </div>
  );
};
