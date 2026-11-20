import type * as Monaco from 'monaco-editor';
import {
  INSTRUCTION_DOCS,
  DIRECTIVE_DOCS,
  INTERRUPT_DOCS,
  REGISTER_DOCS
} from '../core/assembler/opcodes';

export const LANGUAGE_ID = 'asm8086';

export function register8086Language(monaco: typeof Monaco) {
  // Check if already registered
  const languages = monaco.languages.getLanguages();
  if (languages.some(l => l.id === LANGUAGE_ID)) return;

  monaco.languages.register({ id: LANGUAGE_ID });

  // Syntax Highlighting (Monarch definition)
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    defaultToken: '',
    ignoreCase: true,
    tokenPostfix: '.asm',

    keywords: Object.keys(INSTRUCTION_DOCS),

    directives: [
      'ORG', 'DB', 'DW', 'DD', 'DQ', 'DT', 'EQU',
      '.CODE', '.DATA', '.STACK', '.MODEL',
      'PROC', 'ENDP', 'MACRO', 'ENDM', 'END',
      'BYTE', 'WORD', 'PTR', 'OFFSET', 'SEGMENT', 'ENDS'
    ],

    registers: [
      'AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'BP', 'SP', 'IP',
      'AL', 'BL', 'CL', 'DL', 'AH', 'BH', 'CH', 'DH',
      'CS', 'DS', 'SS', 'ES'
    ],

    tokenizer: {
      root: [
        // Comments
        [/;.*$/, 'comment'],

        // Strings
        [/'([^'\\]|\\.)*'/, 'string'],
        [/"([^"\\]|\\.)*"/, 'string'],

        // Labels
        [/^[a-zA-Z_.$?][\w.$?]*:/, 'type.identifier'],
        [/[a-zA-Z_.$?][\w.$?]*:/, 'type.identifier'],

        // Numbers: Hex, Binary, Decimal
        [/0x[0-9a-fA-F]+/, 'number.hex'],
        [/[0-9][0-9a-fA-F]*[hH]/, 'number.hex'],
        [/[0-1]+[bB]/, 'number.binary'],
        [/[0-9]+/, 'number'],

        // Brackets / Punctuation
        [/[\[\]]/, 'delimiter.bracket'],
        [/[,:]/, 'delimiter'],
        [/[+\-*\/]/, 'operator'],

        // Identifiers, registers, instructions, directives
        [/[a-zA-Z_.$?][\w.$?]*/, {
          cases: {
            '@keywords': 'keyword',
            '@directives': 'keyword.directive',
            '@registers': 'variable.predefined',
            '@default': 'identifier'
          }
        }]
      ]
    }
  });

  // Language Configuration (comments, brackets)
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
    comments: {
      lineComment: ';'
    },
    brackets: [
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] }
    ]
  });

  // Autocomplete Provider
  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: Monaco.languages.CompletionItem[] = [];

      // 1. Instruction Suggestions
      for (const [name, doc] of Object.entries(INSTRUCTION_DOCS)) {
        suggestions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: `[8086 ${doc.category}] ${doc.summary}`,
          documentation: {
            value: `**${doc.name}** - ${doc.summary}\n\n*Syntax:* \`${doc.syntax.join('` or `')}\`\n\n*Flags affected:* ${doc.flags}\n\n\`\`\`asm\n${doc.example}\n\`\`\``
          },
          insertText: name,
          range
        });
      }

      // 2. Directives Suggestions
      for (const [name, doc] of Object.entries(DIRECTIVE_DOCS)) {
        let insertText = name;
        if (name === 'ORG') insertText = 'ORG 100h';
        else if (name === 'DB') insertText = 'DB \'${1:text}$\', 0';
        else if (name === 'DW') insertText = 'DW ${1:0}';
        else if (name === 'EQU') insertText = '${1:NAME} EQU ${2:0}';

        suggestions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: `[Directive] ${doc.summary}`,
          documentation: {
            value: `**${doc.name}**\n\n${doc.description}\n\n\`\`\`asm\n${doc.example}\n\`\`\``
          },
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        });
      }

      // 3. Register Suggestions
      for (const [name, doc] of Object.entries(REGISTER_DOCS)) {
        suggestions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: `[${doc.size} Register] ${doc.role}`,
          documentation: {
            value: `**${name}** (${doc.size} - ${doc.role})\n\n${doc.desc}`
          },
          insertText: name,
          range
        });
      }

      // 4. Code Snippets & Common Patterns
      suggestions.push({
        label: 'print_string_template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'DOS INT 21h / AH=09h Print String',
        documentation: 'Prints a $-terminated string using DOS interrupt 21h',
        insertText: [
          'MOV AH, 09h',
          'LEA DX, ${1:msg}',
          'INT 21h'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      });

      suggestions.push({
        label: 'exit_to_dos_template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'DOS INT 21h / AH=4Ch Terminate Program',
        documentation: 'Cleanly exits program and returns control to DOS',
        insertText: [
          'MOV AX, 4C00h',
          'INT 21h'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      });

      suggestions.push({
        label: 'read_char_template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'DOS INT 21h / AH=01h Read Key with Echo',
        documentation: 'Reads a character from keyboard into AL',
        insertText: [
          'MOV AH, 01h',
          'INT 21h'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      });

      suggestions.push({
        label: 'loop_counter_template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'Standard CX Decrement Loop',
        documentation: 'Initializes CX and loops until CX reaches 0',
        insertText: [
          'MOV CX, ${1:10}',
          '${2:my_loop}:',
          '    ; loop body',
          '    LOOP ${2:my_loop}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      });

      // 5. Document Labels & Variables (Deterministic static suggestions, no AI)
      const fullText = model.getValue();
      const labelRegex = /^\s*([a-zA-Z_.$?][\w.$?]*)\s*:/gm;
      let match: RegExpExecArray | null;
      const seenSymbols = new Set<string>();

      while ((match = labelRegex.exec(fullText)) !== null) {
        const lbl = match[1];
        if (!seenSymbols.has(lbl)) {
          seenSymbols.add(lbl);
          suggestions.push({
            label: lbl,
            kind: monaco.languages.CompletionItemKind.Reference,
            detail: `[Label] Defined in current source`,
            insertText: lbl,
            range
          });
        }
      }

      const varRegex = /^\s*([a-zA-Z_.$?][\w.$?]*)\s+(DB|DW|EQU)\b/gmi;
      while ((match = varRegex.exec(fullText)) !== null) {
        const varName = match[1];
        const varType = match[2].toUpperCase();
        if (!seenSymbols.has(varName)) {
          seenSymbols.add(varName);
          suggestions.push({
            label: varName,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: `[${varType}] Variable in current source`,
            insertText: varName,
            range
          });
        }
      }

      return { suggestions };
    }
  });

  // Hover Documentation Provider
  monaco.languages.registerHoverProvider(LANGUAGE_ID, {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const upper = word.word.toUpperCase();

      // Check instructions
      if (upper in INSTRUCTION_DOCS) {
        const doc = INSTRUCTION_DOCS[upper];
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `### ⚡ 8086 Instruction: **${doc.name}** (\`${doc.category}\`)` },
            { value: `*${doc.summary}*\n\n${doc.description}` },
            {
              value: [
                '**Syntax Options:**',
                ...doc.syntax.map(s => `- \`${s}\``),
                '',
                `**Allowed Operands:** \`${doc.operands}\``,
                '',
                `**Flags Affected:** \`${doc.flags}\``,
                '',
                '**Example:**',
                '```asm',
                doc.example,
                '```'
              ].join('\n')
            }
          ]
        };
      }

      // Check registers
      if (upper in REGISTER_DOCS) {
        const doc = REGISTER_DOCS[upper];
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `### 💾 Register: **${upper}** (\`${doc.size}\`)` },
            { value: `**Role:** *${doc.role}*\n\n${doc.desc}` }
          ]
        };
      }

      // Check directives
      if (upper in DIRECTIVE_DOCS) {
        const doc = DIRECTIVE_DOCS[upper];
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `### 📋 Directive: **${doc.name}**` },
            { value: `*${doc.summary}*\n\n${doc.description}` },
            {
              value: [
                `**Syntax:** \`${doc.syntax}\``,
                '',
                '**Example:**',
                '```asm',
                doc.example,
                '```'
              ].join('\n')
            }
          ]
        };
      }

      // Check for interrupt documentation if on "21h" or "10h"
      if (upper === '21H' || upper === '10H' || upper === '16H') {
        const matched = INTERRUPT_DOCS.filter(d => d.interrupt.toUpperCase() === upper);
        if (matched.length > 0) {
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `### 📟 Interrupt: **INT ${upper}** Services` },
              {
                value: matched.map(m => `**AH = ${m.ah} (${m.name}):**\n- Inputs: \`${m.inputs}\`\n- Outputs: \`${m.outputs}\`\n- *${m.description}*`).join('\n\n---\n\n')
              }
            ]
          };
        }
      }

      return null;
    }
  });
}
