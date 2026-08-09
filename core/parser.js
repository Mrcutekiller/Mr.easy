/**
 * MR.easy Parser v2
 * Builds an AST from the token stream.
 *
 * File structure is always:
 *   Mr.easy "Title"   ← required first line
 *   <elements...>
 */

const { TOKEN_TYPES } = require('./lexer');

class ASTNode {
  constructor(type, props = {}) {
    this.type = type;
    Object.assign(this, props);
  }
}

class Parser {
  constructor(tokens) {
    // Strip NEWLINE tokens for easier parsing
    this.tokens = tokens.filter(t =>
      t.type !== TOKEN_TYPES.NEWLINE
    );
    this.pos    = 0;
    this.errors = [];
  }

  get current() { return this.tokens[this.pos]; }

  consume() {
    return this.tokens[this.pos++];
  }

  check(type, value = null) {
    return this.current &&
      this.current.type === type &&
      (value === null || this.current.value === value);
  }

  isKeyword(v) {
    return this.current &&
      (this.current.type === TOKEN_TYPES.KEYWORD ||
       this.current.type === TOKEN_TYPES.MREASY ||
       this.current.type === TOKEN_TYPES.WORD) &&
      this.current.value === v;
  }

  parse() {
    const program = new ASTNode('Program', { title: '', body: [] });

    // First token MUST be Mr.easy
    if (this.check(TOKEN_TYPES.MREASY)) {
      this.consume(); // Mr.easy
      if (this.check(TOKEN_TYPES.STRING)) {
        program.title = this.consume().value;
      }
    }

    while (this.current && this.current.type !== TOKEN_TYPES.EOF) {
      const node = this.parseStatement();
      if (node) program.body.push(node);
    }

    return { ast: program, errors: this.errors };
  }

  parseStatement() {
    const t = this.current;
    if (!t || t.type === TOKEN_TYPES.EOF) return null;
    if (t.type === TOKEN_TYPES.INDENT || t.type === TOKEN_TYPES.DEDENT) {
      this.consume();
      return null;
    }
    if (t.type !== TOKEN_TYPES.KEYWORD && t.type !== TOKEN_TYPES.WORD) {
      this.consume();
      return null;
    }

    switch (t.value) {
      case 'nav':       return this.parseBlock('nav');
      case 'hero':      return this.parseBlock('hero');
      case 'section':   return this.parseBlock('section');
      case 'header':    return this.parseBlock('header');
      case 'footer':    return this.parseBlock('footer');
      case 'row':       return this.parseBlock('row');
      case 'column':
      case 'col':       return this.parseBlock('column');
      case 'grid':      return this.parseBlock('grid');
      case 'card':      return this.parseBlock('card');
      case 'box':       return this.parseBlock('box');
      case 'list':      return this.parseBlock('list');
      case 'form':      return this.parseBlock('form');
      case 'component': return this.parseBlock('component');
      case 'function':  return this.parseBlock('function');
      case 'if':        return this.parseBlock('if');
      case 'repeat':    return this.parseRepeat();

      case 'title':     return this.parseInline('title');
      case 'subtitle':  return this.parseInline('subtitle');
      case 'text':      return this.parseInline('text');
      case 'label':     return this.parseInline('label');
      case 'item':      return this.parseInline('item');
      case 'button':    return this.parseInline('button');
      case 'link':      return this.parseInline('link');
      case 'image':
      case 'img':       return this.parseInline('image');
      case 'video':     return this.parseInline('video');
      case 'icon':      return this.parseInline('icon');
      case 'input':     return this.parseInline('input');
      case 'logo':      return this.parseInline('logo');
      case 'divider':   return this.parseInline('divider');
      case 'spacer':    return this.parseInline('spacer');
      case 'menu':      return this.parseMenu();
      case 'links':     return this.parseLinks();
      case 'set':       return this.parseSet();
      case 'use':       return this.parseInline('use');
      case 'call':      return this.parseInline('call');
      case 'animate':   return this.parseInline('animate');
      case 'show':      return this.parseInline('show');
      case 'hide':      return this.parseInline('hide');

      default:
        this.consume();
        return null;
    }
  }

  /** Collect inline tokens on the same logical line (until INDENT, DEDENT, or EOF) */
  collectProps() {
    const props    = { modifiers: [] };
    const children = [];

    while (
      this.current &&
      this.current.type !== TOKEN_TYPES.INDENT &&
      this.current.type !== TOKEN_TYPES.DEDENT &&
      this.current.type !== TOKEN_TYPES.EOF
    ) {
      const t = this.current;

      if (t.type === TOKEN_TYPES.STRING) {
        if (!props.label) props.label = t.value;
        this.consume();
      } else if (t.type === TOKEN_TYPES.PROPERTY) {
        props[t.value.key] = t.value.value;
        this.consume();
      } else if (t.type === TOKEN_TYPES.NUMBER) {
        props.value = t.value;
        this.consume();
      } else if (t.type === TOKEN_TYPES.KEYWORD || t.type === TOKEN_TYPES.WORD) {
        // Bare style modifier words: big, glow, shadow, blue, etc.
        props.modifiers.push(t.value);
        this.consume();
      } else {
        break;
      }
    }

    return props;
  }

  /** Collect all child statements inside an INDENT block */
  collectChildren() {
    const children = [];
    if (!this.check(TOKEN_TYPES.INDENT)) return children;
    this.consume(); // INDENT
    while (
      this.current &&
      !this.check(TOKEN_TYPES.DEDENT) &&
      !this.check(TOKEN_TYPES.EOF)
    ) {
      const node = this.parseStatement();
      if (node) children.push(node);
    }
    if (this.check(TOKEN_TYPES.DEDENT)) this.consume(); // DEDENT
    return children;
  }

  parseBlock(type) {
    this.consume(); // keyword
    const props    = this.collectProps();
    const children = this.collectChildren();
    return new ASTNode(type, { props, children });
  }

  parseInline(type) {
    this.consume(); // keyword
    const props = this.collectProps();
    return new ASTNode(type, { props });
  }

  parseMenu() {
    this.consume(); // 'menu'
    const items = [];
    while (
      this.current &&
      this.current.type === TOKEN_TYPES.WORD &&
      this.current.type !== TOKEN_TYPES.INDENT &&
      this.current.type !== TOKEN_TYPES.EOF
    ) {
      items.push(this.consume().value);
    }
    return new ASTNode('menu', { props: { items } });
  }

  parseLinks() {
    this.consume(); // 'links'
    const items = [];
    while (
      this.current &&
      (this.current.type === TOKEN_TYPES.WORD || this.current.type === TOKEN_TYPES.KEYWORD) &&
      this.current.type !== TOKEN_TYPES.INDENT &&
      this.current.type !== TOKEN_TYPES.EOF
    ) {
      items.push(this.consume().value);
    }
    // Also support indented link children
    const children = this.collectChildren();
    return new ASTNode('links', { props: { items }, children });
  }

  parseSet() {
    this.consume(); // 'set'
    const name = this.current?.value; this.consume();
    if (this.check(TOKEN_TYPES.EQUALS)) this.consume();
    const value = this.current?.value; this.consume();
    return new ASTNode('set', { props: { name, value } });
  }

  parseRepeat() {
    this.consume(); // 'repeat'
    const count = this.current?.value; this.consume();
    if (this.current?.value === 'times') this.consume();
    const children = this.collectChildren();
    return new ASTNode('repeat', { props: { count }, children });
  }
}

module.exports = { Parser, ASTNode };
