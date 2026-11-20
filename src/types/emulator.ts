export interface Registers {
  // General Purpose 16-bit
  AX: number;
  BX: number;
  CX: number;
  DX: number;
  
  // Pointer & Index Registers
  SI: number;
  DI: number;
  BP: number;
  SP: number;
  
  // Instruction Pointer
  IP: number;
  
  // Segment Registers
  CS: number;
  DS: number;
  SS: number;
  ES: number;
}

export interface Flags {
  CF: boolean; // Carry Flag
  PF: boolean; // Parity Flag
  AF: boolean; // Auxiliary Carry Flag
  ZF: boolean; // Zero Flag
  SF: boolean; // Sign Flag
  TF: boolean; // Trap Flag (Single step)
  IF: boolean; // Interrupt Enable Flag
  DF: boolean; // Direction Flag
  OF: boolean; // Overflow Flag
}

export type RegisterName16 = 'AX' | 'BX' | 'CX' | 'DX' | 'SI' | 'DI' | 'BP' | 'SP' | 'IP' | 'CS' | 'DS' | 'SS' | 'ES';
export type RegisterName8 = 'AL' | 'AH' | 'BL' | 'BH' | 'CL' | 'CH' | 'DL' | 'DH';
export type RegisterName = RegisterName16 | RegisterName8;

export interface AssemblyError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface SymbolEntry {
  name: string;
  value: number;
  type: 'label' | 'byte' | 'word' | 'constant';
  segment?: number;
  size?: number;
  line: number;
}

export interface SourceMapping {
  address: number;
  line: number;
  bytes: number[];
  disassembly: string;
}

export interface MemoryChunk {
  segment: number;
  offset: number;
  data: Uint8Array;
}

export interface AssembleResult {
  success: boolean;
  binary: Uint8Array;
  loadAddress: number;
  entryPoint: number;
  codeSegment?: number;
  dataSegment?: number;
  chunks?: MemoryChunk[];
  symbols: Record<string, SymbolEntry>;
  sourceMap: SourceMapping[];
  errors: AssemblyError[];
  listing: string;
}

export type EmulatorStatus = 'ready' | 'running' | 'paused' | 'halted' | 'error';

export interface TrafficLightState {
  // 12 lights: 4 directions x 3 colors (Red, Yellow, Green)
  north: { red: boolean; yellow: boolean; green: boolean };
  south: { red: boolean; yellow: boolean; green: boolean };
  east: { red: boolean; yellow: boolean; green: boolean };
  west: { red: boolean; yellow: boolean; green: boolean };
}

export interface StepperMotorState {
  angle: number; // 0 to 360 degrees
  steps: number;
  direction: 'cw' | 'ccw' | 'idle';
  phaseHistory: number[];
  lastPortValue: number;
}

export interface SevenSegmentState {
  digits: number[]; // 4 digits (digit values or raw segment masks)
  rawMasks: number[];
}

export interface VideoModeState {
  mode: number; // 03h (80x25 text), 13h (320x200 256 colors), etc.
  cursorRow: number;
  cursorCol: number;
  cursorVisible: boolean;
  charBuffer: Uint8Array; // 80x25 characters
  attrBuffer: Uint8Array; // 80x25 attributes (fg/bg color)
  graphicsBuffer: Uint8Array; // 320x200 pixel indexed palette
  palette: string[]; // RGB hex strings
}
