export interface InstructionDoc {
  name: string;
  syntax: string[];
  summary: string;
  description: string;
  operands: string;
  flags: string;
  example: string;
  category: 'Data Transfer' | 'Arithmetic' | 'Logical' | 'Control Transfer' | 'String' | 'Processor Control' | 'I/O';
}

export const INSTRUCTION_DOCS: Record<string, InstructionDoc> = {
  MOV: {
    name: 'MOV',
    syntax: ['MOV destination, source'],
    summary: 'Move / copy data from source to destination operand',
    description: 'Copies the second operand (source) into the first operand (destination). Cannot move memory to memory, or immediate to segment register directly.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm | sreg, reg | reg, sreg',
    flags: 'None (flags are not modified)',
    example: 'MOV AX, 4C00h\nMOV [0100h], BX\nMOV DS, AX',
    category: 'Data Transfer'
  },
  PUSH: {
    name: 'PUSH',
    syntax: ['PUSH operand'],
    summary: 'Push word onto stack',
    description: 'Decrements SP by 2 and puts the 16-bit operand onto the stack at SS:SP.',
    operands: 'reg16 | sreg | mem16',
    flags: 'None',
    example: 'PUSH AX\nPUSH DS',
    category: 'Data Transfer'
  },
  POP: {
    name: 'POP',
    syntax: ['POP destination'],
    summary: 'Pop word from stack',
    description: 'Pops the 16-bit word at SS:SP into destination and increments SP by 2. (Cannot pop CS).',
    operands: 'reg16 | sreg (except CS) | mem16',
    flags: 'None',
    example: 'POP BX\nPOP ES',
    category: 'Data Transfer'
  },
  XCHG: {
    name: 'XCHG',
    syntax: ['XCHG destination, source'],
    summary: 'Exchange contents of two operands',
    description: 'Exchanges the byte or word contents of two registers or a register and a memory location.',
    operands: 'reg, reg | reg, mem | mem, reg',
    flags: 'None',
    example: 'XCHG AX, BX\nXCHG AL, [SI]',
    category: 'Data Transfer'
  },
  LEA: {
    name: 'LEA',
    syntax: ['LEA reg16, memory'],
    summary: 'Load Effective Address',
    description: 'Calculates the offset address of the memory operand and stores it into the destination 16-bit register.',
    operands: 'reg16, mem',
    flags: 'None',
    example: 'LEA DX, msg\nLEA BX, [SI+4]',
    category: 'Data Transfer'
  },
  IN: {
    name: 'IN',
    syntax: ['IN AL, port8', 'IN AX, port8', 'IN AL, DX', 'IN AX, DX'],
    summary: 'Input byte or word from I/O port',
    description: 'Reads data from the specified port into AL (8-bit) or AX (16-bit). If port > 255, DX must hold the port number.',
    operands: 'AL/AX, port8 | AL/AX, DX',
    flags: 'None',
    example: 'IN AL, 4   ; Read traffic lights port\nIN AX, DX',
    category: 'I/O'
  },
  OUT: {
    name: 'OUT',
    syntax: ['OUT port8, AL', 'OUT port8, AX', 'OUT DX, AL', 'OUT DX, AX'],
    summary: 'Output byte or word to I/O port',
    description: 'Transfers byte from AL or word from AX to the specified I/O port.',
    operands: 'port8, AL/AX | DX, AL/AX',
    flags: 'None',
    example: 'OUT 4, AL   ; Control traffic lights\nOUT 7, AL   ; Drive stepper motor',
    category: 'I/O'
  },
  ADD: {
    name: 'ADD',
    syntax: ['ADD destination, source'],
    summary: 'Add operands',
    description: 'Adds the source operand to the destination operand and stores the result in destination.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'ADD AX, BX\nADD AL, 5\nADD [SI], DX',
    category: 'Arithmetic'
  },
  ADC: {
    name: 'ADC',
    syntax: ['ADC destination, source'],
    summary: 'Add with carry',
    description: 'Adds destination + source + Carry Flag and stores the result in destination. Used for multi-word addition.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'ADC DX, 0   ; Propagate carry',
    category: 'Arithmetic'
  },
  SUB: {
    name: 'SUB',
    syntax: ['SUB destination, source'],
    summary: 'Subtract operands',
    description: 'Subtracts the source operand from the destination operand (destination - source) and stores the result.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'SUB AX, 10\nSUB BX, CX',
    category: 'Arithmetic'
  },
  SBB: {
    name: 'SBB',
    syntax: ['SBB destination, source'],
    summary: 'Subtract with borrow',
    description: 'Subtracts (source + Carry Flag) from destination. Used for multi-word subtraction.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'SBB DX, 0',
    category: 'Arithmetic'
  },
  INC: {
    name: 'INC',
    syntax: ['INC destination'],
    summary: 'Increment operand by 1',
    description: 'Adds 1 to destination. Note: Does NOT modify the Carry Flag (CF).',
    operands: 'reg | mem',
    flags: 'OF, SF, ZF, AF, PF (CF is untouched)',
    example: 'INC SI\nINC BX\nINC BYTE PTR [DI]',
    category: 'Arithmetic'
  },
  DEC: {
    name: 'DEC',
    syntax: ['DEC destination'],
    summary: 'Decrement operand by 1',
    description: 'Subtracts 1 from destination. Note: Does NOT modify the Carry Flag (CF).',
    operands: 'reg | mem',
    flags: 'OF, SF, ZF, AF, PF (CF is untouched)',
    example: 'DEC CX\nDEC BYTE PTR [BX]',
    category: 'Arithmetic'
  },
  CMP: {
    name: 'CMP',
    syntax: ['CMP operand1, operand2'],
    summary: 'Compare operands',
    description: 'Performs (operand1 - operand2) and updates processor flags, without modifying either operand.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'CMP AX, 0\nJE is_zero\nCMP CX, 10',
    category: 'Arithmetic'
  },
  MUL: {
    name: 'MUL',
    syntax: ['MUL operand'],
    summary: 'Unsigned multiply',
    description: 'Multiplies AL by byte operand (result in AX), or AX by word operand (result in DX:AX).',
    operands: 'reg | mem',
    flags: 'CF and OF set if high half is non-zero; SF, ZF, AF, PF undefined',
    example: 'MUL BL    ; AX = AL * BL\nMUL BX    ; DX:AX = AX * BX',
    category: 'Arithmetic'
  },
  IMUL: {
    name: 'IMUL',
    syntax: ['IMUL operand'],
    summary: 'Signed multiply',
    description: 'Performs signed multiplication of AL or AX with operand.',
    operands: 'reg | mem',
    flags: 'CF and OF set if result exceeds lower half; SF, ZF, AF, PF undefined',
    example: 'IMUL CL\nIMUL BX',
    category: 'Arithmetic'
  },
  DIV: {
    name: 'DIV',
    syntax: ['DIV operand'],
    summary: 'Unsigned divide',
    description: 'Divides AX by 8-bit operand (AL = quotient, AH = remainder), or DX:AX by 16-bit operand (AX = quotient, DX = remainder).',
    operands: 'reg | mem',
    flags: 'Flags undefined. Generates INT 0 (divide error) if quotient overflows or division by zero.',
    example: 'DIV BL    ; AL = AX/BL, AH = AX%BL\nDIV BX    ; AX = DX:AX/BX, DX = DX:AX%BX',
    category: 'Arithmetic'
  },
  IDIV: {
    name: 'IDIV',
    syntax: ['IDIV operand'],
    summary: 'Signed divide',
    description: 'Signed division of AX (by byte) or DX:AX (by word).',
    operands: 'reg | mem',
    flags: 'Flags undefined. Generates INT 0 on overflow or zero divisor.',
    example: 'IDIV BL\nIDIV BX',
    category: 'Arithmetic'
  },
  NEG: {
    name: 'NEG',
    syntax: ['NEG operand'],
    summary: 'Two\'s complement negate',
    description: 'Replaces operand with its two\'s complement (0 - operand). CF=0 if operand is 0, else CF=1.',
    operands: 'reg | mem',
    flags: 'OF, SF, ZF, AF, PF, CF',
    example: 'NEG AX\nNEG BL',
    category: 'Arithmetic'
  },
  AND: {
    name: 'AND',
    syntax: ['AND destination, source'],
    summary: 'Bitwise Logical AND',
    description: 'Performs bitwise AND of destination and source, storing result in destination. Clears CF and OF.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF=0, CF=0, SF, ZF, PF updated. AF undefined.',
    example: 'AND AL, 0Fh\nAND AX, BX',
    category: 'Logical'
  },
  OR: {
    name: 'OR',
    syntax: ['OR destination, source'],
    summary: 'Bitwise Logical OR',
    description: 'Performs bitwise OR of destination and source, storing result in destination. Clears CF and OF.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF=0, CF=0, SF, ZF, PF updated. AF undefined.',
    example: 'OR AL, 80h\nOR DX, AX',
    category: 'Logical'
  },
  XOR: {
    name: 'XOR',
    syntax: ['XOR destination, source'],
    summary: 'Bitwise Logical Exclusive OR',
    description: 'Performs bitwise XOR. Commonly used to quickly zero out a register (e.g. `XOR AX, AX`). Clears CF and OF.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF=0, CF=0, SF, ZF, PF updated. AF undefined.',
    example: 'XOR AX, AX  ; Clear AX to 0\nXOR BL, 0FFh ; Bitwise invert',
    category: 'Logical'
  },
  NOT: {
    name: 'NOT',
    syntax: ['NOT operand'],
    summary: 'Bitwise One\'s Complement Invert',
    description: 'Inverts every bit in the destination operand (0 becomes 1, 1 becomes 0). Flags are unaffected.',
    operands: 'reg | mem',
    flags: 'None (no flags modified)',
    example: 'NOT AX\nNOT BYTE PTR [SI]',
    category: 'Logical'
  },
  TEST: {
    name: 'TEST',
    syntax: ['TEST operand1, operand2'],
    summary: 'Logical compare (AND without modifying)',
    description: 'Performs bitwise AND of operands and sets flags (ZF, SF, PF) without modifying either operand. Clears CF and OF.',
    operands: 'reg, reg | reg, mem | mem, reg | reg, imm | mem, imm',
    flags: 'OF=0, CF=0, SF, ZF, PF updated. AF undefined.',
    example: 'TEST AL, 1   ; Check if lowest bit is set\nJNZ is_odd',
    category: 'Logical'
  },
  SHL: {
    name: 'SHL',
    syntax: ['SHL operand, 1', 'SHL operand, CL'],
    summary: 'Shift logical left',
    description: 'Shifts bits left by 1 or CL positions, filling vacant lower bits with 0. Highest shifted-out bit enters CF.',
    operands: 'reg, 1 | mem, 1 | reg, CL | mem, CL',
    flags: 'CF, OF, SF, ZF, PF updated. AF undefined.',
    example: 'SHL AX, 1\nSHL BX, CL',
    category: 'Logical'
  },
  SHR: {
    name: 'SHR',
    syntax: ['SHR operand, 1', 'SHR operand, CL'],
    summary: 'Shift logical right',
    description: 'Shifts bits right by 1 or CL positions, filling vacant upper bits with 0. Lowest shifted-out bit enters CF.',
    operands: 'reg, 1 | mem, 1 | reg, CL | mem, CL',
    flags: 'CF, OF, SF, ZF, PF updated. AF undefined.',
    example: 'SHR AL, 1\nSHR DX, CL',
    category: 'Logical'
  },
  SAR: {
    name: 'SAR',
    syntax: ['SAR operand, 1', 'SAR operand, CL'],
    summary: 'Shift arithmetic right (sign-preserving)',
    description: 'Shifts bits right while keeping the original sign bit (bit 7 or bit 15) copied into top bits. Useful for signed division by 2.',
    operands: 'reg, 1 | mem, 1 | reg, CL | mem, CL',
    flags: 'CF, OF, SF, ZF, PF updated. AF undefined.',
    example: 'SAR AX, 1\nSAR BL, CL',
    category: 'Logical'
  },
  ROL: {
    name: 'ROL',
    syntax: ['ROL operand, 1', 'ROL operand, CL'],
    summary: 'Rotate left',
    description: 'Rotates bits to the left. The bit shifted out from the high bit wraps around to the lowest bit and also enters CF.',
    operands: 'reg, 1 | mem, 1 | reg, CL | mem, CL',
    flags: 'CF updated. OF updated for 1-bit shift.',
    example: 'ROL AL, 1\nROL AX, CL',
    category: 'Logical'
  },
  ROR: {
    name: 'ROR',
    syntax: ['ROR operand, 1', 'ROR operand, CL'],
    summary: 'Rotate right',
    description: 'Rotates bits to the right. The bit shifted out of the lowest bit wraps around to the highest bit and enters CF.',
    operands: 'reg, 1 | mem, 1 | reg, CL | mem, CL',
    flags: 'CF updated. OF updated for 1-bit shift.',
    example: 'ROR AL, 1\nROR BX, CL',
    category: 'Logical'
  },
  JMP: {
    name: 'JMP',
    syntax: ['JMP target'],
    summary: 'Unconditional jump',
    description: 'Unconditionally transfers program control to the target label or address.',
    operands: 'label | reg16 | [mem16]',
    flags: 'None',
    example: 'JMP main_loop\nJMP BX',
    category: 'Control Transfer'
  },
  JE: {
    name: 'JE',
    syntax: ['JE target'],
    summary: 'Jump if equal (ZF = 1)',
    description: 'Jumps to target label if Zero Flag (ZF) is 1 (operands of previous CMP or test were equal). Synonym: JZ.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AX, BX\nJE are_equal',
    category: 'Control Transfer'
  },
  JZ: {
    name: 'JZ',
    syntax: ['JZ target'],
    summary: 'Jump if zero (ZF = 1)',
    description: 'Jumps to target label if Zero Flag (ZF) is 1. Equivalent to JE.',
    operands: 'label',
    flags: 'None',
    example: 'DEC CX\nJZ done',
    category: 'Control Transfer'
  },
  JNE: {
    name: 'JNE',
    syntax: ['JNE target'],
    summary: 'Jump if not equal (ZF = 0)',
    description: 'Jumps to target label if Zero Flag is 0 (operands not equal). Synonym: JNZ.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AL, \'$\'\nJNE print_char',
    category: 'Control Transfer'
  },
  JNZ: {
    name: 'JNZ',
    syntax: ['JNZ target'],
    summary: 'Jump if not zero (ZF = 0)',
    description: 'Jumps to target label if Zero Flag is 0. Equivalent to JNE.',
    operands: 'label',
    flags: 'None',
    example: 'SUB BL, 1\nJNZ repeat',
    category: 'Control Transfer'
  },
  JG: {
    name: 'JG',
    syntax: ['JG target'],
    summary: 'Jump if greater (signed)',
    description: 'Jumps if ZF=0 and SF=OF (signed comparison: operand1 > operand2). Synonym: JNLE.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AX, 100\nJG is_greater',
    category: 'Control Transfer'
  },
  JGE: {
    name: 'JGE',
    syntax: ['JGE target'],
    summary: 'Jump if greater or equal (signed)',
    description: 'Jumps if SF=OF (signed comparison: operand1 >= operand2). Synonym: JNL.',
    operands: 'label',
    flags: 'None',
    example: 'CMP SI, DI\nJGE skip',
    category: 'Control Transfer'
  },
  JL: {
    name: 'JL',
    syntax: ['JL target'],
    summary: 'Jump if less (signed)',
    description: 'Jumps if SF != OF (signed comparison: operand1 < operand2). Synonym: JNGE.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AX, BX\nJL smaller',
    category: 'Control Transfer'
  },
  JLE: {
    name: 'JLE',
    syntax: ['JLE target'],
    summary: 'Jump if less or equal (signed)',
    description: 'Jumps if ZF=1 or SF != OF (signed comparison: operand1 <= operand2). Synonym: JNG.',
    operands: 'label',
    flags: 'None',
    example: 'CMP CX, 0\nJLE non_positive',
    category: 'Control Transfer'
  },
  JA: {
    name: 'JA',
    syntax: ['JA target'],
    summary: 'Jump if above (unsigned)',
    description: 'Jumps if CF=0 and ZF=0 (unsigned comparison: operand1 > operand2). Synonym: JNBE.',
    operands: 'label',
    flags: 'None',
    example: 'CMP DX, 50h\nJA above',
    category: 'Control Transfer'
  },
  JAE: {
    name: 'JAE',
    syntax: ['JAE target'],
    summary: 'Jump if above or equal (unsigned)',
    description: 'Jumps if CF=0 (unsigned comparison: operand1 >= operand2). Synonym: JNC, JNB.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AL, 10\nJAE keep_going',
    category: 'Control Transfer'
  },
  JB: {
    name: 'JB',
    syntax: ['JB target'],
    summary: 'Jump if below (unsigned)',
    description: 'Jumps if CF=1 (unsigned comparison: operand1 < operand2). Synonym: JC, JNAE.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AL, 5\nJB underflow',
    category: 'Control Transfer'
  },
  JBE: {
    name: 'JBE',
    syntax: ['JBE target'],
    summary: 'Jump if below or equal (unsigned)',
    description: 'Jumps if CF=1 or ZF=1 (unsigned comparison: operand1 <= operand2). Synonym: JNA.',
    operands: 'label',
    flags: 'None',
    example: 'CMP AL, 20h\nJBE is_control_char',
    category: 'Control Transfer'
  },
  JC: {
    name: 'JC',
    syntax: ['JC target'],
    summary: 'Jump if carry (CF = 1)',
    description: 'Jumps to target label if Carry Flag is set (CF = 1).',
    operands: 'label',
    flags: 'None',
    example: 'ADD AL, BL\nJC overflow_carry',
    category: 'Control Transfer'
  },
  JNC: {
    name: 'JNC',
    syntax: ['JNC target'],
    summary: 'Jump if not carry (CF = 0)',
    description: 'Jumps to target label if Carry Flag is clear (CF = 0).',
    operands: 'label',
    flags: 'None',
    example: 'SUB AL, BL\nJNC no_borrow',
    category: 'Control Transfer'
  },
  JS: {
    name: 'JS',
    syntax: ['JS target'],
    summary: 'Jump if sign / negative (SF = 1)',
    description: 'Jumps if Sign Flag is set (result was negative).',
    operands: 'label',
    flags: 'None',
    example: 'DEC AX\nJS is_negative',
    category: 'Control Transfer'
  },
  JNS: {
    name: 'JNS',
    syntax: ['JNS target'],
    summary: 'Jump if not sign / positive (SF = 0)',
    description: 'Jumps if Sign Flag is clear (result was zero or positive).',
    operands: 'label',
    flags: 'None',
    example: 'DEC AX\nJNS continue',
    category: 'Control Transfer'
  },
  LOOP: {
    name: 'LOOP',
    syntax: ['LOOP target'],
    summary: 'Loop while CX != 0',
    description: 'Decrements CX by 1. If CX != 0, jumps to target label. Does NOT modify flags.',
    operands: 'label',
    flags: 'None (CX is decremented)',
    example: 'MOV CX, 10\nloop_start:\n  ; do work\nLOOP loop_start',
    category: 'Control Transfer'
  },
  JCXZ: {
    name: 'JCXZ',
    syntax: ['JCXZ target'],
    summary: 'Jump if CX is zero',
    description: 'Jumps to target if CX == 0. Useful before entering a loop to avoid executing 65536 iterations when CX=0.',
    operands: 'label',
    flags: 'None',
    example: 'JCXZ skip_loop\nstart:\n  LOOP start\nskip_loop:',
    category: 'Control Transfer'
  },
  CALL: {
    name: 'CALL',
    syntax: ['CALL procedure'],
    summary: 'Call procedure / subroutine',
    description: 'Pushes the return IP address onto the stack and jumps to the target procedure address.',
    operands: 'label | reg16 | [mem16]',
    flags: 'None',
    example: 'CALL print_string\nCALL BX',
    category: 'Control Transfer'
  },
  RET: {
    name: 'RET',
    syntax: ['RET', 'RET imm16'],
    summary: 'Return from procedure',
    description: 'Pops the return IP address from the stack. Optional immediate operand adds bytes to SP (cleans parameters).',
    operands: 'None | imm16',
    flags: 'None',
    example: 'RET\nRET 4',
    category: 'Control Transfer'
  },
  INT: {
    name: 'INT',
    syntax: ['INT interrupt_number'],
    summary: 'Software Interrupt',
    description: 'Pushes FLAGS, CS, and IP onto the stack, clears TF and IF, and executes interrupt handler vector.',
    operands: 'imm8 (e.g. 21h, 10h, 16h)',
    flags: 'Clears TF and IF',
    example: 'INT 21h  ; Call DOS service\nINT 10h  ; Call BIOS Video',
    category: 'Control Transfer'
  },
  IRET: {
    name: 'IRET',
    syntax: ['IRET'],
    summary: 'Interrupt Return',
    description: 'Returns from an interrupt handler by popping IP, CS, and FLAGS from the stack.',
    operands: 'None',
    flags: 'Restores all flags from stack',
    example: 'IRET',
    category: 'Control Transfer'
  },
  CLC: {
    name: 'CLC',
    syntax: ['CLC'],
    summary: 'Clear Carry Flag',
    description: 'Sets Carry Flag (CF) = 0.',
    operands: 'None',
    flags: 'CF = 0',
    example: 'CLC',
    category: 'Processor Control'
  },
  STC: {
    name: 'STC',
    syntax: ['STC'],
    summary: 'Set Carry Flag',
    description: 'Sets Carry Flag (CF) = 1.',
    operands: 'None',
    flags: 'CF = 1',
    example: 'STC',
    category: 'Processor Control'
  },
  CMC: {
    name: 'CMC',
    syntax: ['CMC'],
    summary: 'Complement Carry Flag',
    description: 'Inverts Carry Flag (CF = not CF).',
    operands: 'None',
    flags: 'CF toggled',
    example: 'CMC',
    category: 'Processor Control'
  },
  CLD: {
    name: 'CLD',
    syntax: ['CLD'],
    summary: 'Clear Direction Flag',
    description: 'Sets Direction Flag (DF) = 0 (string operations increment SI and DI forward).',
    operands: 'None',
    flags: 'DF = 0',
    example: 'CLD',
    category: 'Processor Control'
  },
  STD: {
    name: 'STD',
    syntax: ['STD'],
    summary: 'Set Direction Flag',
    description: 'Sets Direction Flag (DF) = 1 (string operations decrement SI and DI backward).',
    operands: 'None',
    flags: 'DF = 1',
    example: 'STD',
    category: 'Processor Control'
  },
  CLI: {
    name: 'CLI',
    syntax: ['CLI'],
    summary: 'Clear Interrupt Flag',
    description: 'Sets Interrupt Enable Flag (IF) = 0 (disables maskable hardware interrupts).',
    operands: 'None',
    flags: 'IF = 0',
    example: 'CLI',
    category: 'Processor Control'
  },
  STI: {
    name: 'STI',
    syntax: ['STI'],
    summary: 'Set Interrupt Flag',
    description: 'Sets Interrupt Enable Flag (IF) = 1 (enables maskable hardware interrupts).',
    operands: 'None',
    flags: 'IF = 1',
    example: 'STI',
    category: 'Processor Control'
  },
  NOP: {
    name: 'NOP',
    syntax: ['NOP'],
    summary: 'No Operation',
    description: 'Performs no operation; takes 1 byte (opcode 90h, equivalent to XCHG AX, AX).',
    operands: 'None',
    flags: 'None',
    example: 'NOP',
    category: 'Processor Control'
  },
  HLT: {
    name: 'HLT',
    syntax: ['HLT'],
    summary: 'Halt Processor',
    description: 'Halts CPU execution until an interrupt occurs or processor is reset.',
    operands: 'None',
    flags: 'None',
    example: 'HLT',
    category: 'Processor Control'
  }
};

export interface DirectiveDoc {
  name: string;
  syntax: string;
  summary: string;
  description: string;
  example: string;
}

export const DIRECTIVE_DOCS: Record<string, DirectiveDoc> = {
  'ORG': {
    name: 'ORG',
    syntax: 'ORG offset',
    summary: 'Set origin location counter',
    description: 'Sets the address offset for subsequent code and data. For MS-DOS .COM programs, `ORG 100h` is standard.',
    example: 'ORG 100h'
  },
  'DB': {
    name: 'DB',
    syntax: 'name DB value [, value, ...]',
    summary: 'Define Byte (8-bit)',
    description: 'Allocates and initializes one or more bytes of memory. Supports numbers, characters, and string literals.',
    example: 'msg DB \'Hello, World!\', 0Dh, 0Ah, \'$\'\nnums DB 1, 2, 3, 4, 5'
  },
  'DW': {
    name: 'DW',
    syntax: 'name DW value [, value, ...]',
    summary: 'Define Word (16-bit)',
    description: 'Allocates and initializes one or more 16-bit words (stored in low-byte high-byte Little Endian order).',
    example: 'val DW 1234h\narray DW 10, 20, 30, 40'
  },
  'EQU': {
    name: 'EQU',
    syntax: 'name EQU value',
    summary: 'Define symbolic constant',
    description: 'Defines a symbolic name for a numeric constant or expression. Does not allocate memory.',
    example: 'BUFFER_SIZE EQU 256\nPORT_TRAFFIC EQU 4'
  },
  'END': {
    name: 'END',
    syntax: 'END [label]',
    summary: 'End of assembly source',
    description: 'Marks the end of source code. Optional label specifies the program entry point.',
    example: 'END start'
  },
  '.CODE': {
    name: '.CODE',
    syntax: '.CODE',
    summary: 'Begin code segment',
    description: 'Simplified segment directive indicating the start of the executable code segment.',
    example: '.CODE\nstart:\n  MOV AX, 1'
  },
  '.DATA': {
    name: '.DATA',
    syntax: '.DATA',
    summary: 'Begin data segment',
    description: 'Simplified segment directive indicating the start of the static data segment.',
    example: '.DATA\nmessage DB \'Test$\''
  },
  'PROC': {
    name: 'PROC',
    syntax: 'name PROC [NEAR/FAR]',
    summary: 'Begin procedure definition',
    description: 'Marks the start of a procedure subroutine.',
    example: 'print_char PROC\n  MOV AH, 02h\n  INT 21h\n  RET\nprint_char ENDP'
  },
  'ENDP': {
    name: 'ENDP',
    syntax: 'name ENDP',
    summary: 'End procedure definition',
    description: 'Marks the end of a procedure subroutine.',
    example: 'my_proc ENDP'
  }
};

export interface InterruptDoc {
  interrupt: string;
  ah: string;
  name: string;
  inputs: string;
  outputs: string;
  description: string;
  example: string;
}

export const INTERRUPT_DOCS: InterruptDoc[] = [
  {
    interrupt: '21h',
    ah: '01h',
    name: 'Read Character from Keyboard with Echo',
    inputs: 'AH = 01h',
    outputs: 'AL = ASCII character read',
    description: 'Waits for a keypress from the console, echoes it to screen, and returns ASCII code in AL.',
    example: 'MOV AH, 01h\nINT 21h\n; AL now contains the character pressed'
  },
  {
    interrupt: '21h',
    ah: '02h',
    name: 'Write Character to Screen',
    inputs: 'AH = 02h, DL = Character ASCII code',
    outputs: 'None',
    description: 'Displays the single character in DL on the active screen at the current cursor position.',
    example: 'MOV AH, 02h\nMOV DL, \'A\'\nINT 21h'
  },
  {
    interrupt: '21h',
    ah: '07h',
    name: 'Direct Console Input Without Echo',
    inputs: 'AH = 07h',
    outputs: 'AL = Character read',
    description: 'Waits for a keypress from the console without echoing to the screen.',
    example: 'MOV AH, 07h\nINT 21h'
  },
  {
    interrupt: '21h',
    ah: '09h',
    name: 'Print String Terminated by \'$\'',
    inputs: 'AH = 09h, DX = Offset of string in DS',
    outputs: 'None',
    description: 'Prints characters from DS:DX to the screen until a \'$\' delimiter (ASCII 24h) is encountered.',
    example: 'MOV AH, 09h\nLEA DX, message\nINT 21h'
  },
  {
    interrupt: '21h',
    ah: '0Ah',
    name: 'Buffered Keyboard Input',
    inputs: 'AH = 0Ah, DX = Offset of input buffer',
    outputs: 'Buffer populated (1st byte: max len, 2nd: actual read chars, then data)',
    description: 'Reads a line of text into a buffer until ENTER is pressed.',
    example: 'LEA DX, buffer\nMOV AH, 0Ah\nINT 21h'
  },
  {
    interrupt: '21h',
    ah: '4Ch',
    name: 'Terminate Process (Exit to DOS)',
    inputs: 'AH = 4Ch, AL = Return exit code',
    outputs: 'Does not return',
    description: 'Terminates the program and returns control to the operating system with return code AL.',
    example: 'MOV AX, 4C00h\nINT 21h'
  },
  {
    interrupt: '10h',
    ah: '00h',
    name: 'Set Video Mode',
    inputs: 'AH = 00h, AL = Video mode (e.g. 03h = 80x25 text, 13h = 320x200 256-color)',
    outputs: 'None',
    description: 'Initializes the display hardware into the requested video display mode.',
    example: 'MOV AH, 00h\nMOV AL, 13h  ; 320x200 graphics\nINT 10h'
  },
  {
    interrupt: '10h',
    ah: '02h',
    name: 'Set Cursor Position',
    inputs: 'AH = 02h, BH = Page (0), DH = Row (0-24), DL = Column (0-79)',
    outputs: 'None',
    description: 'Sets the text cursor to specified row (DH) and column (DL).',
    example: 'MOV AH, 02h\nMOV BH, 0\nMOV DH, 10 ; Row 10\nMOV DL, 20 ; Col 20\nINT 10h'
  },
  {
    interrupt: '10h',
    ah: '0Eh',
    name: 'Teletype Character Output',
    inputs: 'AH = 0Eh, AL = Character, BH = Page (0), BL = Color (in graphics mode)',
    outputs: 'None',
    description: 'Writes a character to the screen and automatically advances the cursor, handling CR, LF, BS, and scrolling.',
    example: 'MOV AH, 0Eh\nMOV AL, \'X\'\nINT 10h'
  },
  {
    interrupt: '10h',
    ah: '0Ch',
    name: 'Write Graphics Pixel',
    inputs: 'AH = 0Ch, AL = Color (0-255), CX = X column, DX = Y row',
    outputs: 'None',
    description: 'Draws a single pixel in graphics mode (such as mode 13h) at coordinate (CX, DX).',
    example: 'MOV AH, 0Ch\nMOV AL, 4   ; Red\nMOV CX, 160 ; Center X\nMOV DX, 100 ; Center Y\nINT 10h'
  },
  {
    interrupt: '16h',
    ah: '00h',
    name: 'Wait for Keystroke and Read',
    inputs: 'AH = 00h',
    outputs: 'AL = ASCII char, AH = Scan code',
    description: 'Waits until a key is pressed, extracts it from BIOS keyboard buffer, and returns scan code and ASCII.',
    example: 'MOV AH, 00h\nINT 16h'
  },
  {
    interrupt: '16h',
    ah: '01h',
    name: 'Check Keystroke Buffer',
    inputs: 'AH = 01h',
    outputs: 'ZF = 1 if no key ready, ZF = 0 if key is waiting (AL=ASCII, AH=scan code)',
    description: 'Checks if a key is waiting in keyboard buffer without removing it.',
    example: 'MOV AH, 01h\nINT 16h\nJZ no_key_pressed'
  }
];

export const REGISTER_DOCS: Record<string, { size: string; role: string; desc: string }> = {
  AX: { size: '16-bit', role: 'Accumulator', desc: 'Main register for arithmetic, I/O (IN/OUT), and system interrupts (INT 21h function codes in AH).' },
  AH: { size: '8-bit', role: 'High Accumulator', desc: 'Upper 8 bits of AX. Holds function number for DOS (INT 21h) and BIOS (INT 10h) calls.' },
  AL: { size: '8-bit', role: 'Low Accumulator', desc: 'Lower 8 bits of AX. Standard 8-bit arithmetic, I/O byte transfers, and return values.' },
  BX: { size: '16-bit', role: 'Base Register', desc: 'Base register used for memory addressing pointer: `[BX]`, `[BX+SI]`, etc.' },
  BH: { size: '8-bit', role: 'High Base', desc: 'Upper 8 bits of BX. Often holds display page in BIOS INT 10h.' },
  BL: { size: '8-bit', role: 'Low Base', desc: 'Lower 8 bits of BX. Often holds foreground/attribute color.' },
  CX: { size: '16-bit', role: 'Count Register', desc: 'Counter register for `LOOP`, string repeat prefixes (`REP`), and shift amounts (`CL`).' },
  CH: { size: '8-bit', role: 'High Count', desc: 'Upper 8 bits of CX.' },
  CL: { size: '8-bit', role: 'Low Count', desc: 'Lower 8 bits of CX. Used as dynamic shift count in `SHL reg, CL`.' },
  DX: { size: '16-bit', role: 'Data Register', desc: 'Multiplication high word result, division remainder, and I/O port address for `IN/OUT`.' },
  DH: { size: '8-bit', role: 'High Data', desc: 'Upper 8 bits of DX. Row index for cursor positioning (`INT 10h / AH=02h`).' },
  DL: { size: '8-bit', role: 'Low Data', desc: 'Lower 8 bits of DX. Column index or character code for output (`INT 21h / AH=02h`).' },
  SI: { size: '16-bit', role: 'Source Index', desc: 'Pointer register used in array indexing `[BX+SI]` and string source operations `[DS:SI]`.' },
  DI: { size: '16-bit', role: 'Destination Index', desc: 'Pointer register used in indexing and string destination operations `[ES:DI]`.' },
  BP: { size: '16-bit', role: 'Base Pointer', desc: 'Stack frame pointer used to access local variables and function parameters in stack `[BP+4]`.' },
  SP: { size: '16-bit', role: 'Stack Pointer', desc: 'Points to current top of stack in Stack Segment (SS:SP). Modified by PUSH, POP, CALL, RET.' },
  IP: { size: '16-bit', role: 'Instruction Pointer', desc: 'Points to the offset of the next instruction to fetch in Code Segment (CS:IP).' },
  CS: { size: '16-bit', role: 'Code Segment', desc: 'Base segment for currently executing machine instructions.' },
  DS: { size: '16-bit', role: 'Data Segment', desc: 'Default base segment for program data and variables.' },
  SS: { size: '16-bit', role: 'Stack Segment', desc: 'Base segment for the execution call stack.' },
  ES: { size: '16-bit', role: 'Extra Segment', desc: 'Supplemental data segment, especially destination for string instructions (e.g. MOVSB).' }
};
