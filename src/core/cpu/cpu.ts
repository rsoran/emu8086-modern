import {
  Registers,
  Flags,
  RegisterName16,
  RegisterName8,
  RegisterName
} from '../../types/emulator';
import {
  MEMORY_SIZE,
  DEFAULT_SEGMENT,
  DEFAULT_COM_OFFSET,
  DEFAULT_STACK_POINTER,
  REG16,
  REG8,
  SREG,
  FLAG_MASKS
} from './constants';

export type InterruptHandler = (intNum: number, cpu: CPU) => boolean;
export type PortReadHandler = (port: number) => number;
export type PortWriteHandler = (port: number, value: number, isWord: boolean) => void;

export interface CPUSnapshot {
  registers: Registers;
  flags: Flags;
  memoryDiff: Array<{ addr: number; oldVal: number }>;
  instructionsExecuted: number;
  cycles: number;
  isHalted: boolean;
}

export class CPU {
  public memory = new Uint8Array(MEMORY_SIZE);

  // 16-bit Registers
  public AX = 0;
  public BX = 0;
  public CX = 0;
  public DX = 0;
  public SI = 0;
  public DI = 0;
  public BP = 0;
  public SP = DEFAULT_STACK_POINTER;
  public IP = DEFAULT_COM_OFFSET;
  public CS = DEFAULT_SEGMENT;
  public DS = DEFAULT_SEGMENT;
  public SS = DEFAULT_SEGMENT;
  public ES = DEFAULT_SEGMENT;

  // Flags
  public flags: Flags = {
    CF: false,
    PF: false,
    AF: false,
    ZF: false,
    SF: false,
    TF: false,
    IF: true,
    DF: false,
    OF: false
  };

  public isHalted = false;
  public instructionsExecuted = 0;
  public cycles = 0;

  // Step Back History
  private history: CPUSnapshot[] = [];
  private currentStepDiffs: Array<{ addr: number; oldVal: number }> = [];

  // Callbacks
  public onInterrupt?: InterruptHandler;
  public onPortRead?: PortReadHandler;
  public onPortWrite?: PortWriteHandler;

  constructor() {
    this.reset();
  }

  public reset(segment = DEFAULT_SEGMENT, ip = DEFAULT_COM_OFFSET) {
    this.AX = 0;
    this.BX = 0;
    this.CX = 0;
    this.DX = 0;
    this.SI = 0;
    this.DI = 0;
    this.BP = 0;
    this.SP = DEFAULT_STACK_POINTER;
    this.IP = ip;
    this.CS = segment;
    this.DS = segment;
    this.SS = segment;
    this.ES = segment;

    this.flags = {
      CF: false,
      PF: false,
      AF: false,
      ZF: false,
      SF: false,
      TF: false,
      IF: true,
      DF: false,
      OF: false
    };

    this.isHalted = false;
    this.instructionsExecuted = 0;
    this.cycles = 0;
    this.history = [];
    this.currentStepDiffs = [];
  }

  // 8-bit Register Getters and Setters
  public get AL(): number { return this.AX & 0xFF; }
  public set AL(v: number) { this.AX = (this.AX & 0xFF00) | (v & 0xFF); }

  public get AH(): number { return (this.AX >> 8) & 0xFF; }
  public set AH(v: number) { this.AX = ((v & 0xFF) << 8) | (this.AX & 0xFF); }

  public get BL(): number { return this.BX & 0xFF; }
  public set BL(v: number) { this.BX = (this.BX & 0xFF00) | (v & 0xFF); }

  public get BH(): number { return (this.BX >> 8) & 0xFF; }
  public set BH(v: number) { this.BX = ((v & 0xFF) << 8) | (this.BX & 0xFF); }

  public get CL(): number { return this.CX & 0xFF; }
  public set CL(v: number) { this.CX = (this.CX & 0xFF00) | (v & 0xFF); }

  public get CH(): number { return (this.CX >> 8) & 0xFF; }
  public set CH(v: number) { this.CX = ((v & 0xFF) << 8) | (this.CX & 0xFF); }

  public get DL(): number { return this.DX & 0xFF; }
  public set DL(v: number) { this.DX = (this.DX & 0xFF00) | (v & 0xFF); }

  public get DH(): number { return (this.DX >> 8) & 0xFF; }
  public set DH(v: number) { this.DX = ((v & 0xFF) << 8) | (this.DX & 0xFF); }

  public getReg16(name: RegisterName16): number {
    return this[name] & 0xFFFF;
  }

  public setReg16(name: RegisterName16, val: number) {
    this[name] = val & 0xFFFF;
  }

  public getReg8(name: RegisterName8): number {
    return this[name] & 0xFF;
  }

  public setReg8(name: RegisterName8, val: number) {
    this[name] = val & 0xFF;
  }

  public getRegByIndex16(idx: number): number {
    const names: RegisterName16[] = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
    return this.getReg16(names[idx & 7]);
  }

  public setRegByIndex16(idx: number, val: number) {
    const names: RegisterName16[] = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
    this.setReg16(names[idx & 7], val);
  }

  public getRegByIndex8(idx: number): number {
    const names: RegisterName8[] = ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH'];
    return this.getReg8(names[idx & 7]);
  }

  public setRegByIndex8(idx: number, val: number) {
    const names: RegisterName8[] = ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH'];
    this.setReg8(names[idx & 7], val);
  }

  public getSRegByIndex(idx: number): number {
    const sregs: Array<'ES' | 'CS' | 'SS' | 'DS'> = ['ES', 'CS', 'SS', 'DS'];
    return this[sregs[idx & 3]];
  }

  public setSRegByIndex(idx: number, val: number) {
    const sregs: Array<'ES' | 'CS' | 'SS' | 'DS'> = ['ES', 'CS', 'SS', 'DS'];
    this[sregs[idx & 3]] = val & 0xFFFF;
  }

  public getRegisters(): Registers {
    return {
      AX: this.AX,
      BX: this.BX,
      CX: this.CX,
      DX: this.DX,
      SI: this.SI,
      DI: this.DI,
      BP: this.BP,
      SP: this.SP,
      IP: this.IP,
      CS: this.CS,
      DS: this.DS,
      SS: this.SS,
      ES: this.ES
    };
  }

  // Address translation: (segment * 16 + offset) & 0xFFFFF
  public linearAddress(segment: number, offset: number): number {
    return ((segment << 4) + (offset & 0xFFFF)) & 0xFFFFF;
  }

  public readByte(segment: number, offset: number): number {
    const addr = this.linearAddress(segment, offset);
    return this.memory[addr];
  }

  public writeByte(segment: number, offset: number, value: number) {
    const addr = this.linearAddress(segment, offset);
    this.currentStepDiffs.push({ addr, oldVal: this.memory[addr] });
    this.memory[addr] = value & 0xFF;
  }

  public readWord(segment: number, offset: number): number {
    const low = this.readByte(segment, offset);
    const high = this.readByte(segment, (offset + 1) & 0xFFFF);
    return (high << 8) | low;
  }

  public writeWord(segment: number, offset: number, value: number) {
    this.writeByte(segment, offset, value & 0xFF);
    this.writeByte(segment, (offset + 1) & 0xFFFF, (value >> 8) & 0xFF);
  }

  // Stack Operations
  public pushWord(value: number) {
    this.SP = (this.SP - 2) & 0xFFFF;
    this.writeWord(this.SS, this.SP, value);
  }

  public popWord(): number {
    const val = this.readWord(this.SS, this.SP);
    this.SP = (this.SP + 2) & 0xFFFF;
    return val;
  }

  // Flags Register Packing
  public getFlagsWord(): number {
    let word = 0x0002; // Bit 1 is always 1 in 8086
    if (this.flags.CF) word |= FLAG_MASKS.CF;
    if (this.flags.PF) word |= FLAG_MASKS.PF;
    if (this.flags.AF) word |= FLAG_MASKS.AF;
    if (this.flags.ZF) word |= FLAG_MASKS.ZF;
    if (this.flags.SF) word |= FLAG_MASKS.SF;
    if (this.flags.TF) word |= FLAG_MASKS.TF;
    if (this.flags.IF) word |= FLAG_MASKS.IF;
    if (this.flags.DF) word |= FLAG_MASKS.DF;
    if (this.flags.OF) word |= FLAG_MASKS.OF;
    return word;
  }

  public setFlagsWord(val: number) {
    this.flags.CF = (val & FLAG_MASKS.CF) !== 0;
    this.flags.PF = (val & FLAG_MASKS.PF) !== 0;
    this.flags.AF = (val & FLAG_MASKS.AF) !== 0;
    this.flags.ZF = (val & FLAG_MASKS.ZF) !== 0;
    this.flags.SF = (val & FLAG_MASKS.SF) !== 0;
    this.flags.TF = (val & FLAG_MASKS.TF) !== 0;
    this.flags.IF = (val & FLAG_MASKS.IF) !== 0;
    this.flags.DF = (val & FLAG_MASKS.DF) !== 0;
    this.flags.OF = (val & FLAG_MASKS.OF) !== 0;
  }

  // Parity helper: count of set bits in lowest 8 bits is even
  public updateParityFlag(val8: number) {
    let count = 0;
    let b = val8 & 0xFF;
    while (b) {
      count += b & 1;
      b >>= 1;
    }
    this.flags.PF = (count % 2) === 0;
  }

  // Arithmetic Flags Calculation
  public updateAddFlags(a: number, b: number, res: number, isWord: boolean) {
    const mask = isWord ? 0xFFFF : 0xFF;
    const signBit = isWord ? 0x8000 : 0x80;
    const carryLimit = isWord ? 0x10000 : 0x100;

    this.flags.CF = res >= carryLimit || res < 0;
    const r = res & mask;
    this.flags.ZF = r === 0;
    this.flags.SF = (r & signBit) !== 0;
    this.updateParityFlag(r & 0xFF);
    this.flags.AF = ((a & 0x0F) + (b & 0x0F)) > 0x0F;
    // Overflow: (a ^ res) & (b ^ res) & signBit
    this.flags.OF = ((a ^ r) & (b ^ r) & signBit) !== 0;
  }

  public updateSubFlags(a: number, b: number, res: number, isWord: boolean) {
    const mask = isWord ? 0xFFFF : 0xFF;
    const signBit = isWord ? 0x8000 : 0x80;

    this.flags.CF = a < b;
    const r = res & mask;
    this.flags.ZF = r === 0;
    this.flags.SF = (r & signBit) !== 0;
    this.updateParityFlag(r & 0xFF);
    this.flags.AF = (a & 0x0F) < (b & 0x0F);
    // Overflow: (a ^ b) & (a ^ res) & signBit
    this.flags.OF = ((a ^ b) & (a ^ r) & signBit) !== 0;
  }

  public updateLogicFlags(res: number, isWord: boolean) {
    const mask = isWord ? 0xFFFF : 0xFF;
    const signBit = isWord ? 0x8000 : 0x80;
    const r = res & mask;

    this.flags.CF = false;
    this.flags.OF = false;
    this.flags.ZF = r === 0;
    this.flags.SF = (r & signBit) !== 0;
    this.updateParityFlag(r & 0xFF);
  }

  // Load binary into memory
  public loadBinary(binary: Uint8Array, segment = DEFAULT_SEGMENT, offset = DEFAULT_COM_OFFSET) {
    const start = this.linearAddress(segment, offset);
    for (let i = 0; i < binary.length; i++) {
      if (start + i < MEMORY_SIZE) {
        this.memory[start + i] = binary[i];
      }
    }
    this.reset(segment, offset);
  }

  // Load assembled program with potential multiple segments (DATA, CODE)
  public loadProgram(result: {
    binary: Uint8Array;
    loadAddress: number;
    entryPoint: number;
    codeSegment?: number;
    dataSegment?: number;
    chunks?: Array<{ segment: number; offset: number; data: Uint8Array }>;
  }) {
    if (result.chunks && result.chunks.length > 0) {
      for (const chunk of result.chunks) {
        const start = this.linearAddress(chunk.segment, chunk.offset);
        for (let i = 0; i < chunk.data.length; i++) {
          if (start + i < MEMORY_SIZE) {
            this.memory[start + i] = chunk.data[i];
          }
        }
      }
      const cs = result.codeSegment ?? DEFAULT_SEGMENT;
      const ip = result.entryPoint;
      const ds = result.dataSegment ?? DEFAULT_SEGMENT;
      this.reset(cs, ip);
      this.DS = ds;
      this.ES = ds;
    } else {
      this.loadBinary(result.binary, result.loadAddress, result.entryPoint);
    }
  }

  // Single Step Instruction Execution
  public step(): boolean {
    if (this.isHalted) return false;

    // Snapshot state before executing this instruction
    const currentDiffs: Array<{ addr: number; oldVal: number }> = [];
    this.currentStepDiffs = currentDiffs;
    const snapshot: CPUSnapshot = {
      registers: this.getRegisters(),
      flags: { ...this.flags },
      memoryDiff: currentDiffs,
      instructionsExecuted: this.instructionsExecuted,
      cycles: this.cycles,
      isHalted: this.isHalted
    };
    this.history.push(snapshot);
    if (this.history.length > 300) this.history.shift();

    let segmentOverride: number | undefined;

    // Check segment prefix overrides
    while (true) {
      const prefixByte = this.readByte(this.CS, this.IP);
      if (prefixByte === 0x26) { segmentOverride = this.ES; this.IP = (this.IP + 1) & 0xFFFF; }
      else if (prefixByte === 0x2E) { segmentOverride = this.CS; this.IP = (this.IP + 1) & 0xFFFF; }
      else if (prefixByte === 0x36) { segmentOverride = this.SS; this.IP = (this.IP + 1) & 0xFFFF; }
      else if (prefixByte === 0x3E) { segmentOverride = this.DS; this.IP = (this.IP + 1) & 0xFFFF; }
      else break;
    }

    const opcode = this.readByte(this.CS, this.IP);
    this.IP = (this.IP + 1) & 0xFFFF;
    this.instructionsExecuted++;

    // Decode and Execute
    return this.executeOpcode(opcode, segmentOverride);
  }

  // Step Back Execution (Undo step)
  public stepBack(): boolean {
    if (this.history.length === 0) return false;
    const prev = this.history.pop()!;

    this.AX = prev.registers.AX;
    this.BX = prev.registers.BX;
    this.CX = prev.registers.CX;
    this.DX = prev.registers.DX;
    this.SI = prev.registers.SI;
    this.DI = prev.registers.DI;
    this.BP = prev.registers.BP;
    this.SP = prev.registers.SP;
    this.IP = prev.registers.IP;
    this.CS = prev.registers.CS;
    this.DS = prev.registers.DS;
    this.SS = prev.registers.SS;
    this.ES = prev.registers.ES;

    this.flags = { ...prev.flags };
    this.instructionsExecuted = prev.instructionsExecuted;
    this.cycles = prev.cycles;
    this.isHalted = prev.isHalted;

    // Revert memory writes
    for (let i = prev.memoryDiff.length - 1; i >= 0; i--) {
      const diff = prev.memoryDiff[i];
      this.memory[diff.addr] = diff.oldVal;
    }

    return true;
  }

  public canStepBack(): boolean {
    return this.history.length > 0;
  }

  private fetchByte(): number {
    const b = this.readByte(this.CS, this.IP);
    this.IP = (this.IP + 1) & 0xFFFF;
    return b;
  }

  private fetchWord(): number {
    const low = this.fetchByte();
    const high = this.fetchByte();
    return (high << 8) | low;
  }

  private decodeModRM(segmentOverride?: number): {
    mod: number;
    reg: number;
    rm: number;
    isMemory: boolean;
    seg: number;
    offset: number;
  } {
    const modrm = this.fetchByte();
    const mod = (modrm >> 6) & 3;
    const reg = (modrm >> 3) & 7;
    const rm = modrm & 7;

    if (mod === 3) {
      return { mod, reg, rm, isMemory: false, seg: 0, offset: 0 };
    }

    let defaultSeg = this.DS;
    let offset = 0;

    if (mod === 0 && rm === 6) {
      // Direct addressing [disp16]
      offset = this.fetchWord();
    } else {
      switch (rm) {
        case 0: offset = (this.BX + this.SI) & 0xFFFF; break;
        case 1: offset = (this.BX + this.DI) & 0xFFFF; break;
        case 2: offset = (this.BP + this.SI) & 0xFFFF; defaultSeg = this.SS; break;
        case 3: offset = (this.BP + this.DI) & 0xFFFF; defaultSeg = this.SS; break;
        case 4: offset = this.SI; break;
        case 5: offset = this.DI; break;
        case 6: offset = this.BP; defaultSeg = this.SS; break;
        case 7: offset = this.BX; break;
      }

      if (mod === 1) {
        // 8-bit sign-extended displacement
        let d = this.fetchByte();
        if (d >= 0x80) d -= 0x100;
        offset = (offset + d) & 0xFFFF;
      } else if (mod === 2) {
        // 16-bit displacement
        const d = this.fetchWord();
        offset = (offset + d) & 0xFFFF;
      }
    }

    const seg = segmentOverride !== undefined ? segmentOverride : defaultSeg;
    return { mod, reg, rm, isMemory: true, seg, offset };
  }

  private executeOpcode(op: number, segOverride?: number): boolean {
    switch (op) {
      case 0x90: // NOP
        return true;

      case 0xF4: // HLT
        this.isHalted = true;
        return true;

      case 0xF8: this.flags.CF = false; return true; // CLC
      case 0xF9: this.flags.CF = true; return true;  // STC
      case 0xF5: this.flags.CF = !this.flags.CF; return true; // CMC
      case 0xFC: this.flags.DF = false; return true; // CLD
      case 0xFD: this.flags.DF = true; return true;  // STD
      case 0xFA: this.flags.IF = false; return true; // CLI
      case 0xFB: this.flags.IF = true; return true;  // STI

      case 0xCF: { // IRET
        this.IP = this.popWord();
        this.CS = this.popWord();
        this.setFlagsWord(this.popWord());
        return true;
      }

      case 0xC3: { // RET
        this.IP = this.popWord();
        return true;
      }

      case 0xC2: { // RET imm16
        const popBytes = this.fetchWord();
        this.IP = this.popWord();
        this.SP = (this.SP + popBytes) & 0xFFFF;
        return true;
      }

      case 0xCC: // INT 3
      case 0xCD: { // INT imm8
        const intNum = op === 0xCC ? 3 : this.fetchByte();
        if (this.onInterrupt) {
          const handled = this.onInterrupt(intNum, this);
          if (handled) return true;
        }
        // Fallback software interrupt push
        this.pushWord(this.getFlagsWord());
        this.pushWord(this.CS);
        this.pushWord(this.IP);
        this.flags.IF = false;
        this.flags.TF = false;
        // Vector address: intNum * 4
        this.IP = this.readWord(0, intNum * 4);
        this.CS = this.readWord(0, (intNum * 4) + 2);
        return true;
      }

      // IN / OUT
      case 0xE4: { // IN AL, imm8
        const port = this.fetchByte();
        this.AL = this.onPortRead ? this.onPortRead(port) : 0;
        return true;
      }
      case 0xE5: { // IN AX, imm8
        const port = this.fetchByte();
        const low = this.onPortRead ? this.onPortRead(port) : 0;
        const high = this.onPortRead ? this.onPortRead(port + 1) : 0;
        this.AX = (high << 8) | low;
        return true;
      }
      case 0xEC: { // IN AL, DX
        this.AL = this.onPortRead ? this.onPortRead(this.DX) : 0;
        return true;
      }
      case 0xED: { // IN AX, DX
        const low = this.onPortRead ? this.onPortRead(this.DX) : 0;
        const high = this.onPortRead ? this.onPortRead(this.DX + 1) : 0;
        this.AX = (high << 8) | low;
        return true;
      }
      case 0xE6: { // OUT imm8, AL
        const port = this.fetchByte();
        if (this.onPortWrite) this.onPortWrite(port, this.AL, false);
        return true;
      }
      case 0xE7: { // OUT imm8, AX
        const port = this.fetchByte();
        if (this.onPortWrite) this.onPortWrite(port, this.AX, true);
        return true;
      }
      case 0xEE: { // OUT DX, AL
        if (this.onPortWrite) this.onPortWrite(this.DX, this.AL, false);
        return true;
      }
      case 0xEF: { // OUT DX, AX
        if (this.onPortWrite) this.onPortWrite(this.DX, this.AX, true);
        return true;
      }

      // PUSH / POP reg16
      case 0x50: case 0x51: case 0x52: case 0x53:
      case 0x54: case 0x55: case 0x56: case 0x57: {
        this.pushWord(this.getRegByIndex16(op - 0x50));
        return true;
      }
      case 0x58: case 0x59: case 0x5A: case 0x5B:
      case 0x5C: case 0x5D: case 0x5E: case 0x5F: {
        this.setRegByIndex16(op - 0x58, this.popWord());
        return true;
      }

      // PUSH / POP sreg
      case 0x06: this.pushWord(this.ES); return true;
      case 0x0E: this.pushWord(this.CS); return true;
      case 0x16: this.pushWord(this.SS); return true;
      case 0x1E: this.pushWord(this.DS); return true;
      case 0x07: this.ES = this.popWord(); return true;
      case 0x17: this.SS = this.popWord(); return true;
      case 0x1F: this.DS = this.popWord(); return true;

      // INC / DEC reg16
      case 0x40: case 0x41: case 0x42: case 0x43:
      case 0x44: case 0x45: case 0x46: case 0x47: {
        const idx = op - 0x40;
        const oldVal = this.getRegByIndex16(idx);
        const res = (oldVal + 1) & 0xFFFF;
        this.setRegByIndex16(idx, res);
        // Flags (CF untouched)
        this.flags.ZF = res === 0;
        this.flags.SF = (res & 0x8000) !== 0;
        this.updateParityFlag(res & 0xFF);
        this.flags.AF = (oldVal & 0x0F) === 0x0F;
        this.flags.OF = oldVal === 0x7FFF;
        return true;
      }
      case 0x48: case 0x49: case 0x4A: case 0x4B:
      case 0x4C: case 0x4D: case 0x4E: case 0x4F: {
        const idx = op - 0x48;
        const oldVal = this.getRegByIndex16(idx);
        const res = (oldVal - 1) & 0xFFFF;
        this.setRegByIndex16(idx, res);
        // Flags (CF untouched)
        this.flags.ZF = res === 0;
        this.flags.SF = (res & 0x8000) !== 0;
        this.updateParityFlag(res & 0xFF);
        this.flags.AF = (oldVal & 0x0F) === 0;
        this.flags.OF = oldVal === 0x8000;
        return true;
      }

      // MOV reg8, imm8 (B0 - B7)
      case 0xB0: case 0xB1: case 0xB2: case 0xB3:
      case 0xB4: case 0xB5: case 0xB6: case 0xB7: {
        this.setRegByIndex8(op - 0xB0, this.fetchByte());
        return true;
      }

      // MOV reg16, imm16 (B8 - BF)
      case 0xB8: case 0xB9: case 0xBA: case 0xBB:
      case 0xBC: case 0xBD: case 0xBE: case 0xBF: {
        this.setRegByIndex16(op - 0xB8, this.fetchWord());
        return true;
      }

      // LEA reg16, mem
      case 0x8D: {
        const m = this.decodeModRM(segOverride);
        if (m.isMemory) {
          this.setRegByIndex16(m.reg, m.offset);
        }
        return true;
      }

      // MOV sreg, reg / reg, sreg
      case 0x8E: { // MOV sreg, r/m16
        const m = this.decodeModRM(segOverride);
        const val = m.isMemory ? this.readWord(m.seg, m.offset) : this.getRegByIndex16(m.rm);
        this.setSRegByIndex(m.reg, val);
        return true;
      }
      case 0x8C: { // MOV r/m16, sreg
        const m = this.decodeModRM(segOverride);
        const val = this.getSRegByIndex(m.reg);
        if (m.isMemory) {
          this.writeWord(m.seg, m.offset, val);
        } else {
          this.setRegByIndex16(m.rm, val);
        }
        return true;
      }

      // MOV r/m, reg and reg, r/m
      case 0x88: { // MOV r/m8, reg8
        const m = this.decodeModRM(segOverride);
        const val = this.getRegByIndex8(m.reg);
        if (m.isMemory) this.writeByte(m.seg, m.offset, val);
        else this.setRegByIndex8(m.rm, val);
        return true;
      }
      case 0x89: { // MOV r/m16, reg16
        const m = this.decodeModRM(segOverride);
        const val = this.getRegByIndex16(m.reg);
        if (m.isMemory) this.writeWord(m.seg, m.offset, val);
        else this.setRegByIndex16(m.rm, val);
        return true;
      }
      case 0x8A: { // MOV reg8, r/m8
        const m = this.decodeModRM(segOverride);
        const val = m.isMemory ? this.readByte(m.seg, m.offset) : this.getRegByIndex8(m.rm);
        this.setRegByIndex8(m.reg, val);
        return true;
      }
      case 0x8B: { // MOV reg16, r/m16
        const m = this.decodeModRM(segOverride);
        const val = m.isMemory ? this.readWord(m.seg, m.offset) : this.getRegByIndex16(m.rm);
        this.setRegByIndex16(m.reg, val);
        return true;
      }

      // MOV r/m, imm
      case 0xC6: { // MOV r/m8, imm8
        const m = this.decodeModRM(segOverride);
        const imm = this.fetchByte();
        if (m.isMemory) this.writeByte(m.seg, m.offset, imm);
        else this.setRegByIndex8(m.rm, imm);
        return true;
      }
      case 0xC7: { // MOV r/m16, imm16
        const m = this.decodeModRM(segOverride);
        const imm = this.fetchWord();
        if (m.isMemory) this.writeWord(m.seg, m.offset, imm);
        else this.setRegByIndex16(m.rm, imm);
        return true;
      }

      // ALU operations with ModR/M (ADD, OR, ADC, SBB, AND, SUB, XOR, CMP)
      case 0x00: case 0x01: case 0x02: case 0x03:
      case 0x08: case 0x09: case 0x0A: case 0x0B:
      case 0x10: case 0x11: case 0x12: case 0x13:
      case 0x18: case 0x19: case 0x1A: case 0x1B:
      case 0x20: case 0x21: case 0x22: case 0x23:
      case 0x28: case 0x29: case 0x2A: case 0x2B:
      case 0x30: case 0x31: case 0x32: case 0x33:
      case 0x38: case 0x39: case 0x3A: case 0x3B: {
        const aluOp = (op >> 3) & 7;
        const isWord = (op & 1) !== 0;
        const dirRegToRM = (op & 2) === 0; // 0 = reg is source, r/m is dest; 1 = r/m is source, reg is dest

        const m = this.decodeModRM(segOverride);
        let destVal: number;
        let srcVal: number;

        if (dirRegToRM) {
          destVal = m.isMemory ? (isWord ? this.readWord(m.seg, m.offset) : this.readByte(m.seg, m.offset)) : (isWord ? this.getRegByIndex16(m.rm) : this.getRegByIndex8(m.rm));
          srcVal = isWord ? this.getRegByIndex16(m.reg) : this.getRegByIndex8(m.reg);
        } else {
          destVal = isWord ? this.getRegByIndex16(m.reg) : this.getRegByIndex8(m.reg);
          srcVal = m.isMemory ? (isWord ? this.readWord(m.seg, m.offset) : this.readByte(m.seg, m.offset)) : (isWord ? this.getRegByIndex16(m.rm) : this.getRegByIndex8(m.rm));
        }

        const res = this.performALU(aluOp, destVal, srcVal, isWord);

        if (aluOp !== 7) { // CMP does not store result
          if (dirRegToRM) {
            if (m.isMemory) {
              if (isWord) this.writeWord(m.seg, m.offset, res);
              else this.writeByte(m.seg, m.offset, res);
            } else {
              if (isWord) this.setRegByIndex16(m.rm, res);
              else this.setRegByIndex8(m.rm, res);
            }
          } else {
            if (isWord) this.setRegByIndex16(m.reg, res);
            else this.setRegByIndex8(m.reg, res);
          }
        }
        return true;
      }

      // ALU Accumulator with imm (04, 05, 0C, 0D, 14, 15, 1C, 1D, 24, 25, 2C, 2D, 34, 35, 3C, 3D)
      case 0x04: case 0x05: case 0x0C: case 0x0D:
      case 0x14: case 0x15: case 0x1C: case 0x1D:
      case 0x24: case 0x25: case 0x2C: case 0x2D:
      case 0x34: case 0x35: case 0x3C: case 0x3D: {
        const aluOp = (op >> 3) & 7;
        const isWord = (op & 1) !== 0;
        const imm = isWord ? this.fetchWord() : this.fetchByte();
        const acc = isWord ? this.AX : this.AL;
        const res = this.performALU(aluOp, acc, imm, isWord);
        if (aluOp !== 7) {
          if (isWord) this.AX = res;
          else this.AL = res;
        }
        return true;
      }

      // ALU r/m with immediate (80h, 81h, 83h)
      case 0x80:
      case 0x81:
      case 0x83: {
        const isWord = op !== 0x80;
        const m = this.decodeModRM(segOverride);
        const aluOp = m.reg;
        let imm: number;

        if (op === 0x83) {
          // Sign extended 8-bit immediate to 16-bit
          let b = this.fetchByte();
          if (b >= 0x80) b -= 0x100;
          imm = b & 0xFFFF;
        } else {
          imm = isWord ? this.fetchWord() : this.fetchByte();
        }

        const destVal = m.isMemory
          ? (isWord ? this.readWord(m.seg, m.offset) : this.readByte(m.seg, m.offset))
          : (isWord ? this.getRegByIndex16(m.rm) : this.getRegByIndex8(m.rm));

        const res = this.performALU(aluOp, destVal, imm, isWord);

        if (aluOp !== 7) {
          if (m.isMemory) {
            if (isWord) this.writeWord(m.seg, m.offset, res);
            else this.writeByte(m.seg, m.offset, res);
          } else {
            if (isWord) this.setRegByIndex16(m.rm, res);
            else this.setRegByIndex8(m.rm, res);
          }
        }
        return true;
      }

      // Shift / Rotate (D0, D1, D2, D3)
      case 0xD0: case 0xD1: case 0xD2: case 0xD3: {
        const isWord = (op & 1) !== 0;
        const isCL = (op & 2) !== 0;
        const count = isCL ? this.CL : 1;
        const m = this.decodeModRM(segOverride);
        const shiftType = m.reg;

        let val = m.isMemory
          ? (isWord ? this.readWord(m.seg, m.offset) : this.readByte(m.seg, m.offset))
          : (isWord ? this.getRegByIndex16(m.rm) : this.getRegByIndex8(m.rm));

        for (let i = 0; i < count; i++) {
          val = this.performShift(shiftType, val, isWord);
        }

        if (m.isMemory) {
          if (isWord) this.writeWord(m.seg, m.offset, val);
          else this.writeByte(m.seg, m.offset, val);
        } else {
          if (isWord) this.setRegByIndex16(m.rm, val);
          else this.setRegByIndex8(m.rm, val);
        }
        return true;
      }

      // Branch / Jump Instructions
      case 0xEB: { // JMP short (relative 8-bit)
        let rel = this.fetchByte();
        if (rel >= 0x80) rel -= 0x100;
        this.IP = (this.IP + rel) & 0xFFFF;
        return true;
      }
      case 0xE9: { // JMP near (relative 16-bit)
        let rel = this.fetchWord();
        if (rel >= 0x8000) rel -= 0x10000;
        this.IP = (this.IP + rel) & 0xFFFF;
        return true;
      }
      case 0xE8: { // CALL near (relative 16-bit)
        let rel = this.fetchWord();
        if (rel >= 0x8000) rel -= 0x10000;
        this.pushWord(this.IP);
        this.IP = (this.IP + rel) & 0xFFFF;
        return true;
      }

      // Conditional short jumps (70h - 7Fh)
      case 0x70: return this.branchCond(this.flags.OF);
      case 0x71: return this.branchCond(!this.flags.OF);
      case 0x72: return this.branchCond(this.flags.CF); // JB / JC
      case 0x73: return this.branchCond(!this.flags.CF); // JAE / JNC
      case 0x74: return this.branchCond(this.flags.ZF); // JE / JZ
      case 0x75: return this.branchCond(!this.flags.ZF); // JNE / JNZ
      case 0x76: return this.branchCond(this.flags.CF || this.flags.ZF); // JBE
      case 0x77: return this.branchCond(!this.flags.CF && !this.flags.ZF); // JA
      case 0x78: return this.branchCond(this.flags.SF); // JS
      case 0x79: return this.branchCond(!this.flags.SF); // JNS
      case 0x7A: return this.branchCond(this.flags.PF); // JP
      case 0x7B: return this.branchCond(!this.flags.PF); // JNP
      case 0x7C: return this.branchCond(this.flags.SF !== this.flags.OF); // JL
      case 0x7D: return this.branchCond(this.flags.SF === this.flags.OF); // JGE
      case 0x7E: return this.branchCond(this.flags.ZF || (this.flags.SF !== this.flags.OF)); // JLE
      case 0x7F: return this.branchCond(!this.flags.ZF && (this.flags.SF === this.flags.OF)); // JG

      // LOOP / JCXZ
      case 0xE2: { // LOOP
        let rel = this.fetchByte();
        if (rel >= 0x80) rel -= 0x100;
        this.CX = (this.CX - 1) & 0xFFFF;
        if (this.CX !== 0) {
          this.IP = (this.IP + rel) & 0xFFFF;
        }
        return true;
      }
      case 0xE3: { // JCXZ
        let rel = this.fetchByte();
        if (rel >= 0x80) rel -= 0x100;
        if (this.CX === 0) {
          this.IP = (this.IP + rel) & 0xFFFF;
        }
        return true;
      }

      // Group 3: NOT, NEG, MUL, IMUL, DIV, IDIV (F6h / F7h)
      case 0xF6:
      case 0xF7: {
        const isWord = op === 0xF7;
        const m = this.decodeModRM(segOverride);
        const sub = m.reg;
        let val = m.isMemory
          ? (isWord ? this.readWord(m.seg, m.offset) : this.readByte(m.seg, m.offset))
          : (isWord ? this.getRegByIndex16(m.rm) : this.getRegByIndex8(m.rm));

        switch (sub) {
          case 2: { // NOT
            val = (~val) & (isWord ? 0xFFFF : 0xFF);
            if (m.isMemory) {
              if (isWord) this.writeWord(m.seg, m.offset, val);
              else this.writeByte(m.seg, m.offset, val);
            } else {
              if (isWord) this.setRegByIndex16(m.rm, val);
              else this.setRegByIndex8(m.rm, val);
            }
            return true;
          }
          case 3: { // NEG
            const res = (0 - val) & (isWord ? 0xFFFF : 0xFF);
            this.updateSubFlags(0, val, res, isWord);
            this.flags.CF = val !== 0;
            if (m.isMemory) {
              if (isWord) this.writeWord(m.seg, m.offset, res);
              else this.writeByte(m.seg, m.offset, res);
            } else {
              if (isWord) this.setRegByIndex16(m.rm, res);
              else this.setRegByIndex8(m.rm, res);
            }
            return true;
          }
          case 4: { // MUL
            if (isWord) {
              const res = (this.AX * val) >>> 0;
              this.AX = res & 0xFFFF;
              this.DX = (res >>> 16) & 0xFFFF;
              const hasHigh = this.DX !== 0;
              this.flags.CF = hasHigh;
              this.flags.OF = hasHigh;
            } else {
              const res = this.AL * val;
              this.AX = res & 0xFFFF;
              const hasHigh = (this.AX & 0xFF00) !== 0;
              this.flags.CF = hasHigh;
              this.flags.OF = hasHigh;
            }
            return true;
          }
          case 5: { // IMUL
            if (isWord) {
              let s1 = this.AX >= 0x8000 ? this.AX - 0x10000 : this.AX;
              let s2 = val >= 0x8000 ? val - 0x10000 : val;
              const res = s1 * s2;
              this.AX = res & 0xFFFF;
              this.DX = (res >> 16) & 0xFFFF;
              const hasHigh = (res < -32768 || res > 32767);
              this.flags.CF = hasHigh;
              this.flags.OF = hasHigh;
            } else {
              let s1 = this.AL >= 0x80 ? this.AL - 0x100 : this.AL;
              let s2 = val >= 0x80 ? val - 0x100 : val;
              const res = s1 * s2;
              this.AX = res & 0xFFFF;
              const hasHigh = (res < -128 || res > 127);
              this.flags.CF = hasHigh;
              this.flags.OF = hasHigh;
            }
            return true;
          }
          case 6: { // DIV
            if (val === 0) {
              // Division by zero
              return false;
            }
            if (isWord) {
              const num = ((this.DX << 16) | this.AX) >>> 0;
              const quot = Math.floor(num / val);
              const rem = num % val;
              if (quot > 0xFFFF) return false;
              this.AX = quot & 0xFFFF;
              this.DX = rem & 0xFFFF;
            } else {
              const num = this.AX;
              const quot = Math.floor(num / val);
              const rem = num % val;
              if (quot > 0xFF) return false;
              this.AL = quot & 0xFF;
              this.AH = rem & 0xFF;
            }
            return true;
          }
        }
        break;
      }

      // Group 4 & 5: INC / DEC / CALL / JMP / PUSH (FEh / FFh)
      case 0xFE: { // INC / DEC r/m8
        const m = this.decodeModRM(segOverride);
        const sub = m.reg;
        const oldVal = m.isMemory ? this.readByte(m.seg, m.offset) : this.getRegByIndex8(m.rm);
        let res: number;
        if (sub === 0) { // INC
          res = (oldVal + 1) & 0xFF;
          this.flags.ZF = res === 0;
          this.flags.SF = (res & 0x80) !== 0;
          this.updateParityFlag(res);
          this.flags.AF = (oldVal & 0x0F) === 0x0F;
          this.flags.OF = oldVal === 0x7F;
        } else if (sub === 1) { // DEC
          res = (oldVal - 1) & 0xFF;
          this.flags.ZF = res === 0;
          this.flags.SF = (res & 0x80) !== 0;
          this.updateParityFlag(res);
          this.flags.AF = (oldVal & 0x0F) === 0;
          this.flags.OF = oldVal === 0x80;
        } else {
          return false;
        }
        if (m.isMemory) this.writeByte(m.seg, m.offset, res);
        else this.setRegByIndex8(m.rm, res);
        return true;
      }

      case 0xFF: { // INC / DEC / CALL / JMP / PUSH r/m16
        const m = this.decodeModRM(segOverride);
        const sub = m.reg;
        if (sub === 0) { // INC r/m16
          const oldVal = m.isMemory ? this.readWord(m.seg, m.offset) : this.getRegByIndex16(m.rm);
          const res = (oldVal + 1) & 0xFFFF;
          this.flags.ZF = res === 0;
          this.flags.SF = (res & 0x8000) !== 0;
          this.updateParityFlag(res & 0xFF);
          this.flags.AF = (oldVal & 0x0F) === 0x0F;
          this.flags.OF = oldVal === 0x7FFF;
          if (m.isMemory) this.writeWord(m.seg, m.offset, res);
          else this.setRegByIndex16(m.rm, res);
          return true;
        } else if (sub === 1) { // DEC r/m16
          const oldVal = m.isMemory ? this.readWord(m.seg, m.offset) : this.getRegByIndex16(m.rm);
          const res = (oldVal - 1) & 0xFFFF;
          this.flags.ZF = res === 0;
          this.flags.SF = (res & 0x8000) !== 0;
          this.updateParityFlag(res & 0xFF);
          this.flags.AF = (oldVal & 0x0F) === 0;
          this.flags.OF = oldVal === 0x8000;
          if (m.isMemory) this.writeWord(m.seg, m.offset, res);
          else this.setRegByIndex16(m.rm, res);
          return true;
        } else if (sub === 6) { // PUSH r/m16
          const val = m.isMemory ? this.readWord(m.seg, m.offset) : this.getRegByIndex16(m.rm);
          this.pushWord(val);
          return true;
        }
        return false;
      }
    }

    return false;
  }

  private branchCond(condition: boolean): boolean {
    let rel = this.fetchByte();
    if (rel >= 0x80) rel -= 0x100;
    if (condition) {
      this.IP = (this.IP + rel) & 0xFFFF;
    }
    return true;
  }

  private performALU(op: number, a: number, b: number, isWord: boolean): number {
    const mask = isWord ? 0xFFFF : 0xFF;
    switch (op) {
      case 0: { // ADD
        const res = a + b;
        this.updateAddFlags(a, b, res, isWord);
        return res & mask;
      }
      case 1: { // OR
        const res = (a | b) & mask;
        this.updateLogicFlags(res, isWord);
        return res;
      }
      case 2: { // ADC
        const carry = this.flags.CF ? 1 : 0;
        const res = a + b + carry;
        this.updateAddFlags(a, b + carry, res, isWord);
        return res & mask;
      }
      case 3: { // SBB
        const borrow = this.flags.CF ? 1 : 0;
        const res = a - (b + borrow);
        this.updateSubFlags(a, b + borrow, res, isWord);
        return res & mask;
      }
      case 4: { // AND
        const res = (a & b) & mask;
        this.updateLogicFlags(res, isWord);
        return res;
      }
      case 5: { // SUB
        const res = a - b;
        this.updateSubFlags(a, b, res, isWord);
        return res & mask;
      }
      case 6: { // XOR
        const res = (a ^ b) & mask;
        this.updateLogicFlags(res, isWord);
        return res;
      }
      case 7: { // CMP
        const res = a - b;
        this.updateSubFlags(a, b, res, isWord);
        return res & mask;
      }
    }
    return 0;
  }

  private performShift(type: number, val: number, isWord: boolean): number {
    const mask = isWord ? 0xFFFF : 0xFF;
    const signBit = isWord ? 0x8000 : 0x80;

    switch (type) {
      case 0: { // ROL
        const topBit = (val & signBit) !== 0 ? 1 : 0;
        this.flags.CF = topBit === 1;
        const res = ((val << 1) | topBit) & mask;
        return res;
      }
      case 1: { // ROR
        const lowBit = (val & 1) !== 0 ? 1 : 0;
        this.flags.CF = lowBit === 1;
        const res = ((val >> 1) | (lowBit ? signBit : 0)) & mask;
        return res;
      }
      case 4: { // SHL / SAL
        this.flags.CF = (val & signBit) !== 0;
        const res = (val << 1) & mask;
        this.flags.ZF = res === 0;
        this.flags.SF = (res & signBit) !== 0;
        this.updateParityFlag(res & 0xFF);
        return res;
      }
      case 5: { // SHR
        this.flags.CF = (val & 1) !== 0;
        const res = (val >> 1) & mask;
        this.flags.ZF = res === 0;
        this.flags.SF = false;
        this.updateParityFlag(res & 0xFF);
        return res;
      }
      case 7: { // SAR
        this.flags.CF = (val & 1) !== 0;
        const top = val & signBit;
        const res = ((val >> 1) | top) & mask;
        this.flags.ZF = res === 0;
        this.flags.SF = (res & signBit) !== 0;
        this.updateParityFlag(res & 0xFF);
        return res;
      }
    }
    return val;
  }
}
