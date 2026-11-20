import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CPU } from './core/cpu/cpu';
import { Assembler } from './core/assembler/assembler';
import { InterruptManager } from './core/hardware/interrupts';
import { PeripheralManager } from './core/hardware/peripherals';
import {
  Registers,
  Flags,
  EmulatorStatus,
  AssembleResult,
  RegisterName16
} from './types/emulator';
import { EXAMPLES, ExampleProgram } from './examples';

import { Navbar } from './components/Navbar';
import { RegistersPanel } from './components/RegistersPanel';
import { FlagsPanel } from './components/FlagsPanel';
import { EditorPane } from './components/EditorPane';
import { DualEmulatorView } from './components/DualEmulatorView';
import { VirtualScreen } from './components/VirtualScreen';
import { PeripheralsPanel } from './components/PeripheralsPanel';
import { StackVisualizer } from './components/StackVisualizer';
import { SymbolTable } from './components/SymbolTable';
import { ConsolePane } from './components/ConsolePane';
import { BottomBar, BottomTabType } from './components/BottomBar';
import { HexCalculator } from './components/HexCalculator';

import {
  Split,
  Maximize2,
  Terminal,
  AlertCircle,
  X
} from 'lucide-react';

export const App: React.FC = () => {
  // Core CPU & Assembly Engines
  const cpu = useMemo(() => new CPU(), []);
  const assembler = useMemo(() => new Assembler(), []);
  const interruptManager = useMemo(() => new InterruptManager(), []);
  const peripheralManager = useMemo(() => new PeripheralManager(), []);

  // Theme State (Liquid Glass Dark & Light Modes)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  // Application & Execution State
  const [code, setCode] = useState<string>(EXAMPLES[0].code);
  const [status, setStatus] = useState<EmulatorStatus>('ready');
  const [executionSpeed, setExecutionSpeed] = useState<number>(0); // ms delay (matches screenshot default 0)
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const [assembleResult, setAssembleResult] = useState<AssembleResult | null>(null);

  // CPU & Hardware State
  const [registers, setRegisters] = useState<Registers>(cpu.getRegisters());
  const [prevRegisters, setPrevRegisters] = useState<Registers | undefined>(undefined);
  const [flags, setFlags] = useState<Flags>({ ...cpu.flags });
  const [outputText, setOutputText] = useState<string>('');
  const [videoState, setVideoState] = useState({ ...interruptManager.videoState });
  const [, setPeripheralsTick] = useState(0);

  // View & UI Navigation (Matches Emu8086 Bottom Tabs)
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabType>('dual');
  const [showFlags, setShowFlags] = useState<boolean>(true);
  const [showConsoleDrawer, setShowConsoleDrawer] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'errors' | 'listing'>('output');

  const runTimerRef = useRef<number | null>(null);

  // Handle Theme switching on <html> tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Setup Hardware & Interrupt callbacks
  useEffect(() => {
    cpu.onInterrupt = (intNum, c) => interruptManager.handleInterrupt(intNum, c);
    cpu.onPortRead = (port) => peripheralManager.handlePortRead(port);
    cpu.onPortWrite = (port, val, isWord) => peripheralManager.handlePortWrite(port, val, isWord);

    interruptManager.onOutputChange = (text) => setOutputText(text);
    interruptManager.onVideoUpdate = () => setVideoState({ ...interruptManager.videoState });
    interruptManager.onHalt = () => setStatus('halted');

    peripheralManager.onStateChange = () => setPeripheralsTick(t => t + 1);

    // Initial assembly
    handleAssemble(EXAMPLES[0].code);
  }, []);

  // Sync state from CPU
  const syncCpuState = useCallback(() => {
    setPrevRegisters(registers);
    setRegisters(cpu.getRegisters());
    setFlags({ ...cpu.flags });
    setVideoState({ ...interruptManager.videoState });

    // Find active line in source map
    if (assembleResult) {
      const match = assembleResult.sourceMap.find(m => m.address === cpu.IP);
      if (match) {
        setCurrentLine(match.line);
      }
    }
  }, [cpu, registers, assembleResult, interruptManager]);

  // Assemble Code
  const handleAssemble = (sourceCode = code) => {
    const result = assembler.assemble(sourceCode);
    setAssembleResult(result);

    if (result.success) {
      cpu.loadProgram(result);
      interruptManager.reset();
      peripheralManager.reset();
      setOutputText('');
      setStatus('ready');

      // Set initial line
      const firstLine = result.sourceMap.find(m => m.address === result.entryPoint)?.line;
      setCurrentLine(firstLine);

      syncCpuState();
      setActiveBottomTab('dual'); // Switch to dual emulator view on load!
    } else {
      setStatus('error');
      setShowConsoleDrawer(true);
      setActiveConsoleTab('errors');
    }
  };

  // Single Step
  const handleStep = useCallback(() => {
    if (cpu.isHalted) {
      setStatus('halted');
      return;
    }

    const stepSuccess = cpu.step();
    syncCpuState();

    if (!stepSuccess || cpu.isHalted) {
      setStatus('halted');
      if (runTimerRef.current) {
        window.clearTimeout(runTimerRef.current);
        runTimerRef.current = null;
      }
      return;
    }

    // Check breakpoint
    if (assembleResult) {
      const activeLine = assembleResult.sourceMap.find(m => m.address === cpu.IP)?.line;
      if (activeLine && breakpoints.includes(activeLine)) {
        setStatus('paused');
        if (runTimerRef.current) {
          window.clearTimeout(runTimerRef.current);
          runTimerRef.current = null;
        }
      }
    }
  }, [cpu, syncCpuState, assembleResult, breakpoints]);

  // Step Back Execution
  const handleStepBack = () => {
    if (cpu.canStepBack()) {
      cpu.stepBack();
      syncCpuState();
      setStatus('paused');
    }
  };

  // Run Loop
  const handleRun = () => {
    if (status === 'error' || !assembleResult?.success) {
      handleAssemble();
    }
    if (cpu.isHalted) {
      if (assembleResult?.success) {
        cpu.loadProgram(assembleResult);
      } else {
        cpu.reset();
      }
      interruptManager.reset();
      peripheralManager.reset();
    }

    setStatus('running');

    const loop = () => {
      if (cpu.isHalted) {
        setStatus('halted');
        syncCpuState();
        return;
      }

      // If at breakpoint, pause
      if (assembleResult) {
        const line = assembleResult.sourceMap.find(m => m.address === cpu.IP)?.line;
        if (line && breakpoints.includes(line)) {
          setStatus('paused');
          syncCpuState();
          return;
        }
      }

      cpu.step();

      if (executionSpeed > 0) {
        syncCpuState();
        runTimerRef.current = window.setTimeout(loop, executionSpeed);
      } else {
        // Run a chunk of instructions per frame for full speed
        for (let i = 0; i < 40; i++) {
          if (cpu.isHalted) break;
          const line = assembleResult?.sourceMap.find(m => m.address === cpu.IP)?.line;
          if (line && breakpoints.includes(line)) {
            setStatus('paused');
            syncCpuState();
            return;
          }
          cpu.step();
        }
        syncCpuState();
        runTimerRef.current = window.setTimeout(loop, 16);
      }
    };

    loop();
  };

  // Pause
  const handlePause = () => {
    if (runTimerRef.current) {
      window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
    setStatus('paused');
    syncCpuState();
  };

  // Reset
  const handleReset = () => {
    if (runTimerRef.current) {
      window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
    if (assembleResult?.success) {
      cpu.loadProgram(assembleResult);
    } else {
      cpu.reset();
    }
    interruptManager.reset();
    peripheralManager.reset();
    setOutputText('');
    setStatus('ready');
    syncCpuState();
  };

  // Toggle Breakpoint
  const handleToggleBreakpoint = (line: number) => {
    setBreakpoints(prev =>
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    );
  };

  // Select Example Program
  const handleSelectExample = (ex: ExampleProgram) => {
    handlePause();
    setCode(ex.code);
    handleAssemble(ex.code);
  };

  // Export Binary (.COM)
  const handleExportBinary = () => {
    if (!assembleResult || !assembleResult.success) {
      alert('Please assemble the program first without errors.');
      return;
    }
    const blob = new Blob([assembleResult.binary.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.com';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Source (.ASM)
  const handleExportSource = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.asm';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard Shortcuts (F5, F8, Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (status === 'running') handlePause();
        else handleRun();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleStep();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAssemble();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, code, assembleResult]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
        isDarkMode ? 'liquid-ambient-dark text-slate-100' : 'liquid-ambient-light text-slate-900'
      }`}
    >
      {/* 1. Top Navbar (Titlebar, Menu Bar & Iconic Toolbar) */}
      <Navbar
        status={status}
        executionSpeed={executionSpeed}
        onSpeedChange={setExecutionSpeed}
        onAssemble={() => handleAssemble()}
        onRun={handleRun}
        onStep={handleStep}
        onStepBack={handleStepBack}
        canStepBack={cpu.canStepBack()}
        onPause={handlePause}
        onReset={handleReset}
        onSelectExample={handleSelectExample}
        onExportBinary={handleExportBinary}
        onExportSource={handleExportSource}
        onImportSource={(content) => {
          setCode(content);
          handleAssemble(content);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        activeView={activeBottomTab === 'source' ? 'editor' : 'dual'}
        onViewChange={(view) => setActiveBottomTab(view === 'editor' ? 'source' : 'dual')}
        onOpenCalculator={() => setShowCalculator(true)}
      />

      {/* 2. Middle Main Workspace (Fully Scrollable & Adaptive) */}
      <main className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-2.5">
        <div className="flex-1 min-h-[460px] flex flex-col md:flex-row gap-3">
          {/* Left Column: Authentic Emu8086 Registers Box */}
          <div className="shrink-0 flex flex-col gap-2">
            <RegistersPanel
              registers={registers}
              prevRegisters={prevRegisters}
              onUpdateRegister={(name, val) => {
                cpu[name] = val;
                syncCpuState();
              }}
            />
          </div>

          {/* Center Column: Dynamic View (Dual Disassembly/Memory View, Source Editor, Screen, etc.) */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {/* Optional Top Flags Bar (Toggled by [flags] button) */}
            {showFlags && (
              <FlagsPanel
                flags={flags}
                onToggleFlag={(key) => {
                  cpu.flags[key] = !cpu.flags[key];
                  syncCpuState();
                }}
                onClose={() => setShowFlags(false)}
              />
            )}

            {/* Split View Toggle Header */}
            <div className="flex items-center justify-between px-2 py-1 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {activeBottomTab === 'dual' ? 'Execution Disassembly & Memory' :
                   activeBottomTab === 'source' ? 'Monaco Assembly Editor' :
                   activeBottomTab === 'screen' ? 'Virtual DOS Screen' :
                   activeBottomTab === 'aux' ? 'Virtual Hardware Peripherals' :
                   activeBottomTab === 'vars' ? 'Variable & Symbol Table' :
                   activeBottomTab === 'stack' ? 'Call Stack Visualizer' : 'Debugger'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSplitView(!isSplitView)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    isSplitView
                      ? 'bg-blue-600 text-white'
                      : 'glass-btn border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Toggle Split View (Editor + Emulator side-by-side)"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Split Editor</span>
                </button>

                <button
                  onClick={() => setShowConsoleDrawer(!showConsoleDrawer)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    showConsoleDrawer
                      ? 'bg-blue-600 text-white'
                      : 'glass-btn border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Toggle Output Drawer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Output</span>
                </button>
              </div>
            </div>

            {/* View Container */}
            <div className="flex-1 min-h-0 flex gap-2">
              {/* If Split View is ON, show Editor on the left half */}
              {isSplitView && (
                <div className="w-[45%] h-full min-h-0">
                  <EditorPane
                    code={code}
                    onChange={setCode}
                    currentLine={currentLine}
                    breakpoints={breakpoints}
                    onToggleBreakpoint={handleToggleBreakpoint}
                    errors={assembleResult?.errors || []}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 h-full min-h-0">
                {activeBottomTab === 'dual' && (
                  <DualEmulatorView
                    cpu={cpu}
                    sourceMap={assembleResult?.sourceMap || []}
                    currentIP={cpu.IP}
                    currentCS={cpu.CS}
                  />
                )}

                {activeBottomTab === 'source' && !isSplitView && (
                  <EditorPane
                    code={code}
                    onChange={setCode}
                    currentLine={currentLine}
                    breakpoints={breakpoints}
                    onToggleBreakpoint={handleToggleBreakpoint}
                    errors={assembleResult?.errors || []}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeBottomTab === 'screen' && (
                  <VirtualScreen
                    videoState={videoState}
                    onKeyPress={(ascii) => interruptManager.pushKeyPress(ascii)}
                  />
                )}

                {activeBottomTab === 'aux' && (
                  <PeripheralsPanel
                    trafficLights={peripheralManager.trafficLights}
                    stepperMotor={peripheralManager.stepperMotor}
                    sevenSegment={peripheralManager.sevenSegment}
                    thermometerTemp={peripheralManager.thermometerTemp}
                    heaterOn={peripheralManager.heaterOn}
                  />
                )}

                {activeBottomTab === 'vars' && (
                  <SymbolTable
                    symbols={assembleResult?.symbols || {}}
                    cpu={cpu}
                    onUpdateVariable={() => syncCpuState()}
                  />
                )}

                {activeBottomTab === 'stack' && (
                  <StackVisualizer cpu={cpu} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Console / Output Drawer */}
        {showConsoleDrawer && (
          <div className="h-44 shrink-0 glass-panel overflow-hidden border border-white/20 dark:border-white/10 shadow-xl">
            <ConsolePane
              outputText={outputText}
              errors={assembleResult?.errors || []}
              listing={assembleResult?.listing || ''}
              onClearOutput={() => setOutputText('')}
              activeConsoleTab={activeConsoleTab}
              onConsoleTabChange={setActiveConsoleTab}
            />
          </div>
        )}
      </main>

      {/* 3. Iconic Bottom Bar ([screen] [source] [reset] [aux] [vars] [debug] [stack] [flags]) */}
      <BottomBar
        activeTab={activeBottomTab}
        onTabSelect={(tab) => {
          setActiveBottomTab(tab);
        }}
        onReset={handleReset}
        showFlags={showFlags}
        onToggleFlags={() => setShowFlags(!showFlags)}
        onOpenCalculator={() => setShowCalculator(true)}
      />

      {/* 4. Hexadecimal Calculator & Bitwise Verifier Modal */}
      <HexCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        registers={registers}
      />
    </div>
  );
};
