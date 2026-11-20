export type TokenType =
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'COMMA'
  | 'COLON'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'NEWLINE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  numValue?: number;
  line: number;
  column: number;
}

export class Lexer {
  private src: string;
  private pos = 0;
  private line = 1;
  private col = 1;

  constructor(source: string) {
    this.src = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];

      // Skip whitespace except newlines
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
        continue;
      }

      // Comments: semicolon to end of line
      if (ch === ';') {
        while (this.pos < this.src.length && this.src[this.pos] !== '\n') {
          this.advance();
        }
        continue;
      }

      if (ch === '\n') {
        tokens.push({
          type: 'NEWLINE',
          value: '\n',
          line: this.line,
          column: this.col
        });
        this.advance();
        this.line++;
        this.col = 1;
        continue;
      }

      const curLine = this.line;
      const curCol = this.col;

      if (ch === ',') {
        tokens.push({ type: 'COMMA', value: ',', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === ':') {
        tokens.push({ type: 'COLON', value: ':', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === '[') {
        tokens.push({ type: 'LBRACKET', value: '[', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === ']') {
        tokens.push({ type: 'RBRACKET', value: ']', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === '+') {
        tokens.push({ type: 'PLUS', value: '+', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === '-') {
        tokens.push({ type: 'MINUS', value: '-', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      if (ch === '*') {
        tokens.push({ type: 'STAR', value: '*', line: curLine, column: curCol });
        this.advance();
        continue;
      }

      // String literals: '...' or "..."
      if (ch === "'" || ch === '"') {
        const quote = ch;
        this.advance();
        let strVal = '';
        while (this.pos < this.src.length && this.src[this.pos] !== quote) {
          if (this.src[this.pos] === '\n') break; // unterminated string on newline
          strVal += this.src[this.pos];
          this.advance();
        }
        if (this.pos < this.src.length && this.src[this.pos] === quote) {
          this.advance();
        }
        tokens.push({
          type: 'STRING',
          value: strVal,
          line: curLine,
          column: curCol
        });
        continue;
      }

      // Numbers or Identifiers starting with digits/letters/dots/underscores
      if (this.isAlphaOrSpecial(ch) || this.isDigit(ch)) {
        let text = '';
        while (this.pos < this.src.length && (this.isAlphaNumOrSpecial(this.src[this.pos]))) {
          text += this.src[this.pos];
          this.advance();
        }

        // Determine if it is a number or identifier
        const parsedNum = this.parseNumber(text);
        if (parsedNum !== null) {
          tokens.push({
            type: 'NUMBER',
            value: text,
            numValue: parsedNum,
            line: curLine,
            column: curCol
          });
        } else {
          tokens.push({
            type: 'IDENTIFIER',
            value: text,
            line: curLine,
            column: curCol
          });
        }
        continue;
      }

      // Any unknown character, skip but advance
      this.advance();
    }

    tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      column: this.col
    });

    return tokens;
  }

  private advance(): string {
    const ch = this.src[this.pos++];
    this.col++;
    return ch;
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlphaOrSpecial(ch: string): boolean {
    return (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      ch === '_' ||
      ch === '.' ||
      ch === '@' ||
      ch === '$' ||
      ch === '?'
    );
  }

  private isAlphaNumOrSpecial(ch: string): boolean {
    return this.isAlphaOrSpecial(ch) || this.isDigit(ch);
  }

  public static parseNumericString(text: string): number | null {
    const raw = text.trim();
    if (!raw) return null;

    // Hex: 0x12AB
    if (/^0x[0-9a-fA-F]+$/i.test(raw)) {
      return parseInt(raw.substring(2), 16);
    }

    // Hex: 1234h or 0FFFFh
    if (/^[0-9][0-9a-fA-F]*h$/i.test(raw)) {
      return parseInt(raw.slice(0, -1), 16);
    }

    // Binary: 101010b
    if (/^[0-1]+b$/i.test(raw)) {
      return parseInt(raw.slice(0, -1), 2);
    }

    // Octal: 777o or 777q
    if (/^[0-7]+[oq]$/i.test(raw)) {
      return parseInt(raw.slice(0, -1), 8);
    }

    // Decimal: 12345
    if (/^[0-9]+$/.test(raw)) {
      return parseInt(raw, 10);
    }

    return null;
  }

  private parseNumber(text: string): number | null {
    return Lexer.parseNumericString(text);
  }
}
