# Modern Emu8086 🚀

> **A modern, cross-platform 8086 Microprocessor Studio, Assembler, and Bitwise Debugger.**  
> Re-imagining the classic Emu8086 emulator with a frosted Liquid Glass aesthetic, real-time memory variable inspection, interactive virtual hardware peripherals, and multi-OS desktop distribution.

Created with ❤️ by **[Ravindra Soran](https://github.com/rsoran)** (`@rsoran`).

---

## 📥 Direct Downloads & Launch

No compiling or command lines needed — download the direct desktop executable for your platform or open in your browser:

| Platform | Type | Direct Download Link |
| :--- | :--- | :--- |
| 🪟 **Windows** | Native Installer (`.exe`) | [**📥 Download for Windows (.exe)**](https://github.com/rsoran/emu8086-modern/releases/latest/download/Modern-Emu8086-Windows-x64.exe) |
| 📦 **Windows Portable** | Standalone Zero-Install (`.zip`) | [**📦 Download Windows Portable (.zip)**](https://github.com/rsoran/emu8086-modern/releases/latest/download/Modern-Emu8086-Windows-x64.zip) |
| 🍏 **macOS** | Apple Silicon & Intel (`.dmg`) | [**🍏 Download macOS (.dmg)**](https://github.com/rsoran/emu8086-modern/releases/latest) |
| 🐧 **Linux** | Universal Package (`.AppImage`) | [**🐧 Download Linux (.AppImage)**](https://github.com/rsoran/emu8086-modern/releases/latest) |
| 🌐 **Live Web App** | Run in any browser (Zero Install) | [**🚀 Open Web Studio Online**](https://rsoran.github.io/emu8086-modern/) |

---

## ✨ Features

* **⚡ Complete 8086 Real Mode CPU**:
  * 16-bit register architecture (`AX`, `BX`, `CX`, `DX`, `SI`, `DI`, `BP`, `SP`, `IP`, `CS`, `DS`, `SS`, `ES`).
  * Live Flags Register (`CF`, `PF`, `AF`, `ZF`, `SF`, `TF`, `IF`, `DF`, `OF`) with clickable toggles.
  * Segmented execution model (`DATA SEGMENT`, `CODE SEGMENT`, `ASSUME`, `ORG 100h`).
  * Full support for MS-DOS interrupts (`INT 21h`, `INT 10h`, `INT 16h`).
* **⏪ Step Back (Execution Undo)**: Reverse execution state instruction by instruction with full memory-diff snapshots.
* **🔍 Live Variable & Memory Inspector (`[vars]`)**:
  * Real-time memory variable table reading directly from CPU memory (`cpu.readByte` / `cpu.readWord`).
  * Displays **Hex** (`92h`), **Decimal** ($146$, signed: $-110$), **ASCII Character**, and **Binary** (`10010010b`).
  * Inline editing of memory variables directly from the UI.
* **🧮 8086 Hex Calculator & Bitwise Verifier**:
  * Instant multi-base conversions (**HEX**, **DEC**, **BIN**, **OCT**, ASCII).
  * 8-bit (`BYTE`), 16-bit (`WORD`), and 32-bit (`DWORD`) bit modes.
  * Real-time 8086 Flag Simulator: automatically calculates `CF`, `ZF`, `SF`, `OF`, `PF` for arithmetic and logic operations.
  * Quick Register Injection (`AL`, `AH`, `AX`, `BX`, `CX`, `DX`).
* **🚥 Virtual Hardware Peripherals**:
  * **Traffic Lights Controller**: 4-way intersection simulation controlled via Port `4`.
  * **Stepper Motor**: Visual motor angle and phase stepping via Port `7`.
  * **7-Segment Display**: Multi-digit digital display via Port `199`.
  * **Thermometer & Thermostat**: Temperature sensor and heater relay via Port `125`.
* **🎨 Liquid Glass UI**:
  * Frosted glassmorphism with dynamic ambient fluid glows.
  * Seamless **Dark Mode** and **Light Mode** switching.
  * Pinned bottom toolbar (`[screen]`, `[source]`, `[reset]`, `[aux]`, `[vars]`, `[debug]`, `[stack]`, `[flags]`, `[calc]`).
* **💡 Offline Deterministic Code Intelligence**:
  * Local Monaco editor autocompletion (100% deterministic, **strictly zero AI/LLM dependencies**).
  * Hover manuals for all 8086 opcodes, addressing modes, and DOS interrupts.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS
* **Code Editor**: Monaco Editor (VS Code core)
* **Icons & UI**: Lucide Icons, Glassmorphism CSS
* **Desktop Packaging**: Electron, Electron Builder, GitHub Actions CI/CD

---

## 🚀 Developer Guide (Optional: Build from Source)

If you wish to build or customize the source code yourself:

### 1. Run in Development Mode
```bash
# Clone the repository
git clone https://github.com/rsoran/emu8086-modern.git
cd emu8086-modern

# Install dependencies
npm install

# Start local web dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Web / Production
```bash
npm run build
npm run preview
```

### 3. Build Desktop Binaries Locally
* **Windows `.exe`**: `npm run electron:build:win`
* **macOS `.dmg`**: `npm run electron:build:mac`
* **Linux `.AppImage`**: `npm run electron:build:linux`

---

## 📄 License

MIT License © 2026 [Ravindra Soran](https://github.com/rsoran).
