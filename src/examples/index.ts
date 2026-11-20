export interface ExampleProgram {
  id: string;
  title: string;
  description: string;
  category: 'Basics' | 'Peripherals' | 'Graphics & BIOS' | 'Algorithms';
  code: string;
}

export const EXAMPLES: ExampleProgram[] = [
  {
    id: 'add_with_carry',
    title: '8-Bit Addition with Carry (0F1h + 0A1h = 92h)',
    category: 'Basics',
    description: 'Segmented MASM-style program adding two 8-bit hex numbers (0F1h + 0A1h) with Carry detection and variable storage (sum=92h, carry=01h).',
    code: `data segment
a db 0F1h
b db 0A1h
sum db ?   
carry db 00h
data ends
 
code segment
assume cs:code,ds:data     ;Informs the assembler about the correct segments
start:
mov ax,data                ;Puts segment address of Data into AX
mov ds,ax                  ;Transfers segment address of Data from AX to DS
mov al,a 
add al,b                   ;0F1h + 0A1h = 192h -> AL=92h, CF=1
jnc skip
inc carry                  ;Carry flag is set -> carry = 01h
skip: mov sum,al           ;sum = 92h
mov ah,4ch
int 21h
code ends
end start
`
  },
  {
    id: 'hello_world',
    title: 'Hello, World!',
    category: 'Basics',
    description: 'Classic MS-DOS .COM program that outputs a string using DOS INT 21h / AH=09h.',
    code: `; ============================================
; Program: Hello, World!
; Description: Prints a string terminated by '$'
; ============================================

ORG 100h

start:
    ; Set DX to point to our message
    LEA DX, message
    
    ; INT 21h / AH = 09h : Print '$' terminated string
    MOV AH, 09h
    INT 21h

    ; INT 21h / AH = 4Ch : Clean exit to DOS
    MOV AX, 4C00h
    INT 21h

; Data definition
message DB 'Hello, World from Modern Emu8086!', 0Dh, 0Ah, '$'
`
  },
  {
    id: 'traffic_lights',
    title: 'Traffic Lights Simulator',
    category: 'Peripherals',
    description: 'Drives the Virtual Traffic Lights peripheral via port 4.',
    code: `; ============================================
; Program: Traffic Lights Controller
; Description: Cycles traffic lights at 4-way intersection
; Port 4 control:
;   North: Bit 0=Red, Bit 1=Yellow, Bit 2=Green
;   South: Bit 3=Red, Bit 4=Yellow, Bit 5=Green
;   East:  Bit 6=Red, Bit 7=Yellow, Bit 8=Green
;   West:  Bit 9=Red, Bit 10=Yellow, Bit 11=Green
; ============================================

ORG 100h

main_loop:
    ; Phase 1: North/South Green, East/West Red
    ; North G (bit 2) + South G (bit 5) + East R (bit 6) + West R (bit 9)
    ; Binary: 0010 0100 0010 0100b = 2424h
    MOV AX, 0224h
    OUT 4, AX
    CALL delay

    ; Phase 2: North/South Yellow, East/West Red
    ; North Y (bit 1) + South Y (bit 4) + East R (bit 6) + West R (bit 9)
    MOV AX, 0212h
    OUT 4, AX
    CALL delay

    ; Phase 3: North/South Red, East/West Green
    ; North R (bit 0) + South R (bit 3) + East G (bit 8) + West G (bit 11)
    MOV AX, 0909h
    OUT 4, AX
    CALL delay

    ; Phase 4: North/South Red, East/West Yellow
    ; North R (bit 0) + South R (bit 3) + East Y (bit 7) + West Y (bit 10)
    MOV AX, 0489h
    OUT 4, AX
    CALL delay

    JMP main_loop

; Delay subroutine
delay:
    MOV CX, 0005h
delay_loop:
    DEC CX
    JNZ delay_loop
    RET
`
  },
  {
    id: 'stepper_motor',
    title: 'Stepper Motor Driver',
    category: 'Peripherals',
    description: 'Drives a 4-phase stepper motor clockwise through full-step phase patterns via port 7.',
    code: `; ============================================
; Program: Stepper Motor Driver
; Description: Rotates motor clockwise and counter-clockwise
; Port 7: Phase outputs (0001b, 0010b, 0100b, 1000b)
; ============================================

ORG 100h

start:
    MOV CX, 4 ; 4 full rotation cycles

rotate_cw:
    ; Phase 1
    MOV AL, 0001b
    OUT 7, AL
    CALL delay

    ; Phase 2
    MOV AL, 0010b
    OUT 7, AL
    CALL delay

    ; Phase 3
    MOV AL, 0100b
    OUT 7, AL
    CALL delay

    ; Phase 4
    MOV AL, 1000b
    OUT 7, AL
    CALL delay

    LOOP rotate_cw

    ; Exit program
    MOV AX, 4C00h
    INT 21h

delay:
    MOV DX, 2
delay_inner:
    DEC DX
    JNZ delay_inner
    RET
`
  },
  {
    id: 'seven_segment',
    title: '7-Segment LED Counter',
    category: 'Peripherals',
    description: 'Counts from 0 to 9 on the 7-segment digital LED display via port 10.',
    code: `; ============================================
; Program: 7-Segment Display Counter
; Description: Displays digits 0-9 sequentially on Port 10
; Digits segment masks:
;   0 = 3Fh, 1 = 06h, 2 = 5Bh, 3 = 4Fh, 4 = 66h,
;   5 = 6Dh, 6 = 7Dh, 7 = 07h, 8 = 7Fh, 9 = 6Fh
; ============================================

ORG 100h

start:
    LEA SI, digits_table
    MOV CX, 10

count_loop:
    MOV AL, [SI]
    OUT 10, AL
    INC SI
    CALL delay
    LOOP count_loop

    ; Exit
    MOV AX, 4C00h
    INT 21h

delay:
    MOV DX, 5
d_loop:
    DEC DX
    JNZ d_loop
    RET

digits_table DB 3Fh, 06h, 5Bh, 4Fh, 66h, 6Dh, 7Dh, 07h, 7Fh, 6Fh
`
  },
  {
    id: 'calculator_arithmetic',
    title: 'Arithmetic & Flags Exploration',
    category: 'Basics',
    description: 'Demonstrates 16-bit and 8-bit math, carries, zero flag detection, and register moves.',
    code: `; ============================================
; Program: Arithmetic & Flags Demo
; Description: Observes registers and flags updates
; ============================================

ORG 100h

start:
    ; Addition with carry
    MOV AX, 0FFF0h
    ADD AX, 0015h    ; Triggers carry flag (CF) & overflow!

    ; Logical operations
    MOV BX, 0AA55h
    XOR BX, 0FFFFh   ; Bitwise invert

    ; Loop multiplication
    MOV CX, 5
    MOV DX, 0
add_loop:
    ADD DX, 10       ; Multiply 10 * 5
    LOOP add_loop

    ; Compare & conditional branch
    CMP DX, 50
    JE calculation_ok
    MOV AX, 0BADh
    JMP finish

calculation_ok:
    MOV AX, 0001h    ; Success indicator in AX

finish:
    MOV AX, 4C00h
    INT 21h
`
  },
  {
    id: 'bubble_sort',
    title: 'Bubble Sort Array',
    category: 'Algorithms',
    description: 'Sorts an array of numbers in memory using indexed addressing and compares.',
    code: `; ============================================
; Program: Bubble Sort
; Description: Sorts a byte array in ascending order
; ============================================

ORG 100h

start:
    MOV CX, 5        ; Array length - 1

outer_loop:
    LEA SI, array
    MOV DX, CX       ; Inner loop counter

inner_loop:
    MOV AL, [SI]
    MOV BL, [SI+1]
    CMP AL, BL
    JLE no_swap

    ; Swap elements
    MOV [SI], BL
    MOV [SI+1], AL

no_swap:
    INC SI
    DEC DX
    JNZ inner_loop

    LOOP outer_loop

    ; Program finish
    MOV AX, 4C00h
    INT 21h

array DB 42, 17, 95, 3, 28, 61
`
  },
  {
    id: 'graphics_pixel',
    title: 'VGA Mode 13h Pixel Drawer',
    category: 'Graphics & BIOS',
    description: 'Switches to VGA 320x200 256-color graphics mode and draws colored horizontal lines.',
    code: `; ============================================
; Program: VGA Mode 13h Graphics
; Description: Switches to 320x200 graphics and draws pixels
; ============================================

ORG 100h

start:
    ; INT 10h / AH=00h, AL=13h : Set 320x200 256-color graphics mode
    MOV AH, 00h
    MOV AL, 13h
    INT 10h

    ; Draw a horizontal line of pixels at row 100
    MOV CX, 50       ; Starting X coordinate
    MOV DX, 100      ; Y coordinate = 100
    MOV AL, 4        ; Color = 4 (Red)

draw_line:
    MOV AH, 0Ch      ; INT 10h / AH=0Ch : Write pixel
    INT 10h
    INC CX
    CMP CX, 270      ; End X coordinate
    JNE draw_line

    ; Draw a second cyan line at row 120
    MOV CX, 50
    MOV DX, 120
    MOV AL, 3        ; Color = 3 (Cyan)

draw_line2:
    MOV AH, 0Ch
    INT 10h
    INC CX
    CMP CX, 270
    JNE draw_line2

    ; Exit
    MOV AX, 4C00h
    INT 21h
`
  }
];
