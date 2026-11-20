import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  StepForward,
  StepBack,
  RotateCcw,
  Download,
  BookOpen,
  Sun,
  Moon,
  ChevronDown,
  FolderOpen,
  FileCode,
  Binary,
  Wrench,
  Check
} from 'lucide-react';
import { EmulatorStatus } from '../types/emulator';
import { EXAMPLES, ExampleProgram } from '../examples';

interface NavbarProps {
  status: EmulatorStatus;
  executionSpeed: number;
  onSpeedChange: (speed: number) => void;
  onAssemble: () => void;
  onRun: () => void;
  onStep: () => void;
  onStepBack: () => void;
  canStepBack: boolean;
  onPause: () => void;
  onReset: () => void;
  onSelectExample: (ex: ExampleProgram) => void;
  onExportBinary: () => void;
  onExportSource: () => void;
  onImportSource: (content: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activeView: 'dual' | 'editor' | 'screen' | 'peripherals';
  onViewChange: (view: 'dual' | 'editor' | 'screen' | 'peripherals') => void;
  onOpenCalculator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  executionSpeed,
  onSpeedChange,
  onAssemble,
  onRun,
  onStep,
  onStepBack,
  canStepBack,
  onPause,
  onReset,
  onSelectExample,
  onExportBinary,
  onExportSource,
  onImportSource,
  isDarkMode,
  onToggleTheme,
  activeView,
  onViewChange,
  onOpenCalculator
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const examplesDropdownRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (examplesDropdownRef.current && !examplesDropdownRef.current.contains(e.target as Node)) {
        setIsExamplesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) onImportSource(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="glass-panel rounded-none border-x-0 border-t-0 shrink-0 select-none relative z-50 overflow-visible">
      {/* 1. Classic Windows/Emu8086 Window Title & Menu Bar */}
      <div className="h-7 px-3 bg-slate-200/40 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            <span>emulator: modern_emu8086.com_</span>
          </div>

          {/* Authentic Menu Bar */}
          <div className="hidden sm:flex items-center gap-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2 py-0.5 rounded transition ${
                  activeMenu === 'file' ? 'bg-blue-600 text-white' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800'
                }`}
              >
                file
              </button>
              {activeMenu === 'file' && (
                <div
                  onMouseLeave={() => setActiveMenu(null)}
                  className="absolute left-0 top-full mt-1 w-48 glass-panel p-1.5 z-[100] bg-white/95 dark:bg-[#0f172a]/95 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-xl"
                >
                  <button
                    onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Open .ASM file
                  </button>
                  <button
                    onClick={() => { onExportSource(); setActiveMenu(null); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5" /> Save Source (.ASM)
                  </button>
                  <button
                    onClick={() => { onExportBinary(); setActiveMenu(null); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Export .COM binary
                  </button>
                </div>
              )}
            </div>

            {/* Debug Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'debug' ? null : 'debug')}
                className={`px-2 py-0.5 rounded transition ${
                  activeMenu === 'debug' ? 'bg-blue-600 text-white' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800'
                }`}
              >
                debug
              </button>
              {activeMenu === 'debug' && (
                <div
                  onMouseLeave={() => setActiveMenu(null)}
                  className="absolute left-0 top-full mt-1 w-44 glass-panel p-1.5 z-[100] bg-white/95 dark:bg-[#0f172a]/95 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-xl"
                >
                  <button onClick={() => { onRun(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition">
                    Run (F5)
                  </button>
                  <button onClick={() => { onStep(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition">
                    Single Step (F8)
                  </button>
                  <button onClick={() => { onStepBack(); setActiveMenu(null); }} disabled={!canStepBack} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition disabled:opacity-40">
                    Step Back
                  </button>
                  <button onClick={() => { onReset(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition">
                    Reset CPU
                  </button>
                </div>
              )}
            </div>

            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                className={`px-2 py-0.5 rounded transition ${
                  activeMenu === 'tools' ? 'bg-blue-600 text-white' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800'
                }`}
              >
                tools
              </button>
              {activeMenu === 'tools' && (
                <div
                  onMouseLeave={() => setActiveMenu(null)}
                  className="absolute left-0 top-full mt-1 w-52 glass-panel p-1.5 z-[100] bg-white/95 dark:bg-[#0f172a]/95 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-xl"
                >
                  <button
                    onClick={() => { onOpenCalculator(); setActiveMenu(null); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-600 hover:text-white transition flex items-center gap-2 text-purple-600 dark:text-purple-400"
                  >
                    <Binary className="w-3.5 h-3.5" /> Hex Calculator
                  </button>
                  <button
                    onClick={() => { onViewChange('peripherals'); setActiveMenu(null); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-2"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Virtual Peripherals
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onViewChange(activeView === 'editor' ? 'dual' : 'editor')}
              className="px-2 py-0.5 rounded hover:bg-slate-300/50 dark:hover:bg-slate-800 transition"
            >
              view
            </button>
            <button
              onClick={() => onViewChange('peripherals')}
              className="px-2 py-0.5 rounded hover:bg-slate-300/50 dark:hover:bg-slate-800 transition"
            >
              virtual devices
            </button>
            <button
              onClick={() => onViewChange('screen')}
              className="px-2 py-0.5 rounded hover:bg-slate-300/50 dark:hover:bg-slate-800 transition"
            >
              virtual drive
            </button>
          </div>
        </div>

        {/* Liquid Glass Theme Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm border border-slate-300 dark:border-slate-700"
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Liquid Glass`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline font-mono">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-blue-500" />
                <span className="hidden sm:inline font-mono">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Iconic Large Button Action Toolbar (Matches User's Reference Screenshot) */}
      <div className="h-14 px-3 flex items-center justify-between gap-2 relative overflow-visible">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {/* LOAD Button (Assemble & Load into CPU) */}
          <button
            onClick={onAssemble}
            title="Compile & Load Machine Code (Ctrl+Enter)"
            className="glass-btn px-4 py-2 rounded-xl text-xs font-black tracking-wider border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-md hover:border-blue-500 dark:hover:border-blue-400 text-slate-900 dark:text-white uppercase transition active:scale-95 shrink-0"
          >
            LOAD
          </button>

          {/* reload Button */}
          <button
            onClick={onReset}
            title="Reload Program to Starting IP"
            className="glass-btn px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 gap-1.5 border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:bg-blue-500/10 transition active:scale-95 shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">reload</span>
          </button>

          {/* step back Button */}
          <button
            onClick={onStepBack}
            disabled={!canStepBack}
            title="Step Back to Previous Instruction"
            className="glass-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 gap-1.5 border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition active:scale-95 shrink-0"
          >
            <StepBack className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">step back</span>
          </button>

          {/* single step Button */}
          <button
            onClick={onStep}
            disabled={status === 'running'}
            title="Single Step Instruction (F8)"
            className="glass-btn px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1.5 border border-emerald-400/50 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 transition active:scale-95 shrink-0"
          >
            <StepForward className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            <span className="hidden sm:inline">single step</span>
          </button>

          {/* run / pause Button */}
          {status === 'running' ? (
            <button
              onClick={onPause}
              title="Pause Execution"
              className="glass-btn px-4 py-2 rounded-xl text-xs font-bold text-amber-500 gap-1.5 border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 transition active:scale-95 shadow-lg shadow-amber-500/10 shrink-0"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>pause</span>
            </button>
          ) : (
            <button
              onClick={onRun}
              title="Run Program (F5)"
              className="glass-btn-success px-4 py-2 rounded-xl text-xs font-bold gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>run</span>
            </button>
          )}

          {/* step delay ms Input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 text-xs shrink-0">
            <input
              type="number"
              min="0"
              max="1000"
              step="25"
              value={executionSpeed}
              onChange={(e) => onSpeedChange(Math.max(0, Number(e.target.value)))}
              className="w-12 h-6 text-center font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              step delay ms: {executionSpeed}
            </span>
          </div>
        </div>

        {/* Right Side: Hex Calc, Examples & Status */}
        <div className="flex items-center gap-2 shrink-0 relative overflow-visible">
          {/* Hex Calculator Button */}
          <button
            onClick={onOpenCalculator}
            className="glass-btn px-3 py-1.5 rounded-xl text-xs font-semibold gap-1.5 border border-purple-400/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition shadow-sm active:scale-95 flex items-center"
            title="Open 8086 Hex Calculator & Bitwise Verifier"
          >
            <Binary className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Hex Calc</span>
          </button>

          {/* Examples Dropdown (Controlled, High Z-Index, Never Cut Off) */}
          <div className="relative" ref={examplesDropdownRef}>
            <button
              onClick={() => setIsExamplesOpen(!isExamplesOpen)}
              className={`glass-btn px-3 py-1.5 rounded-xl text-xs font-semibold gap-1.5 border transition ${
                isExamplesOpen
                  ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">Examples</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExamplesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExamplesOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-panel p-2 z-[100] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-300 dark:border-slate-700 shadow-2xl rounded-2xl max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sample 8086 Programs
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-500">
                    {EXAMPLES.length} Programs
                  </span>
                </div>
                <div className="p-1 space-y-1">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        onSelectExample(ex);
                        setIsExamplesOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition group flex flex-col gap-0.5 text-slate-800 dark:text-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs group-hover:text-white">
                          {ex.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-700 group-hover:text-white font-mono uppercase font-semibold">
                          {ex.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-100 line-clamp-2">
                        {ex.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".asm,.s,.txt"
            className="hidden"
          />

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === 'running' ? 'bg-emerald-500 animate-pulse' :
              status === 'halted' ? 'bg-amber-500' :
              status === 'error' ? 'bg-rose-500' :
              'bg-blue-500'
            }`} />
            <span className="text-[11px] font-mono font-bold capitalize text-slate-700 dark:text-slate-300 hidden lg:inline">
              {status}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
