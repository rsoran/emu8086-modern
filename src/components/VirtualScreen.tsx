import React, { useRef, useEffect, useState } from 'react';
import { VideoModeState } from '../types/emulator';
import { Monitor, Terminal, Tv } from 'lucide-react';

interface VirtualScreenProps {
  videoState: VideoModeState;
  onKeyPress: (ascii: number) => void;
}

export const VirtualScreen: React.FC<VirtualScreenProps> = ({
  videoState,
  onKeyPress
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [crtEffect, setCrtEffect] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Render text mode or graphics mode on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (videoState.mode === 0x13) {
      // 320x200 256-color Graphics Mode
      canvas.width = 320;
      canvas.height = 200;
      const imgData = ctx.createImageData(320, 200);
      const data = imgData.data;

      for (let i = 0; i < 320 * 200; i++) {
        const colorIdx = videoState.graphicsBuffer[i];
        const hex = videoState.palette[colorIdx % videoState.palette.length] || '#000000';
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);

        data[i * 4 + 0] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      // 80x25 Text Mode
      canvas.width = 640;
      canvas.height = 400;

      // Fill background black
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, 640, 400);

      const cellW = 8;
      const cellH = 16;
      ctx.font = '13px "Fira Code", monospace';
      ctx.textBaseline = 'top';

      for (let r = 0; r < 25; r++) {
        for (let c = 0; c < 80; c++) {
          const idx = r * 80 + c;
          const charCode = videoState.charBuffer[idx];
          const attr = videoState.attrBuffer[idx];

          const fgIdx = attr & 0x0F;
          const bgIdx = (attr >> 4) & 0x07;

          const fgColor = videoState.palette[fgIdx] || '#AAAAAA';
          const bgColor = videoState.palette[bgIdx] || '#000000';

          const x = c * cellW;
          const y = r * cellH;

          // Background
          if (bgIdx !== 0) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, cellW, cellH);
          }

          // Character
          if (charCode > 32 && charCode < 127) {
            ctx.fillStyle = fgColor;
            ctx.fillText(String.fromCharCode(charCode), x, y);
          }
        }
      }

      // Draw Cursor
      if (videoState.cursorVisible) {
        const curX = videoState.cursorCol * cellW;
        const curY = videoState.cursorRow * cellH + 13;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(curX, curY, cellW, 3);
      }
    }
  }, [videoState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let ascii: number | null = null;
    if (e.key === 'Enter') ascii = 13;
    else if (e.key === 'Backspace') ascii = 8;
    else if (e.key === 'Tab') { e.preventDefault(); ascii = 9; }
    else if (e.key === 'Escape') ascii = 27;
    else if (e.key.length === 1) ascii = e.key.charCodeAt(0);

    if (ascii !== null) {
      onKeyPress(ascii);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d121d] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Top Bar */}
      <div className="h-8 bg-[#121826] border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300">Virtual Screen</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {videoState.mode === 0x13 ? 'Mode 13h (320x200)' : 'Mode 03h (80x25 Text)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`p-1 rounded text-xs transition ${
              crtEffect ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle CRT Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
          <div className="text-[10px] font-mono text-slate-400">
            Cursor: [{videoState.cursorRow}:{videoState.cursorCol}]
          </div>
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`flex-1 flex items-center justify-center p-3 relative bg-[#070a10] outline-none cursor-text ${
          crtEffect ? 'crt-screen' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded shadow-2xl image-rendering-pixelated border border-slate-900"
          style={{ imageRendering: 'pixelated' }}
        />

        {!isFocused && (
          <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            Click screen to send keyboard input
          </div>
        )}
      </div>
    </div>
  );
};
