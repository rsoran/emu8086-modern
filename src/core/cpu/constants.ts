export const MEMORY_SIZE = 1024 * 1024; // 1MB Real Mode address space

export const REG16: Record<string, number> = {
  AX: 0,
  CX: 1,
  DX: 2,
  BX: 3,
  SP: 4,
  BP: 5,
  SI: 6,
  DI: 7
};

export const REG8: Record<string, number> = {
  AL: 0,
  CL: 1,
  DL: 2,
  BL: 3,
  AH: 4,
  CH: 5,
  DH: 6,
  BH: 7
};

export const SREG: Record<string, number> = {
  ES: 0,
  CS: 1,
  SS: 2,
  DS: 3
};

export const FLAG_MASKS = {
  CF: 1 << 0,  // Bit 0: Carry
  PF: 1 << 2,  // Bit 2: Parity
  AF: 1 << 4,  // Bit 4: Auxiliary Carry
  ZF: 1 << 6,  // Bit 6: Zero
  SF: 1 << 7,  // Bit 7: Sign
  TF: 1 << 8,  // Bit 8: Trap
  IF: 1 << 9,  // Bit 9: Interrupt Enable
  DF: 1 << 10, // Bit 10: Direction
  OF: 1 << 11  // Bit 11: Overflow
} as const;

// Default Segment and Offset for COM programs in Emu8086
export const DEFAULT_SEGMENT = 0x0700;
export const DEFAULT_COM_OFFSET = 0x0100;
export const DEFAULT_STACK_POINTER = 0xFFFE;
