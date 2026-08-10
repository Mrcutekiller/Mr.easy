/**
 * MR.easy Lexer v2 — Tokenizes .mreasy source files
 *
 * Every MR.easy file MUST start with:
 *   Mr.easy "Page Title"
 *
 * Just like HTML starts with <!DOCTYPE html>
 * This is the signature of the language.
 */

const TOKEN_TYPES = {
  MREASY:     'MREASY',      // The Mr.easy declaration
  KEYWORD:    'KEYWORD',
  STRING:     'STRING',
  NUMBER:     'NUMBER',
  PROPERTY:   'PROPERTY',    // key:value  e.g.  cols:3  color:blue
  WORD:       'WORD',        // bare words used as values (e.g. nav links: Home About)
  INDENT:     'INDENT',
  DEDENT:     'DEDENT',
  NEWLINE:    'NEWLINE',
  EOF:        'EOF',
  EQUALS:     'EQUALS',
};

// Every reserved word in the language
const KEYWORDS = new Set([
  // Document
  'Mr.easy',
  // Layout
  'nav', 'hero', 'section', 'header', 'footer',
  'row', 'column', 'col', 'grid', 'card', 'box',
  // Content
  'title', 'subtitle', 'text', 'label', 'item',
  'button', 'link', 'image', 'img', 'video', 'icon',
  'list', 'form', 'input', 'divider', 'spacer',
  // Special
  'logo', 'links', 'menu',
  // Logic
  'set', 'repeat', 'times', 'if', 'else', 'end',
  'show', 'hide', 'animate',
  'for', 'while', 'each', 'in', 'of', 'to',
  // Component system
  'component', 'use', 'function', 'call', 'define', 'import', 'from',
  // Head/Meta
  'head', 'meta', 'link',
  // Style shortcuts (can follow any element)
  'big', 'medium', 'small', 'tiny',
  'glow', 'shadow', 'rounded', 'outline', 'bold', 'italic',
  'dark', 'light', 'gradient', 'glass',
  'center', 'left', 'right',
  'blue', 'red', 'green', 'purple', 'orange', 'pink',
  'yellow', 'white', 'black', 'gray', 'cyan',
  'on', 'off',
]);

class Token {
  constructor(type, value, line, col) {
    this.type  = type;
    this.value = value;
    this.line  = line;
    this.col   = col;
  }
}

class Lexer {
  constructor(source) {
    this.source  = source;
    this.pos     = 0;
    this.line    = 1;
    this.col     = 1;
    this.tokens  = [];
    this.indents = [0];
  }

  get current() { return this.source[this.pos]; }

  advance(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.current === '\n') { this.line++; this.col = 1; }
      else { this.col++; }
      this.pos++;
    }
  }

  emit(type, value) {
    this.tokens.push(new Token(type, value, this.line, this.col));
  }

  tokenize() {
    // First: validate the file starts with Mr.easy
    const trimmed = this.source.trimStart();
    if (!trimmed.startsWith('Mr.easy')) {
      throw new Error(
        '❌ MR.easy Error: Every .mreasy file must start with:\n\n' +
        '   Mr.easy "Your Page Title"\n\n' +
        'This is the signature of the MR.easy language!\n' +
        'Think of it like <!DOCTYPE html> in HTML.'
      );
    }

    while (this.pos < this.source.length) {
      this.scanToken();
    }

    while (this.indents.length > 1) {
      this.indents.pop();
      this.emit(TOKEN_TYPES.DEDENT, null);
    }
    this.emit(TOKEN_TYPES.EOF, null);
    return this.tokens;
  }

  scanToken() {
    if (this.current === '\n') {
      this.advance();
      this.emit(TOKEN_TYPES.NEWLINE, '\n');
      this.handleIndent();
      return;
    }

    if (this.current === ' ' || this.current === '\t') {
      this.advance();
      return;
    }

    // Comments: # anything
    if (this.current === '#') {
      while (this.pos < this.source.length && this.current !== '\n') this.advance();
      return;
    }

    // Strings: "..." or '...'
    if (this.current === '"' || this.current === "'") {
      this.scanString();
      return;
    }

    // Numbers
    if (/[0-9]/.test(this.current)) {
      this.scanNumber();
      return;
    }

    // Equals
    if (this.current === '=') {
      this.emit(TOKEN_TYPES.EQUALS, '=');
      this.advance();
      return;
    }

    // Words, keywords, and property:value pairs
    // Support Mr.easy (with dot)
    if (/[a-zA-Z_]/.test(this.current)) {
      this.scanWord();
      return;
    }

    this.advance();
  }

  handleIndent() {
    let spaces = 0;
    while (this.pos < this.source.length && (this.current === ' ' || this.current === '\t')) {
      spaces += this.current === '\t' ? 2 : 1;
      this.advance();
    }
    if (!this.current || this.current === '\n' || this.current === '#') return;
    if (this.pos >= this.source.length) return;

    const current = this.indents[this.indents.length - 1];
    if (spaces > current) {
      this.indents.push(spaces);
      this.emit(TOKEN_TYPES.INDENT, spaces);
    } else {
      while (this.indents.length > 1 && spaces < this.indents[this.indents.length - 1]) {
        this.indents.pop();
        this.emit(TOKEN_TYPES.DEDENT, null);
      }
    }
  }

  scanString() {
    const quote = this.current;
    this.advance();
    let str = '';
    while (this.pos < this.source.length && this.current !== quote) {
      if (this.current === '\\') {
        this.advance();
        const esc = { n: '\n', t: '\t', '"': '"', "'": "'" };
        str += esc[this.current] || this.current;
      } else {
        str += this.current;
      }
      this.advance();
    }
    this.advance(); // close quote
    this.emit(TOKEN_TYPES.STRING, str);
  }

  scanNumber() {
    let num = '';
    while (this.pos < this.source.length && /[0-9.]/.test(this.current)) {
      num += this.current; this.advance();
    }
    this.emit(TOKEN_TYPES.NUMBER, parseFloat(num));
  }

  scanWord() {
    let word = '';
    const startCol = this.col;
    // Allow letters, digits, underscore, hyphen, and ONE dot (for Mr.easy)
    while (this.pos < this.source.length && /[a-zA-Z0-9_\-\.]/.test(this.current)) {
      word += this.current;
      this.advance();
    }

    // Check for property:value (e.g. cols:3, color:blue)
    if (this.current === ':') {
      this.advance(); // skip ':'
      // Skip optional whitespace after colon
      while (this.pos < this.source.length && (this.current === ' ' || this.current === '\t')) {
        this.advance();
      }
      let val = '';
      if (this.current === '"' || this.current === "'") {
        const q = this.current; this.advance();
        while (this.pos < this.source.length && this.current !== q) { val += this.current; this.advance(); }
        this.advance();
      } else {
        while (this.pos < this.source.length && /[a-zA-Z0-9_\-\.#%]/.test(this.current)) {
          val += this.current; this.advance();
        }
      }
      this.tokens.push(new Token(TOKEN_TYPES.PROPERTY, { key: word, value: val }, this.line, startCol));
      return;
    }

    // Classify
    if (word === 'Mr.easy') {
      this.tokens.push(new Token(TOKEN_TYPES.MREASY, word, this.line, startCol));
    } else if (KEYWORDS.has(word)) {
      this.tokens.push(new Token(TOKEN_TYPES.KEYWORD, word, this.line, startCol));
    } else {
      this.tokens.push(new Token(TOKEN_TYPES.WORD, word, this.line, startCol));
    }
  }
}

module.exports = { Lexer, Token, TOKEN_TYPES, KEYWORDS };
