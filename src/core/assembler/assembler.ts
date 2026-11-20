import { Lexer, Token } from './lexer';
import {
  AssembleResult,
  AssemblyError,
  SourceMapping,
  SymbolEntry,
  MemoryChunk,
  RegisterName16,
  RegisterName8
} from '../../types/emulator';
import { REG16, REG8, SREG, DEFAULT_SEGMENT, DEFAULT_COM_OFFSET } from '../cpu/constants';

interface ParsedMemoryOperand {
  baseReg?: 'BX' | 'BP';
  indexReg?: 'SI' | 'DI';
  displacement: number;
  isDirect: boolean;
  directAddress?: number;
  segmentOverride?: 'CS' | 'DS' | 'SS' | 'ES';
  sizeHint?: 'BYTE' | 'WORD';
}

interface ParsedOperand {
  type: 'register' | 'segment' | 'memory' | 'immediate' | 'identifier';
  reg?: RegisterName16 | RegisterName8;
  sreg?: 'CS' | 'DS' | 'SS' | 'ES';
  mem?: ParsedMemoryOperand;
  imm?: number;
  ident?: string;
  size?: 'BYTE' | 'WORD';
}

export class Assembler {
  private symbols: Record<string, SymbolEntry> = {};
  private errors: AssemblyError[] = [];
  private sourceMap: SourceMapping[] = [];
  private listingLines: string[] = [];
  private currentOffset = DEFAULT_COM_OFFSET;
  private origin = DEFAULT_COM_OFFSET;
  private pass = 1;

  // Segment Support
  private hasSegments = false;
  private activeSegmentName = 'CODE';
  private currentSegment = DEFAULT_SEGMENT;
  private dataSegmentBase = 0x0700;
  private codeSegmentBase = 0x0710;
  private entryPoint = DEFAULT_COM_OFFSET;
  private dataBytes: number[] = [];
  private codeBytes: number[] = [];

  public assemble(source: string): AssembleResult {
    this.symbols = {};
    this.errors = [];
    this.sourceMap = [];
    this.listingLines = [];
    this.hasSegments = false;
    this.activeSegmentName = 'CODE';
    this.currentSegment = DEFAULT_SEGMENT;
    this.origin = DEFAULT_COM_OFFSET;
    this.currentOffset = DEFAULT_COM_OFFSET;
    this.entryPoint = DEFAULT_COM_OFFSET;
    this.dataBytes = [];
    this.codeBytes = [];

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    // Group tokens by lines
    const lineTokens = this.groupTokensByLine(tokens);

    // Pass 1: Collect symbols, labels, definitions, and compute offsets
    this.pass = 1;
    this.currentOffset = this.origin;
    for (const line of lineTokens) {
      if (line.tokens.length === 0) continue;
      this.processLine(line.lineNum, line.tokens, false);
    }

    if (this.errors.some(e => e.severity === 'error')) {
      return {
        success: false,
        binary: new Uint8Array(0),
        loadAddress: this.origin,
        entryPoint: this.origin,
        symbols: this.symbols,
        sourceMap: [],
        errors: this.errors,
        listing: this.listingLines.join('\n')
      };
    }

    // Pass 2: Generate machine code bytes
    this.pass = 2;
    this.activeSegmentName = this.hasSegments ? 'DATA' : 'CODE';
    this.currentSegment = this.hasSegments ? this.dataSegmentBase : DEFAULT_SEGMENT;
    this.currentOffset = this.hasSegments ? 0x0000 : this.origin;

    const generatedBytes: number[] = [];

    for (const line of lineTokens) {
      if (line.tokens.length === 0) continue;
      const startOffset = this.currentOffset;
      const bytes = this.processLine(line.lineNum, line.tokens, true);

      if (bytes && bytes.length > 0) {
        if (this.hasSegments) {
          if (this.activeSegmentName === 'DATA') {
            for (const b of bytes) this.dataBytes.push(b & 0xFF);
          } else {
            for (const b of bytes) this.codeBytes.push(b & 0xFF);
          }
        } else {
          for (const b of bytes) generatedBytes.push(b & 0xFF);
        }

        const hexBytes = bytes.map(b => (b & 0xFF).toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const lineText = line.tokens.map(t => t.value).join(' ');
        this.sourceMap.push({
          address: startOffset,
          line: line.lineNum,
          bytes: [...bytes],
          disassembly: lineText
        });

        this.listingLines.push(
          `${startOffset.toString(16).padStart(4, '0').toUpperCase()}  ${hexBytes.padEnd(16, ' ')}  ${lineText}`
        );
      }
    }

    if (this.hasSegments) {
      const chunks: MemoryChunk[] = [
        { segment: this.dataSegmentBase, offset: 0x0000, data: new Uint8Array(this.dataBytes) },
        { segment: this.codeSegmentBase, offset: 0x0000, data: new Uint8Array(this.codeBytes) }
      ];

      return {
        success: !this.errors.some(e => e.severity === 'error'),
        binary: new Uint8Array(this.codeBytes),
        loadAddress: 0x0000,
        entryPoint: this.entryPoint,
        codeSegment: this.codeSegmentBase,
        dataSegment: this.dataSegmentBase,
        chunks,
        symbols: this.symbols,
        sourceMap: this.sourceMap,
        errors: this.errors,
        listing: this.listingLines.join('\n')
      };
    }

    return {
      success: !this.errors.some(e => e.severity === 'error'),
      binary: new Uint8Array(generatedBytes),
      loadAddress: this.origin,
      entryPoint: this.origin,
      codeSegment: DEFAULT_SEGMENT,
      dataSegment: DEFAULT_SEGMENT,
      symbols: this.symbols,
      sourceMap: this.sourceMap,
      errors: this.errors,
      listing: this.listingLines.join('\n')
    };
  }

  private groupTokensByLine(tokens: Token[]): Array<{ lineNum: number; tokens: Token[] }> {
    const lines: Array<{ lineNum: number; tokens: Token[] }> = [];
    let curLineTokens: Token[] = [];
    let curLineNum = 1;

    for (const token of tokens) {
      if (token.type === 'NEWLINE') {
        lines.push({ lineNum: curLineNum, tokens: curLineTokens });
        curLineTokens = [];
        curLineNum = token.line + 1;
      } else if (token.type === 'EOF') {
        if (curLineTokens.length > 0) {
          lines.push({ lineNum: curLineNum, tokens: curLineTokens });
        }
        break;
      } else {
        curLineNum = token.line;
        curLineTokens.push(token);
      }
    }

    return lines;
  }

  private addError(line: number, column: number, message: string, severity: 'error' | 'warning' = 'error') {
    this.errors.push({ line, column, message, severity });
  }

  private processLine(lineNum: number, tokens: Token[], emit: boolean): number[] | null {
    if (tokens.length === 0) return null;

    let idx = 0;

    // Check for label at the start
    if (
      tokens.length >= 2 &&
      tokens[0].type === 'IDENTIFIER' &&
      tokens[1].type === 'COLON'
    ) {
      const labelName = tokens[0].value.toUpperCase();
      if (this.pass === 1) {
        if (this.symbols[labelName]) {
          this.addError(lineNum, tokens[0].column, `Duplicate label identifier: '${labelName}'`);
        }
        this.symbols[labelName] = {
          name: labelName,
          value: this.currentOffset,
          type: 'label',
          segment: this.currentSegment,
          line: lineNum
        };
      }
      idx = 2; // skip label:
      if (idx >= tokens.length) return null;
    }

    const firstToken = tokens[idx];
    if (!firstToken || firstToken.type !== 'IDENTIFIER') return null;

    const mnemonic = firstToken.value.toUpperCase();

    // Check for SEGMENT directive e.g. "data segment" or "code segment"
    if (
      tokens.length >= idx + 2 &&
      tokens[idx + 1].type === 'IDENTIFIER' &&
      tokens[idx + 1].value.toUpperCase() === 'SEGMENT'
    ) {
      this.hasSegments = true;
      const segName = mnemonic;
      this.activeSegmentName = segName;
      if (segName === 'DATA') {
        this.currentSegment = this.dataSegmentBase;
        this.currentOffset = 0x0000;
        this.symbols['DATA'] = {
          name: 'DATA',
          value: this.dataSegmentBase,
          type: 'constant',
          line: lineNum
        };
      } else if (segName === 'CODE') {
        this.currentSegment = this.codeSegmentBase;
        this.currentOffset = 0x0000;
        this.symbols['CODE'] = {
          name: 'CODE',
          value: this.codeSegmentBase,
          type: 'constant',
          line: lineNum
        };
      }
      return null;
    }

    // Check for ENDS directive e.g. "data ends" or "code ends"
    if (
      tokens.length >= idx + 2 &&
      tokens[idx + 1].type === 'IDENTIFIER' &&
      tokens[idx + 1].value.toUpperCase() === 'ENDS'
    ) {
      return null;
    }

    // ASSUME directive e.g. "assume cs:code,ds:data"
    if (mnemonic === 'ASSUME') {
      return null;
    }

    // END directive e.g. "end start"
    if (mnemonic === 'END') {
      if (tokens.length >= idx + 2 && tokens[idx + 1].type === 'IDENTIFIER') {
        const entryName = tokens[idx + 1].value.toUpperCase();
        const sym = this.symbols[entryName];
        if (sym) {
          this.entryPoint = sym.value;
        }
      }
      return null;
    }

    // ORG directive
    if (mnemonic === 'ORG') {
      const numToken = tokens[idx + 1];
      if (!numToken) {
        this.addError(lineNum, firstToken.column, 'Missing address for ORG directive');
        return null;
      }
      const val = this.resolveValue(numToken);
      if (val === null) {
        this.addError(lineNum, numToken.column, 'Invalid address for ORG directive');
        return null;
      }
      this.origin = val;
      this.currentOffset = val;
      if (!this.hasSegments) {
        this.entryPoint = val;
      }
      return null;
    }

    if (mnemonic === '.CODE' || mnemonic === '.DATA' || mnemonic === '.STACK' || mnemonic === '.MODEL') {
      if (mnemonic === '.DATA') {
        this.hasSegments = true;
        this.activeSegmentName = 'DATA';
        this.currentSegment = this.dataSegmentBase;
        this.currentOffset = 0x0000;
      } else if (mnemonic === '.CODE') {
        this.hasSegments = true;
        this.activeSegmentName = 'CODE';
        this.currentSegment = this.codeSegmentBase;
        this.currentOffset = 0x0000;
      }
      return null;
    }

    if (mnemonic === 'PROC' || mnemonic === 'ENDP') {
      return null;
    }

    // Variable definition with EQU
    if (
      tokens.length >= idx + 3 &&
      tokens[idx + 1].type === 'IDENTIFIER' &&
      tokens[idx + 1].value.toUpperCase() === 'EQU'
    ) {
      const varName = mnemonic;
      const val = this.resolveValue(tokens[idx + 2]);
      if (val !== null && this.pass === 1) {
        this.symbols[varName] = {
          name: varName,
          value: val,
          type: 'constant',
          line: lineNum
        };
      }
      return null;
    }

    // Variable definition: varName DB ... or varName DW ...
    if (
      tokens.length >= idx + 2 &&
      tokens[idx + 1].type === 'IDENTIFIER' &&
      (tokens[idx + 1].value.toUpperCase() === 'DB' || tokens[idx + 1].value.toUpperCase() === 'DW')
    ) {
      const varName = mnemonic;
      const defType = tokens[idx + 1].value.toUpperCase();
      if (this.pass === 1) {
        this.symbols[varName] = {
          name: varName,
          value: this.currentOffset,
          type: defType === 'DB' ? 'byte' : 'word',
          segment: this.currentSegment,
          line: lineNum
        };
      }

      // Collect data bytes
      const bytes: number[] = [];
      let dIdx = idx + 2;
      while (dIdx < tokens.length) {
        const itemToken = tokens[dIdx];
        if (itemToken.type === 'COMMA') {
          dIdx++;
          continue;
        }

        if (itemToken.type === 'STRING') {
          for (let i = 0; i < itemToken.value.length; i++) {
            bytes.push(itemToken.value.charCodeAt(i));
          }
        } else {
          const val = this.resolveValue(itemToken);
          if (val === null) {
            if (this.pass === 2) {
              this.addError(lineNum, itemToken.column, `Undefined value: ${itemToken.value}`);
            }
            bytes.push(0);
          } else {
            if (defType === 'DB') {
              bytes.push(val & 0xFF);
            } else {
              // DW: little endian
              bytes.push(val & 0xFF);
              bytes.push((val >> 8) & 0xFF);
            }
          }
        }
        dIdx++;
      }

      this.currentOffset += bytes.length;
      return emit ? bytes : null;
    }

    // Direct DB or DW without label prefix
    if (mnemonic === 'DB' || mnemonic === 'DW') {
      const defType = mnemonic;
      const bytes: number[] = [];
      let dIdx = idx + 1;
      while (dIdx < tokens.length) {
        const itemToken = tokens[dIdx];
        if (itemToken.type === 'COMMA') {
          dIdx++;
          continue;
        }
        if (itemToken.type === 'STRING') {
          for (let i = 0; i < itemToken.value.length; i++) {
            bytes.push(itemToken.value.charCodeAt(i));
          }
        } else {
          const val = this.resolveValue(itemToken);
          if (val === null) {
            if (this.pass === 2) {
              this.addError(lineNum, itemToken.column, `Undefined value: ${itemToken.value}`);
            }
            bytes.push(0);
          } else {
            if (defType === 'DB') {
              bytes.push(val & 0xFF);
            } else {
              bytes.push(val & 0xFF);
              bytes.push((val >> 8) & 0xFF);
            }
          }
        }
        dIdx++;
      }
      this.currentOffset += bytes.length;
      return emit ? bytes : null;
    }

    // Instructions
    const remainingTokens = tokens.slice(idx + 1);
    const operands = this.parseOperands(remainingTokens, lineNum);

    const encoded = this.encodeInstruction(mnemonic, operands, lineNum, firstToken.column);
    if (encoded) {
      this.currentOffset += encoded.length;
      return emit ? encoded : null;
    }

    return null;
  }

  private resolveValue(token: Token): number | null {
    if (token.value === '?') return 0; // Uninitialized 8086 variable
    if (token.numValue !== undefined) return token.numValue;
    if (token.type === 'NUMBER') {
      return Lexer.parseNumericString(token.value);
    }
    if (token.type === 'STRING' && token.value.length === 1) {
      return token.value.charCodeAt(0);
    }
    if (token.type === 'IDENTIFIER') {
      const sym = this.symbols[token.value.toUpperCase()];
      if (sym !== undefined) return sym.value;
    }
    return null;
  }

  private parseOperands(tokens: Token[], lineNum: number): ParsedOperand[] {
    const operands: ParsedOperand[] = [];
    if (tokens.length === 0) return operands;

    const operandGroups: Token[][] = [];
    let curGroup: Token[] = [];

    for (const t of tokens) {
      if (t.type === 'COMMA') {
        operandGroups.push(curGroup);
        curGroup = [];
      } else {
        curGroup.push(t);
      }
    }
    if (curGroup.length > 0) {
      operandGroups.push(curGroup);
    }

    for (const grp of operandGroups) {
      if (grp.length === 0) continue;
      const op = this.parseSingleOperand(grp, lineNum);
      if (op) operands.push(op);
    }

    return operands;
  }

  private parseSingleOperand(tokens: Token[], lineNum: number): ParsedOperand | null {
    if (tokens.length === 0) return null;

    let sizeHint: 'BYTE' | 'WORD' | undefined;
    let startIdx = 0;

    // Check size prefix: BYTE PTR / WORD PTR
    if (
      tokens.length >= 2 &&
      (tokens[0].value.toUpperCase() === 'BYTE' || tokens[0].value.toUpperCase() === 'WORD') &&
      tokens[1].value.toUpperCase() === 'PTR'
    ) {
      sizeHint = tokens[0].value.toUpperCase() as 'BYTE' | 'WORD';
      startIdx = 2;
    }

    if (startIdx >= tokens.length) return null;

    // Check OFFSET label
    if (
      tokens.length >= startIdx + 2 &&
      tokens[startIdx].value.toUpperCase() === 'OFFSET' &&
      tokens[startIdx + 1].type === 'IDENTIFIER'
    ) {
      const name = tokens[startIdx + 1].value.toUpperCase();
      const val = this.symbols[name]?.value;
      if (val !== undefined) {
        return { type: 'immediate', imm: val, size: 'WORD' };
      }
      return { type: 'identifier', ident: name, size: 'WORD' };
    }

    // Single register operand or identifier
    if (tokens.length === startIdx + 1 && tokens[startIdx].type === 'IDENTIFIER') {
      const text = tokens[startIdx].value.toUpperCase();
      if (text in REG16) {
        return { type: 'register', reg: text as RegisterName16, size: 'WORD' };
      }
      if (text in REG8) {
        return { type: 'register', reg: text as RegisterName8, size: 'BYTE' };
      }
      if (text in SREG) {
        return { type: 'segment', sreg: text as 'CS' | 'DS' | 'SS' | 'ES', size: 'WORD' };
      }

      // Check if identifier is in symbols table (MASM variable reference rule)
      const sym = this.symbols[text];
      if (sym) {
        if (sym.type === 'byte' || sym.type === 'word') {
          return {
            type: 'memory',
            size: sym.type === 'byte' ? 'BYTE' : 'WORD',
            mem: {
              isDirect: true,
              directAddress: sym.value,
              displacement: sym.value,
              sizeHint: sym.type === 'byte' ? 'BYTE' : 'WORD'
            }
          };
        }
        if (sym.type === 'constant') {
          return {
            type: 'immediate',
            imm: sym.value,
            size: 'WORD'
          };
        }
      }

      return { type: 'identifier', ident: text, size: sizeHint };
    }

    // Immediate number or single char
    if (tokens.length === startIdx + 1) {
      if (
        tokens[startIdx].type === 'NUMBER' ||
        (tokens[startIdx].type === 'STRING' && tokens[startIdx].value.length === 1)
      ) {
        const val = this.resolveValue(tokens[startIdx]);
        if (val !== null) {
          return { type: 'immediate', imm: val, size: sizeHint || (val > 255 || val < -128 ? 'WORD' : 'BYTE') };
        }
      }
    }

    // Memory operand: [ ... ] or segment:[ ... ]
    let segmentOverride: 'CS' | 'DS' | 'SS' | 'ES' | undefined;
    let bracketStart = -1;
    let bracketEnd = -1;

    for (let i = startIdx; i < tokens.length; i++) {
      if (tokens[i].type === 'COLON' && i > startIdx) {
        const segCandidate = tokens[i - 1].value.toUpperCase();
        if (segCandidate in SREG) {
          segmentOverride = segCandidate as 'CS' | 'DS' | 'SS' | 'ES';
        }
      }
      if (tokens[i].type === 'LBRACKET') bracketStart = i;
      if (tokens[i].type === 'RBRACKET') bracketEnd = i;
    }

    if (bracketStart !== -1 && bracketEnd !== -1 && bracketEnd > bracketStart) {
      const innerTokens = tokens.slice(bracketStart + 1, bracketEnd);
      const memOp = this.parseMemoryExpression(innerTokens, lineNum);
      memOp.segmentOverride = segmentOverride;
      memOp.sizeHint = sizeHint;
      return { type: 'memory', mem: memOp, size: sizeHint };
    }

    return null;
  }

  private parseMemoryExpression(tokens: Token[], lineNum: number): ParsedMemoryOperand {
    let baseReg: 'BX' | 'BP' | undefined;
    let indexReg: 'SI' | 'DI' | undefined;
    let displacement = 0;
    let isDirect = false;
    let directAddress: number | undefined;

    let sign = 1;
    for (const t of tokens) {
      if (t.type === 'PLUS') {
        sign = 1;
        continue;
      }
      if (t.type === 'MINUS') {
        sign = -1;
        continue;
      }

      if (t.type === 'IDENTIFIER') {
        const upper = t.value.toUpperCase();
        if (upper === 'BX' || upper === 'BP') {
          baseReg = upper;
        } else if (upper === 'SI' || upper === 'DI') {
          indexReg = upper;
        } else {
          // Label or variable inside bracket e.g. [my_var] or [array + SI]
          const symVal = this.symbols[upper]?.value;
          if (symVal !== undefined) {
            displacement += sign * symVal;
          } else {
            displacement += sign * 0; // unresolved in pass 1
          }
        }
      } else {
        const num = this.resolveValue(t);
        if (num !== null) {
          displacement += sign * num;
        }
      }
    }

    if (!baseReg && !indexReg) {
      isDirect = true;
      directAddress = displacement & 0xFFFF;
    }

    return {
      baseReg,
      indexReg,
      displacement,
      isDirect,
      directAddress
    };
  }

  private buildModRM(regField: number, mem: ParsedMemoryOperand): { modrm: number; dispBytes: number[] } {
    let mod = 0;
    let rm = 0;
    const dispBytes: number[] = [];

    if (mem.isDirect) {
      // Direct addressing: Mod=00, R/M=110, followed by 16-bit address
      mod = 0;
      rm = 6;
      const addr = (mem.directAddress ?? mem.displacement) & 0xFFFF;
      dispBytes.push(addr & 0xFF, (addr >> 8) & 0xFF);
      return { modrm: (mod << 6) | ((regField & 7) << 3) | rm, dispBytes };
    }

    // Determine R/M
    if (mem.baseReg === 'BX' && mem.indexReg === 'SI') rm = 0;
    else if (mem.baseReg === 'BX' && mem.indexReg === 'DI') rm = 1;
    else if (mem.baseReg === 'BP' && mem.indexReg === 'SI') rm = 2;
    else if (mem.baseReg === 'BP' && mem.indexReg === 'DI') rm = 3;
    else if (mem.indexReg === 'SI') rm = 4;
    else if (mem.indexReg === 'DI') rm = 5;
    else if (mem.baseReg === 'BP') rm = 6;
    else if (mem.baseReg === 'BX') rm = 7;

    const disp = mem.displacement;
    if (disp === 0 && mem.baseReg !== 'BP') {
      mod = 0;
    } else if (disp >= -128 && disp <= 127) {
      mod = 1;
      dispBytes.push(disp & 0xFF);
    } else {
      mod = 2;
      dispBytes.push(disp & 0xFF, (disp >> 8) & 0xFF);
    }

    return { modrm: (mod << 6) | ((regField & 7) << 3) | rm, dispBytes };
  }

  private encodeInstruction(
    mnemonic: string,
    operands: ParsedOperand[],
    line: number,
    col: number
  ): number[] | null {
    // 1-byte instructions without operands
    switch (mnemonic) {
      case 'NOP': return [0x90];
      case 'HLT': return [0xF4];
      case 'CLC': return [0xF8];
      case 'STC': return [0xF9];
      case 'CMC': return [0xF5];
      case 'CLD': return [0xFC];
      case 'STD': return [0xFD];
      case 'CLI': return [0xFA];
      case 'STI': return [0xFB];
      case 'IRET': return [0xCF];
      case 'RET':
        if (operands.length === 0) return [0xC3];
        if (operands.length === 1 && operands[0].imm !== undefined) {
          const val = operands[0].imm;
          return [0xC2, val & 0xFF, (val >> 8) & 0xFF];
        }
        break;
      case 'INT':
        if (operands.length === 1) {
          let intNum = operands[0].imm;
          if (intNum === undefined && operands[0].ident) {
            intNum = this.symbols[operands[0].ident]?.value;
          }
          if (intNum !== undefined) {
            if (intNum === 3) return [0xCC];
            return [0xCD, intNum & 0xFF];
          }
        }
        break;
      case 'IN':
        if (operands.length === 2 && operands[0].reg) {
          const isWord = operands[0].reg === 'AX';
          if (operands[1].imm !== undefined) {
            return [isWord ? 0xE5 : 0xE4, operands[1].imm & 0xFF];
          }
          if (operands[1].reg === 'DX') {
            return [isWord ? 0xED : 0xEC];
          }
        }
        break;
      case 'OUT':
        if (operands.length === 2 && operands[1].reg) {
          const isWord = operands[1].reg === 'AX';
          if (operands[0].imm !== undefined) {
            return [isWord ? 0xE7 : 0xE6, operands[0].imm & 0xFF];
          }
          if (operands[0].reg === 'DX') {
            return [isWord ? 0xEF : 0xEE];
          }
        }
        break;
      case 'LEA':
        if (operands.length === 2 && operands[0].reg) {
          let memOp = operands[1].mem;
          if (!memOp) {
            let addr = operands[1].imm;
            if (addr === undefined && operands[1].ident) {
              const sym = this.symbols[operands[1].ident.toUpperCase()];
              addr = sym?.value ?? this.currentOffset;
            }
            if (addr !== undefined) {
              memOp = {
                displacement: addr,
                isDirect: true,
                directAddress: addr
              };
            }
          }
          if (memOp) {
            const regCode = REG16[operands[0].reg];
            const { modrm, dispBytes } = this.buildModRM(regCode, memOp);
            return [0x8D, modrm, ...dispBytes];
          }
        }
        break;
      case 'PUSH':
        if (operands.length === 1) {
          if (operands[0].reg && operands[0].reg in REG16) {
            return [0x50 + REG16[operands[0].reg as RegisterName16]];
          }
          if (operands[0].sreg) {
            const map: Record<string, number> = { ES: 0x06, CS: 0x0E, SS: 0x16, DS: 0x1E };
            return [map[operands[0].sreg]];
          }
        }
        break;
      case 'POP':
        if (operands.length === 1) {
          if (operands[0].reg && operands[0].reg in REG16) {
            return [0x58 + REG16[operands[0].reg as RegisterName16]];
          }
          if (operands[0].sreg && operands[0].sreg !== 'CS') {
            const map: Record<string, number> = { ES: 0x07, SS: 0x17, DS: 0x1F };
            return [map[operands[0].sreg]];
          }
        }
        break;
      case 'INC':
      case 'DEC':
        if (operands.length === 1) {
          const isInc = mnemonic === 'INC';
          const subcode = isInc ? 0 : 1;
          const target = operands[0];

          // Resolve identifier if it refers to a variable
          if (target.type === 'identifier' && target.ident) {
            const sym = this.symbols[target.ident];
            if (sym && (sym.type === 'byte' || sym.type === 'word')) {
              target.type = 'memory';
              target.size = sym.type === 'byte' ? 'BYTE' : 'WORD';
              target.mem = { isDirect: true, directAddress: sym.value, displacement: sym.value };
            }
          }

          if (target.reg) {
            if (target.reg in REG16) {
              return [(isInc ? 0x40 : 0x48) + REG16[target.reg as RegisterName16]];
            }
            if (target.reg in REG8) {
              const rCode = REG8[target.reg as RegisterName8];
              return [0xFE, 0xC0 | (subcode << 3) | rCode];
            }
          }

          if (target.mem) {
            const isWord = target.size === 'WORD' || target.mem.sizeHint === 'WORD';
            const { modrm, dispBytes } = this.buildModRM(subcode, target.mem);
            const prefix = target.mem.segmentOverride ? this.getSegmentPrefix(target.mem.segmentOverride) : [];
            return [...prefix, isWord ? 0xFF : 0xFE, modrm, ...dispBytes];
          }
        }
        break;
      case 'MOV':
        return this.encodeMov(operands, line, col);
      case 'ADD':
      case 'OR':
      case 'ADC':
      case 'SBB':
      case 'AND':
      case 'SUB':
      case 'XOR':
      case 'CMP':
        return this.encodeAlu(mnemonic, operands, line, col);
      case 'NOT':
      case 'NEG':
      case 'MUL':
      case 'IMUL':
      case 'DIV':
      case 'IDIV':
        return this.encodeUnary(mnemonic, operands, line, col);
      case 'SHL':
      case 'SAL':
      case 'SHR':
      case 'SAR':
      case 'ROL':
      case 'ROR':
        return this.encodeShift(mnemonic, operands, line, col);
      case 'JMP':
      case 'JE':
      case 'JZ':
      case 'JNE':
      case 'JNZ':
      case 'JG':
      case 'JGE':
      case 'JL':
      case 'JLE':
      case 'JA':
      case 'JAE':
      case 'JB':
      case 'JBE':
      case 'JC':
      case 'JNC':
      case 'JS':
      case 'JNS':
      case 'LOOP':
      case 'JCXZ':
      case 'CALL':
        return this.encodeBranch(mnemonic, operands, line, col);
    }

    this.addError(line, col, `Unsupported or invalid instruction: '${mnemonic}'`);
    return null;
  }

  private encodeMov(ops: ParsedOperand[], line: number, col: number): number[] | null {
    if (ops.length !== 2) {
      this.addError(line, col, 'MOV requires 2 operands (destination, source)');
      return null;
    }

    const [dest, src] = ops;

    // Resolve identifiers for dest and src
    for (const op of [dest, src]) {
      if (op.type === 'identifier' && op.ident) {
        const sym = this.symbols[op.ident];
        if (sym) {
          if (sym.type === 'byte' || sym.type === 'word') {
            op.type = 'memory';
            op.size = sym.type === 'byte' ? 'BYTE' : 'WORD';
            op.mem = {
              isDirect: true,
              directAddress: sym.value,
              displacement: sym.value,
              sizeHint: op.size
            };
          } else if (sym.type === 'constant') {
            op.type = 'immediate';
            op.imm = sym.value;
          }
        }
      }
    }

    // MOV reg, imm
    if (dest.type === 'register' && dest.reg && src.type === 'immediate' && src.imm !== undefined) {
      if (dest.reg in REG8) {
        return [0xB0 + REG8[dest.reg as RegisterName8], src.imm & 0xFF];
      }
      if (dest.reg in REG16) {
        return [0xB8 + REG16[dest.reg as RegisterName16], src.imm & 0xFF, (src.imm >> 8) & 0xFF];
      }
    }

    // MOV reg, reg
    if (dest.type === 'register' && dest.reg && src.type === 'register' && src.reg) {
      const isWord = dest.reg in REG16;
      const dCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const sCode = isWord ? REG16[src.reg as RegisterName16] : REG8[src.reg as RegisterName8];
      const modrm = 0xC0 | (sCode << 3) | dCode;
      return [isWord ? 0x89 : 0x88, modrm];
    }

    // MOV reg, mem
    if (dest.type === 'register' && dest.reg && src.type === 'memory' && src.mem) {
      const isWord = dest.reg in REG16;
      const regCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const { modrm, dispBytes } = this.buildModRM(regCode, src.mem);
      const prefix = src.mem.segmentOverride ? this.getSegmentPrefix(src.mem.segmentOverride) : [];
      return [...prefix, isWord ? 0x8B : 0x8A, modrm, ...dispBytes];
    }

    // MOV mem, reg
    if (dest.type === 'memory' && dest.mem && src.type === 'register' && src.reg) {
      const isWord = src.reg in REG16;
      const regCode = isWord ? REG16[src.reg as RegisterName16] : REG8[src.reg as RegisterName8];
      const { modrm, dispBytes } = this.buildModRM(regCode, dest.mem);
      const prefix = dest.mem.segmentOverride ? this.getSegmentPrefix(dest.mem.segmentOverride) : [];
      return [...prefix, isWord ? 0x89 : 0x88, modrm, ...dispBytes];
    }

    // MOV sreg, reg
    if (dest.type === 'segment' && dest.sreg && src.type === 'register' && src.reg && src.reg in REG16) {
      const sCode = SREG[dest.sreg];
      const rCode = REG16[src.reg as RegisterName16];
      const modrm = 0xC0 | (sCode << 3) | rCode;
      return [0x8E, modrm];
    }

    // MOV reg, sreg
    if (dest.type === 'register' && dest.reg && dest.reg in REG16 && src.type === 'segment' && src.sreg) {
      const sCode = SREG[src.sreg];
      const rCode = REG16[dest.reg as RegisterName16];
      const modrm = 0xC0 | (sCode << 3) | rCode;
      return [0x8C, modrm];
    }

    // MOV mem, imm
    if (dest.type === 'memory' && dest.mem && src.type === 'immediate' && src.imm !== undefined) {
      const isWord = dest.size === 'WORD' || dest.mem.sizeHint === 'WORD';
      const { modrm, dispBytes } = this.buildModRM(0, dest.mem);
      const prefix = dest.mem.segmentOverride ? this.getSegmentPrefix(dest.mem.segmentOverride) : [];
      if (isWord) {
        return [...prefix, 0xC7, modrm, ...dispBytes, src.imm & 0xFF, (src.imm >> 8) & 0xFF];
      } else {
        return [...prefix, 0xC6, modrm, ...dispBytes, src.imm & 0xFF];
      }
    }

    this.addError(line, col, 'Invalid operand combination for MOV instruction');
    return null;
  }

  private encodeAlu(op: string, ops: ParsedOperand[], line: number, col: number): number[] | null {
    const aluCodes: Record<string, number> = {
      ADD: 0, OR: 1, ADC: 2, SBB: 3, AND: 4, SUB: 5, XOR: 6, CMP: 7
    };
    const code = aluCodes[op];

    if (ops.length !== 2) {
      this.addError(line, col, `${op} requires 2 operands`);
      return null;
    }

    const [dest, src] = ops;

    // Resolve identifiers for dest and src
    for (const opItem of [dest, src]) {
      if (opItem.type === 'identifier' && opItem.ident) {
        const sym = this.symbols[opItem.ident];
        if (sym) {
          if (sym.type === 'byte' || sym.type === 'word') {
            opItem.type = 'memory';
            opItem.size = sym.type === 'byte' ? 'BYTE' : 'WORD';
            opItem.mem = {
              isDirect: true,
              directAddress: sym.value,
              displacement: sym.value,
              sizeHint: opItem.size
            };
          } else if (sym.type === 'constant') {
            opItem.type = 'immediate';
            opItem.imm = sym.value;
          }
        }
      }
    }

    // ALU reg, reg
    if (dest.type === 'register' && dest.reg && src.type === 'register' && src.reg) {
      const isWord = dest.reg in REG16;
      const dCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const sCode = isWord ? REG16[src.reg as RegisterName16] : REG8[src.reg as RegisterName8];
      const modrm = 0xC0 | (sCode << 3) | dCode;
      const baseOp = (code << 3) | (isWord ? 0x01 : 0x00);
      return [baseOp, modrm];
    }

    // ALU reg, imm
    if (dest.type === 'register' && dest.reg && src.type === 'immediate' && src.imm !== undefined) {
      const isWord = dest.reg in REG16;
      // Short accumulator form: ADD AL, imm (04h) or ADD AX, imm (05h)
      if (dest.reg === 'AL') {
        return [(code << 3) | 0x04, src.imm & 0xFF];
      }
      if (dest.reg === 'AX') {
        return [(code << 3) | 0x05, src.imm & 0xFF, (src.imm >> 8) & 0xFF];
      }

      const rCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const modrm = 0xC0 | (code << 3) | rCode;
      if (isWord) {
        return [0x81, modrm, src.imm & 0xFF, (src.imm >> 8) & 0xFF];
      } else {
        return [0x80, modrm, src.imm & 0xFF];
      }
    }

    // ALU reg, mem
    if (dest.type === 'register' && dest.reg && src.type === 'memory' && src.mem) {
      const isWord = dest.reg in REG16;
      const rCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const { modrm, dispBytes } = this.buildModRM(rCode, src.mem);
      const prefix = src.mem.segmentOverride ? this.getSegmentPrefix(src.mem.segmentOverride) : [];
      const opcode = (code << 3) | (isWord ? 0x03 : 0x02);
      return [...prefix, opcode, modrm, ...dispBytes];
    }

    // ALU mem, reg
    if (dest.type === 'memory' && dest.mem && src.type === 'register' && src.reg) {
      const isWord = src.reg in REG16;
      const rCode = isWord ? REG16[src.reg as RegisterName16] : REG8[src.reg as RegisterName8];
      const { modrm, dispBytes } = this.buildModRM(rCode, dest.mem);
      const prefix = dest.mem.segmentOverride ? this.getSegmentPrefix(dest.mem.segmentOverride) : [];
      const opcode = (code << 3) | (isWord ? 0x01 : 0x00);
      return [...prefix, opcode, modrm, ...dispBytes];
    }

    this.addError(line, col, `Invalid operands for ${op}`);
    return null;
  }

  private encodeUnary(op: string, ops: ParsedOperand[], line: number, col: number): number[] | null {
    if (ops.length !== 1) {
      this.addError(line, col, `${op} requires 1 operand`);
      return null;
    }
    const unarySub: Record<string, number> = {
      NOT: 2, NEG: 3, MUL: 4, IMUL: 5, DIV: 6, IDIV: 7
    };
    const subcode = unarySub[op];
    const target = ops[0];

    // Resolve identifier if variable
    if (target.type === 'identifier' && target.ident) {
      const sym = this.symbols[target.ident];
      if (sym && (sym.type === 'byte' || sym.type === 'word')) {
        target.type = 'memory';
        target.size = sym.type === 'byte' ? 'BYTE' : 'WORD';
        target.mem = { isDirect: true, directAddress: sym.value, displacement: sym.value };
      }
    }

    if (target.type === 'register' && target.reg) {
      const isWord = target.reg in REG16;
      const rCode = isWord ? REG16[target.reg as RegisterName16] : REG8[target.reg as RegisterName8];
      const modrm = 0xC0 | (subcode << 3) | rCode;
      return [isWord ? 0xF7 : 0xF6, modrm];
    }

    if (target.type === 'memory' && target.mem) {
      const isWord = target.size === 'WORD' || target.mem.sizeHint === 'WORD';
      const { modrm, dispBytes } = this.buildModRM(subcode, target.mem);
      const prefix = target.mem.segmentOverride ? this.getSegmentPrefix(target.mem.segmentOverride) : [];
      return [...prefix, isWord ? 0xF7 : 0xF6, modrm, ...dispBytes];
    }

    this.addError(line, col, `Invalid operand for ${op}`);
    return null;
  }

  private encodeShift(op: string, ops: ParsedOperand[], line: number, col: number): number[] | null {
    if (ops.length !== 2) {
      this.addError(line, col, `${op} requires 2 operands (target, 1 or CL)`);
      return null;
    }
    const shiftCodes: Record<string, number> = {
      ROL: 0, ROR: 1, SHL: 4, SAL: 4, SHR: 5, SAR: 7
    };
    const subcode = shiftCodes[op];
    const [dest, amount] = ops;

    if (dest.type === 'register' && dest.reg) {
      const isWord = dest.reg in REG16;
      const rCode = isWord ? REG16[dest.reg as RegisterName16] : REG8[dest.reg as RegisterName8];
      const isCL = amount.type === 'register' && amount.reg === 'CL';
      const isOne = amount.type === 'immediate' && amount.imm === 1;

      if (!isCL && !isOne) {
        this.addError(line, col, '8086 shift count must be 1 or CL');
        return null;
      }

      const modrm = 0xC0 | (subcode << 3) | rCode;
      const baseOp = isCL ? (isWord ? 0xD3 : 0xD2) : (isWord ? 0xD1 : 0xD0);
      return [baseOp, modrm];
    }

    this.addError(line, col, `Invalid operands for ${op}`);
    return null;
  }

  private encodeBranch(op: string, ops: ParsedOperand[], line: number, col: number): number[] | null {
    if (ops.length !== 1) {
      this.addError(line, col, `${op} requires 1 label target`);
      return null;
    }

    const targetOp = ops[0];
    let targetAddress = targetOp.imm;

    if (targetAddress === undefined && targetOp.ident) {
      const sym = this.symbols[targetOp.ident.toUpperCase()];
      if (sym !== undefined) {
        targetAddress = sym.value;
      } else if (this.pass === 2) {
        this.addError(line, col, `Unresolved label: '${targetOp.ident}'`);
        return null;
      } else {
        targetAddress = this.currentOffset; // placeholder for pass 1
      }
    }

    if (targetAddress === undefined) {
      this.addError(line, col, 'Invalid branch destination');
      return null;
    }

    const condMap: Record<string, number> = {
      JO: 0x70, JNO: 0x71, JB: 0x72, JC: 0x72, JAE: 0x73, JNC: 0x73,
      JE: 0x74, JZ: 0x74, JNE: 0x75, JNZ: 0x75, JBE: 0x76, JA: 0x77,
      JS: 0x78, JNS: 0x79, JL: 0x7C, JGE: 0x7D, JLE: 0x7E, JG: 0x7F,
      LOOP: 0xE2, JCXZ: 0xE3
    };

    if (op in condMap) {
      const nextIP = this.currentOffset + 2;
      const rel = targetAddress - nextIP;
      if (this.pass === 2 && (rel < -128 || rel > 127)) {
        this.addError(line, col, `Relative jump out of range (${rel} bytes)`);
      }
      return [condMap[op], rel & 0xFF];
    }

    if (op === 'JMP') {
      // Near jump E9 cd
      const nextIP = this.currentOffset + 3;
      const rel = targetAddress - nextIP;
      return [0xE9, rel & 0xFF, (rel >> 8) & 0xFF];
    }

    if (op === 'CALL') {
      const nextIP = this.currentOffset + 3;
      const rel = targetAddress - nextIP;
      return [0xE8, rel & 0xFF, (rel >> 8) & 0xFF];
    }

    return null;
  }

  private getSegmentPrefix(sreg: 'CS' | 'DS' | 'SS' | 'ES'): number[] {
    const map: Record<string, number> = { ES: 0x26, CS: 0x2E, SS: 0x36, DS: 0x3E };
    return [map[sreg]];
  }
}
