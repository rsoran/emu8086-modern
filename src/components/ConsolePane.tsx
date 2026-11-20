import React from 'react';
import { AssemblyError } from '../types/emulator';
import { Terminal, AlertTriangle, XCircle, CheckCircle, Trash2, Copy } from 'lucide-react';

interface ConsolePaneProps {
  outputText: string;
  errors: AssemblyError[];
  listing: string;
  onClearOutput: () => void;
  activeConsoleTab: 'output' | 'errors' | 'listing';
  onConsoleTabChange: (tab: 'output' | 'errors' | 'listing') => void;
}

export const ConsolePane: React.FC<ConsolePaneProps> = ({
  outputText,
  errors,
  listing,
  onClearOutput,
  activeConsoleTab,
  onConsoleTabChange
}) => {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warnCount = errors.filter(e => e.severity === 'warning').length;

  const copyListing = () => {
    navigator.clipboard.writeText(listing);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c101a] border-t border-slate-800">
      {/* Tabs */}
      <div className="h-8 bg-[#101624] border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onConsoleTabChange('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeConsoleTab === 'output'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>

          <button
            onClick={() => onConsoleTabChange('errors')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeConsoleTab === 'errors'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {errorCount > 0 ? (
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            ) : warnCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>Problems ({errorCount + warnCount})</span>
          </button>

          <button
            onClick={() => onConsoleTabChange('listing')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeConsoleTab === 'listing'
                ? 'bg-slate-800 text-purple-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Assembler Listing</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeConsoleTab === 'listing' && (
            <button
              onClick={copyListing}
              title="Copy Listing"
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {activeConsoleTab === 'output' && (
            <button
              onClick={onClearOutput}
              title="Clear Console Output"
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3 font-mono text-xs text-slate-200">
        {activeConsoleTab === 'output' && (
          <div>
            {outputText ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400">
                {outputText}
              </pre>
            ) : (
              <div className="text-slate-500 italic">
                Program console output will appear here (INT 21h AH=02h, AH=09h)...
              </div>
            )}
          </div>
        )}

        {activeConsoleTab === 'errors' && (
          <div>
            {errors.length === 0 ? (
              <div className="text-emerald-400 flex items-center gap-2 py-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No errors or warnings. Assembly clean!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded-lg border ${
                      err.severity === 'error'
                        ? 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                        : 'bg-amber-950/20 border-amber-900/60 text-amber-300'
                    }`}
                  >
                    {err.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold mr-2">
                        Line {err.line}:{err.column}:
                      </span>
                      <span>{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeConsoleTab === 'listing' && (
          <div>
            {listing ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 select-text">
                {listing}
              </pre>
            ) : (
              <div className="text-slate-500 italic">
                Assemble a program to view the generated opcode listing...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
