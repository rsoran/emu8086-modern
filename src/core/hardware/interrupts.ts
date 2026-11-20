import { CPU } from '../cpu/cpu';
import { VideoModeState } from '../../types/emulator';

export class InterruptManager {
  public videoState: VideoModeState;
  public keyboardBuffer: number[] = [];
  public outputText: string = '';
  public onOutputChange?: (text: string) => void;
  public onVideoUpdate?: () => void;
  public onHalt?: () => void;

  constructor() {
    this.videoState = this.initVideoState();
  }

  public reset() {
    this.videoState = this.initVideoState();
    this.keyboardBuffer = [];
    this.outputText = '';
    if (this.onOutputChange) this.onOutputChange('');
    if (this.onVideoUpdate) this.onVideoUpdate();
  }

  private initVideoState(): VideoModeState {
    const chars = new Uint8Array(80 * 25);
    const attrs = new Uint8Array(80 * 25);
    chars.fill(32); // Space
    attrs.fill(0x07); // Light gray on black

    return {
      mode: 0x03, // 80x25 text mode
      cursorRow: 0,
      cursorCol: 0,
      cursorVisible: true,
      charBuffer: chars,
      attrBuffer: attrs,
      graphicsBuffer: new Uint8Array(320 * 200),
      palette: this.initPalette()
    };
  }

  private initPalette(): string[] {
    // 16 standard CGA/VGA colors
    return [
      '#000000', '#0000AA', '#00AA00', '#00AAAA',
      '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
      '#555555', '#5555FF', '#55FF55', '#55FFFF',
      '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
    ];
  }

  public pushKeyPress(ascii: number) {
    this.keyboardBuffer.push(ascii);
  }

  public handleInterrupt(intNum: number, cpu: CPU): boolean {
    switch (intNum) {
      case 0x21:
        return this.handleDOS(cpu);
      case 0x10:
        return this.handleBIOSVideo(cpu);
      case 0x16:
        return this.handleBIOSKeyboard(cpu);
      case 0x1A:
        return this.handleBIOSTimer(cpu);
      default:
        return false;
    }
  }

  private handleDOS(cpu: CPU): boolean {
    const ah = cpu.AH;

    switch (ah) {
      case 0x01: { // Read character with echo
        let charCode = 13; // default Enter if buffer empty
        if (this.keyboardBuffer.length > 0) {
          charCode = this.keyboardBuffer.shift()!;
        }
        cpu.AL = charCode;
        this.writeChar(String.fromCharCode(charCode));
        return true;
      }

      case 0x02: { // Write character in DL
        const ch = String.fromCharCode(cpu.DL);
        this.writeChar(ch);
        return true;
      }

      case 0x06: { // Direct console I/O
        if (cpu.DL === 0xFF) {
          // Input
          if (this.keyboardBuffer.length > 0) {
            cpu.AL = this.keyboardBuffer.shift()!;
            cpu.flags.ZF = false;
          } else {
            cpu.flags.ZF = true;
          }
        } else {
          // Output
          this.writeChar(String.fromCharCode(cpu.DL));
        }
        return true;
      }

      case 0x07:
      case 0x08: { // Read character without echo
        let charCode = 0;
        if (this.keyboardBuffer.length > 0) {
          charCode = this.keyboardBuffer.shift()!;
        }
        cpu.AL = charCode;
        return true;
      }

      case 0x09: { // Print string terminated by '$' at DS:DX
        let offset = cpu.DX;
        let str = '';
        while (offset < 0xFFFF) {
          const b = cpu.readByte(cpu.DS, offset);
          if (b === 0x24) break; // '$' character
          str += String.fromCharCode(b);
          offset++;
        }
        this.writeString(str);
        return true;
      }

      case 0x0A: { // Buffered keyboard input
        // DS:DX points to buffer:
        // Byte 0: max characters
        // Byte 1: actual characters read
        // Bytes 2+: buffer
        const maxLen = cpu.readByte(cpu.DS, cpu.DX);
        let actual = 0;
        let bufOffset = cpu.DX + 2;

        while (actual < maxLen - 1 && this.keyboardBuffer.length > 0) {
          const code = this.keyboardBuffer.shift()!;
          if (code === 13) break;
          cpu.writeByte(cpu.DS, bufOffset + actual, code);
          actual++;
        }
        cpu.writeByte(cpu.DS, cpu.DX + 1, actual);
        cpu.writeByte(cpu.DS, bufOffset + actual, 13); // CR at end
        return true;
      }

      case 0x4C: { // Terminate program
        cpu.isHalted = true;
        if (this.onHalt) this.onHalt();
        return true;
      }
    }

    return true;
  }

  private handleBIOSVideo(cpu: CPU): boolean {
    const ah = cpu.AH;

    switch (ah) {
      case 0x00: { // Set video mode (AL = mode)
        this.videoState.mode = cpu.AL;
        this.videoState.cursorRow = 0;
        this.videoState.cursorCol = 0;
        this.videoState.charBuffer.fill(32);
        this.videoState.graphicsBuffer.fill(0);
        if (this.onVideoUpdate) this.onVideoUpdate();
        return true;
      }

      case 0x02: { // Set cursor position (DH = row, DL = col)
        this.videoState.cursorRow = Math.min(24, Math.max(0, cpu.DH));
        this.videoState.cursorCol = Math.min(79, Math.max(0, cpu.DL));
        if (this.onVideoUpdate) this.onVideoUpdate();
        return true;
      }

      case 0x03: { // Get cursor position
        cpu.DH = this.videoState.cursorRow;
        cpu.DL = this.videoState.cursorCol;
        cpu.CH = 6; // start scan line
        cpu.CL = 7; // end scan line
        return true;
      }

      case 0x06:
      case 0x07: { // Scroll up/down
        this.scrollUp();
        if (this.onVideoUpdate) this.onVideoUpdate();
        return true;
      }

      case 0x09: { // Write character and attribute at cursor
        const ch = cpu.AL;
        const attr = cpu.BL;
        const count = cpu.CX;
        for (let i = 0; i < count; i++) {
          const pos = this.videoState.cursorRow * 80 + (this.videoState.cursorCol + i);
          if (pos < 80 * 25) {
            this.videoState.charBuffer[pos] = ch;
            this.videoState.attrBuffer[pos] = attr;
          }
        }
        if (this.onVideoUpdate) this.onVideoUpdate();
        return true;
      }

      case 0x0E: { // Teletype output
        const ch = String.fromCharCode(cpu.AL);
        this.writeChar(ch);
        return true;
      }

      case 0x0C: { // Write pixel (mode 13h)
        const color = cpu.AL;
        const x = cpu.CX;
        const y = cpu.DX;
        if (x >= 0 && x < 320 && y >= 0 && y < 200) {
          this.videoState.graphicsBuffer[y * 320 + x] = color;
          if (this.onVideoUpdate) this.onVideoUpdate();
        }
        return true;
      }

      case 0x0D: { // Read pixel
        const x = cpu.CX;
        const y = cpu.DX;
        if (x >= 0 && x < 320 && y >= 0 && y < 200) {
          cpu.AL = this.videoState.graphicsBuffer[y * 320 + x];
        } else {
          cpu.AL = 0;
        }
        return true;
      }
    }

    return true;
  }

  private handleBIOSKeyboard(cpu: CPU): boolean {
    const ah = cpu.AH;
    if (ah === 0x00) { // Wait for keystroke
      if (this.keyboardBuffer.length > 0) {
        const ascii = this.keyboardBuffer.shift()!;
        cpu.AL = ascii;
        cpu.AH = 0x1E; // Default scan code (e.g. key 'A')
      } else {
        cpu.AL = 13;
        cpu.AH = 0x1C;
      }
      return true;
    } else if (ah === 0x01) { // Check keystroke
      if (this.keyboardBuffer.length > 0) {
        cpu.flags.ZF = false;
        cpu.AL = this.keyboardBuffer[0];
        cpu.AH = 0x1E;
      } else {
        cpu.flags.ZF = true;
      }
      return true;
    }
    return true;
  }

  private handleBIOSTimer(cpu: CPU): boolean {
    // Return clock ticks in CX:DX
    const ticks = Math.floor(Date.now() / 55);
    cpu.CX = (ticks >> 16) & 0xFFFF;
    cpu.DX = ticks & 0xFFFF;
    cpu.AL = 0; // midnight flag
    return true;
  }

  public writeString(str: string) {
    for (const ch of str) {
      this.writeChar(ch);
    }
  }

  public writeChar(ch: string) {
    this.outputText += ch;
    if (this.onOutputChange) this.onOutputChange(this.outputText);

    if (ch === '\r') {
      this.videoState.cursorCol = 0;
    } else if (ch === '\n') {
      this.videoState.cursorCol = 0;
      this.videoState.cursorRow++;
      if (this.videoState.cursorRow >= 25) {
        this.scrollUp();
        this.videoState.cursorRow = 24;
      }
    } else if (ch === '\b') {
      if (this.videoState.cursorCol > 0) {
        this.videoState.cursorCol--;
        const pos = this.videoState.cursorRow * 80 + this.videoState.cursorCol;
        this.videoState.charBuffer[pos] = 32;
      }
    } else {
      const pos = this.videoState.cursorRow * 80 + this.videoState.cursorCol;
      if (pos < 80 * 25) {
        this.videoState.charBuffer[pos] = ch.charCodeAt(0);
      }
      this.videoState.cursorCol++;
      if (this.videoState.cursorCol >= 80) {
        this.videoState.cursorCol = 0;
        this.videoState.cursorRow++;
        if (this.videoState.cursorRow >= 25) {
          this.scrollUp();
          this.videoState.cursorRow = 24;
        }
      }
    }

    if (this.onVideoUpdate) this.onVideoUpdate();
  }

  private scrollUp() {
    for (let r = 1; r < 25; r++) {
      for (let c = 0; c < 80; c++) {
        this.videoState.charBuffer[(r - 1) * 80 + c] = this.videoState.charBuffer[r * 80 + c];
        this.videoState.attrBuffer[(r - 1) * 80 + c] = this.videoState.attrBuffer[r * 80 + c];
      }
    }
    // Clear bottom row
    for (let c = 0; c < 80; c++) {
      this.videoState.charBuffer[24 * 80 + c] = 32;
      this.videoState.attrBuffer[24 * 80 + c] = 0x07;
    }
  }
}
