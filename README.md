# Modern Emu8086 🚀

> **A modern, cross-platform 8086 Microprocessor Studio, Assembler, and Bitwise Debugger.**  
> Re-imagining the classic Emu8086 emulator with a frosted Liquid Glass aesthetic, real-time memory variable inspection, interactive virtual hardware peripherals, and multi-OS desktop distribution.

Created with ❤️ by **[Ravindra Soran](https://github.com/rsoran)** (`@rsoran`).

---

## 📥 Direct Downloads & Launch

All pre-compiled release binaries and installers are available directly on the **[Releases Page](https://github.com/rsoran/emu8086-modern/releases)**:

👉 **[Go to Latest Release (v1.0.0)](https://github.com/rsoran/emu8086-modern/releases/tag/v1.0.0)**

| Platform | Type | Download Link | Size |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows** | Standalone Executable (`.exe`) | [**📥 Download for Windows (.exe)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-Windows-1.0.0-x64.exe) | ~188 MB |
| 📦 **Windows Portable** | Standalone Zero-Install (`.zip`) | [**📦 Download Windows Portable (.zip)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-Windows-1.0.0-x64.zip) | ~137 MB |
| 🍏 **macOS (Apple Silicon)** | M1/M2/M3/M4 Disk Image (`.dmg`) | [**🍏 Download macOS ARM64 (.dmg)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-macOS-1.0.0-arm64.dmg) | 115 MB |
| 🍏 **macOS (Intel)** | Intel x86_64 Disk Image (`.dmg`) | [**🍏 Download macOS x64 (.dmg)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-macOS-1.0.0-x64.dmg) | 119 MB |
| 🐧 **Linux (Universal)** | All Linux Distributions (`.AppImage`) | [**🐧 Download Linux (.AppImage)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-Linux-1.0.0-x86_64.AppImage) | 125 MB |
| 🐧 **Linux (Debian/Ubuntu)** | Debian Package (`.deb`) | [**🐧 Download Debian/Ubuntu (.deb)**](https://github.com/rsoran/emu8086-modern/releases/download/v1.0.0/Modern-Emu8086-Linux-1.0.0-amd64.deb) | 83.6 MB |
| 🌐 **Live Web App** | Run in any browser (Zero Install) | [**🚀 Open Web Studio Online**](https://rsoran.github.io/emu8086-modern/) | Instant |

*(You can also browse and download all files directly from the [GitHub Releases Page](https://github.com/rsoran/emu8086-modern/releases)).*

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
