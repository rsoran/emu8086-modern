import { Assembler } from '../src/core/assembler/assembler.ts';
import { CPU } from '../src/core/cpu/cpu.ts';
import { InterruptManager } from '../src/core/hardware/interrupts.ts';
import { PeripheralManager } from '../src/core/hardware/peripherals.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

console.log('--- Testing Assembler & Emulator Core ---');

// Test 1: Simple Hello World assembly & execution
console.log('\n[Test 1] Assembling Hello World:');
const asm1 = `
ORG 100h
start:
    LEA DX, msg
    MOV AH, 09h
    INT 21h
    MOV AX, 4C00h
    INT 21h
msg DB 'Hello, Modern 8086!$'
`;

const assembler = new Assembler();
const res1 = assembler.assemble(asm1);

if (!res1.success) {
  console.error('Assembly errors:', JSON.stringify(res1.errors, null, 2));
}

assert(res1.success, 'Assembles without errors');
assert(res1.binary.length > 0, 'Generates machine binary');
assert(res1.symbols['MSG'] !== undefined, 'Symbol MSG is registered');
assert(res1.symbols['START'] !== undefined, 'Label START is registered');

// Test 2: CPU Execution
console.log('\n[Test 2] CPU Execution:');
const cpu = new CPU();
const interrupts = new InterruptManager();
cpu.onInterrupt = (intNum, c) => interrupts.handleInterrupt(intNum, c);

cpu.loadBinary(res1.binary, res1.loadAddress, res1.entryPoint);

let steps = 0;
while (!cpu.isHalted && steps < 100) {
  cpu.step();
  steps++;
}

assert(cpu.isHalted, 'Program terminates at INT 21h / AH=4Ch');
assert(interrupts.outputText.includes('Hello, Modern 8086!'), 'Console output matched string');

// Test 3: Arithmetic & Flags
console.log('\n[Test 3] Arithmetic & Flags:');
const asm2 = `
ORG 100h
MOV AX, 5
ADD AX, 10
SUB AX, 15
`;
const res2 = assembler.assemble(asm2);
assert(res2.success, 'Arithmetic assembly succeeded');

cpu.loadBinary(res2.binary, res2.loadAddress, res2.entryPoint);
cpu.step(); // MOV AX, 5
assert(cpu.AX === 5, 'AX is 5');
cpu.step(); // ADD AX, 10
assert(cpu.AX === 15, 'AX is 15');
assert(!cpu.flags.ZF, 'ZF is false');
cpu.step(); // SUB AX, 15
assert(cpu.AX === 0, 'AX is 0');
assert(cpu.flags.ZF === true, 'ZF is true when result is zero');

// Test 4: Peripheral Port 4 Traffic Lights
console.log('\n[Test 4] Peripheral I/O:');
const peripherals = new PeripheralManager();
cpu.onPortWrite = (port, val, isWord) => peripherals.handlePortWrite(port, val, isWord);

const asm3 = `
ORG 100h
MOV AX, 0224h
OUT 4, AX
MOV AL, 0001b
OUT 7, AL
`;
const res3 = assembler.assemble(asm3);
assert(res3.success, 'Peripheral code assembled');

cpu.loadBinary(res3.binary, res3.loadAddress, res3.entryPoint);
cpu.step(); // MOV AX, 0224h
cpu.step(); // OUT 4, AX
assert(peripherals.trafficLights.north.green === true, 'North traffic light is green');
assert(peripherals.trafficLights.south.green === true, 'South traffic light is green');

cpu.step(); // MOV AL, 0001b
cpu.step(); // OUT 7, AL
assert(peripherals.stepperMotor.lastPortValue === 1, 'Stepper motor received phase 0001b');

// Test 5: Step Back (Undo Instruction Step)
console.log('\n[Test 5] Step Back Undo:');
assert(cpu.canStepBack(), 'CPU has history to step back');
cpu.stepBack(); // Undoes OUT 7, AL
cpu.stepBack(); // Undoes MOV AL, 0001b
assert(cpu.canStepBack(), 'CPU still has history');
cpu.stepBack(); // Undoes OUT 4, AX
cpu.stepBack(); // Undoes MOV AX, 0224h
assert(cpu.AX === 0, 'AX reverted back to 0 via Step Back');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
