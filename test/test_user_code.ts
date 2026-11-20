import { Assembler } from '../src/core/assembler/assembler';
import { CPU } from '../src/core/cpu/cpu';
import { InterruptManager } from '../src/core/hardware/interrupts';

const src = `
data segment
a db 0F1h
b db 0A1h
sum db ?   
carry db 00h
data ends
 
code segment
assume cs:code,ds:data     ;Informs the assembler about the correct segments
start:
mov ax,data                     ;Puts segment address of Data into AX
mov ds,ax                       ; Transfers segment address of Data from AX to DS
mov al,a 
add al,b
jnc skip
inc carry
skip: mov sum,al
mov ah,4ch
int 21h
code ends
end start
`;

const assembler = new Assembler();
const r = assembler.assemble(src);

console.log('Success:', r.success);
if (!r.success) {
  console.log('Errors:', JSON.stringify(r.errors, null, 2));
  process.exit(1);
}

console.log('Chunks:', r.chunks?.map(c => ({
  segment: '0x' + c.segment.toString(16),
  offset: '0x' + c.offset.toString(16),
  length: c.data.length,
  bytes: Array.from(c.data).map(b => b.toString(16).padStart(2, '0')).join(' ')
})));

console.log('Symbols:', r.symbols);

const cpu = new CPU();
const interrupts = new InterruptManager();
cpu.onInterrupt = (intNum, c) => interrupts.handleInterrupt(intNum, c);

cpu.loadProgram(r);

console.log('Initial CPU state: CS=' + cpu.CS.toString(16) + ' IP=' + cpu.IP.toString(16) + ' DS=' + cpu.DS.toString(16));

let steps = 0;
while (!cpu.isHalted && steps < 50) {
  const ipBefore = cpu.IP;
  const op = cpu.readByte(cpu.CS, ipBefore);
  const ok = cpu.step();
  steps++;
  console.log(`Step ${steps}: IP was 0x${ipBefore.toString(16)} (op 0x${op.toString(16)}), AX=0x${cpu.AX.toString(16).padStart(4, '0')}, DS=0x${cpu.DS.toString(16).padStart(4, '0')}, CF=${cpu.flags.CF ? 1 : 0}`);
}

console.log('Final CPU halted:', cpu.isHalted);
console.log('Final AL: 0x' + cpu.AL.toString(16) + ' (' + cpu.AL + ')');

// Check memory at variables:
// DS is expected to be 0x0700
const ds = cpu.DS;
const aVal = cpu.readByte(ds, r.symbols['A']?.value ?? 0);
const bVal = cpu.readByte(ds, r.symbols['B']?.value ?? 1);
const sumVal = cpu.readByte(ds, r.symbols['SUM']?.value ?? 2);
const carryVal = cpu.readByte(ds, r.symbols['CARRY']?.value ?? 3);

console.log('Memory inspection:');
console.log(`a (offset 0x${(r.symbols['A']?.value ?? 0).toString(16)}): 0x${aVal.toString(16)} (${aVal})`);
console.log(`b (offset 0x${(r.symbols['B']?.value ?? 1).toString(16)}): 0x${bVal.toString(16)} (${bVal})`);
console.log(`sum (offset 0x${(r.symbols['SUM']?.value ?? 2).toString(16)}): 0x${sumVal.toString(16)} (${sumVal})`);
console.log(`carry (offset 0x${(r.symbols['CARRY']?.value ?? 3).toString(16)}): 0x${carryVal.toString(16)} (${carryVal})`);

if (sumVal === 0x92 && carryVal === 1) {
  console.log('TEST PASSED! Output is 92h and carry is 01h!');
} else {
  console.error('TEST FAILED!');
  process.exit(1);
}
