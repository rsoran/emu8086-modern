import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { register8086Language, LANGUAGE_ID } from '../editor/language';
import { AssemblyError } from '../types/emulator';

interface EditorPaneProps {
  code: string;
  onChange: (value: string) => void;
  currentLine?: number;
  breakpoints: number[];
  onToggleBreakpoint: (line: number) => void;
  errors: AssemblyError[];
  isDarkMode?: boolean;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  code,
  onChange,
  currentLine,
  breakpoints,
  onToggleBreakpoint,
  errors,
  isDarkMode = true
}) => {
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    register8086Language(monaco);

    // Setup custom dark theme
    monaco.editor.defineTheme('emu8086-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'keyword.directive', foreground: 'c084fc', fontStyle: 'bold' },
        { token: 'variable.predefined', foreground: '38bdf8' },
        { token: 'number.hex', foreground: '34d399' },
        { token: 'number.binary', foreground: '34d399' },
        { token: 'number', foreground: '34d399' },
        { token: 'string', foreground: 'fcd34d' },
        { token: 'type.identifier', foreground: 'f472b6', fontStyle: 'bold' },
        { token: 'delimiter.bracket', foreground: '94a3b8' }
      ],
      colors: {
        'editor.background': '#0b0f19',
        'editor.foreground': '#f1f5f9',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#93c5fd',
        'editor.lineHighlightBackground': '#1e293b50',
        'editorGutter.background': '#0b0f19',
        'editorCursor.foreground': '#60a5fa'
      }
    });

    // Setup custom light theme
    monaco.editor.defineTheme('emu8086-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '2563eb', fontStyle: 'bold' },
        { token: 'keyword.directive', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'variable.predefined', foreground: '0284c7' },
        { token: 'number.hex', foreground: '059669' },
        { token: 'number.binary', foreground: '059669' },
        { token: 'number', foreground: '059669' },
        { token: 'string', foreground: 'd97706' },
        { token: 'type.identifier', foreground: 'db2777', fontStyle: 'bold' },
        { token: 'delimiter.bracket', foreground: '64748b' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#2563eb',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorGutter.background': '#ffffff',
        'editorCursor.foreground': '#2563eb'
      }
    });

    monaco.editor.setTheme(isDarkMode ? 'emu8086-dark' : 'emu8086-light');

    // Handle breakpoint glyph click
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position?.lineNumber;
        if (line) {
          onToggleBreakpoint(line);
        }
      }
    });
  };

  // Switch Monaco Theme when isDarkMode changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDarkMode ? 'emu8086-dark' : 'emu8086-light');
    }
  }, [isDarkMode]);

  // Update decorations (active execution line + breakpoints)
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations: MonacoType.editor.IModelDeltaDecoration[] = [];

    // Breakpoint markers in gutter
    for (const bp of breakpoints) {
      newDecorations.push({
        range: new monaco.Range(bp, 1, bp, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'glyph-breakpoint'
        }
      });
    }

    // Active execution line highlight
    if (currentLine && currentLine > 0) {
      newDecorations.push({
        range: new monaco.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'active-execution-line'
        }
      });

      // Reveal line in center
      editor.revealLineInCenterIfOutsideViewport(currentLine);
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [currentLine, breakpoints]);

  // Update error markers
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const markers: MonacoType.editor.IMarkerData[] = errors.map(err => ({
      severity: err.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      message: err.message,
      startLineNumber: err.line,
      startColumn: err.column,
      endLineNumber: err.line,
      endColumn: err.column + 10
    }));

    monaco.editor.setModelMarkers(model, 'owner', markers);
  }, [errors]);

  return (
    <div className="h-full w-full relative overflow-hidden glass-panel border border-white/20 dark:border-white/10 shadow-xl">
      <Editor
        height="100%"
        defaultLanguage={LANGUAGE_ID}
        value={code}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          glyphMargin: true,
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          fontSize: 13.5,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 4,
          insertSpaces: true,
          renderLineHighlight: 'all',
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          }
        }}
      />
    </div>
  );
};
