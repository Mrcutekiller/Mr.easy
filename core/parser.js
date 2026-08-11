/**
 * MR.easy Parser v2
 * Builds an AST from the token stream.
 *
 * File structure is always:
 *   Mr.easy "Title"   ← required first line
 *   <elements...>
 */

const { TOKEN_TYPES, KEYWORDS } = require('./lexer');
const { Diagnostic, DIAGNOSTIC_LEVELS, suggestKeyword } = require('./diagnostics');

// Keywords that start a new statement — collectProps() must stop before these
const STATEMENT_KEYWORDS = new Set([
  'nav', 'hero', 'section', 'header', 'footer',
  'row', 'column', 'col', 'grid', 'card', 'box',
  'list', 'form',
  'title', 'subtitle', 'text', 'label', 'item',
  'button', 'link', 'image', 'img', 'video', 'icon',
  'input', 'logo', 'divider', 'spacer',
  'menu', 'links', 'set', 'if', 'else', 'end',
  'repeat', 'times', 'animate', 'show', 'hide',
  'component', 'use', 'function', 'call', 'define', 'import', 'from',
  'for', 'while', 'each', 'in', 'of', 'to',
  'head', 'meta', 'page',
  'accordion', 'tabs', 'tab', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'page', 'navbar', 'sidebar', 'modal', 'dropdown',
  'steps', 'step', 'testimonial',
  'badge', 'tag', 'alert', 'progress', 'avatar',
  'quote', 'code', 'stat', 'select', 'checkbox',
  'toggle', 'embed', 'rating', 'countdown',
  'theme-toggle', 'theme_toggle', 'toast',
  'whatsapp-buy', 'whatsapp_buy', 'pricing-table', 'pricing_table', 'plan',
]);

class ASTNode {
  constructor(type, props = {}) {
    this.type = type;
    Object.assign(this, props);
  }
}

class Parser {
  constructor(tokens, source = '') {
    this.source = source;
    // Strip NEWLINE tokens for easier parsing
    this.tokens = tokens.filter(t =>
      t.type !== TOKEN_TYPES.NEWLINE
    );
    this.pos = 0;
    this.errors = [];
    this.diagnostics = [];
    this.knownComponents = new Set();
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

  addDiagnostic(level, message, line = 1, col = 1, suggestion = null) {
    const diag = new Diagnostic(level, message, line, col, this.source, suggestion);
    this.diagnostics.push(diag);
    this.errors.push(diag.formatCaret());
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

    return { ast: program, errors: this.errors, diagnostics: this.diagnostics };
  }

  parseStatement() {
    const t = this.current;
    if (!t || t.type === TOKEN_TYPES.EOF) return null;
    if (t.type === TOKEN_TYPES.INDENT || t.type === TOKEN_TYPES.DEDENT) {
      this.consume();
      return null;
    }

    // Check if it's a component call (e.g. Pricing("Basic", "$9") or Pricing)
    if (t.type === TOKEN_TYPES.WORD || t.type === TOKEN_TYPES.KEYWORD) {
      if (this.knownComponents.has(t.value) || /^[A-Z]/.test(t.value)) {
        return this.parseComponentCall();
      }
    }

    if (t.type !== TOKEN_TYPES.KEYWORD && t.type !== TOKEN_TYPES.WORD) {
      this.addDiagnostic(
        DIAGNOSTIC_LEVELS.ERROR,
        `Unexpected token '${t.value}'`,
        t.line,
        t.col
      );
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
      case 'component': return this.parseComponentDef();
      case 'function':  return this.parseComponentDef();
      case 'define':    return this.parseDefine();
      case 'if':        return this.parseIf();
      case 'repeat':    return this.parseRepeat();
      case 'for':       return this.parseFor();
      case 'while':     return this.parseWhile();
      case 'each':      return this.parseEach();
      case 'import':    return this.parseImport();
      case 'head':      return this.parseBlock('head');
      case 'meta':      return this.parseInline('meta');

      // ── NEW v2.0 block keywords ──────────────────────────────────
      case 'accordion': return this.parseBlock('accordion');
      case 'tabs':      return this.parseBlock('tabs');
      case 'tab':       return this.parseBlock('tab');
      case 'table':     return this.parseBlock('table');
      case 'thead':     return this.parseBlock('thead');
      case 'tbody':     return this.parseBlock('tbody');
      case 'tr':        return this.parseBlock('tr');
      case 'page':      return this.parseBlock('page');
      case 'navbar':    return this.parseBlock('navbar');
      case 'sidebar':   return this.parseBlock('sidebar');
      case 'modal':     return this.parseBlock('modal');
      case 'dropdown':  return this.parseBlock('dropdown');
      case 'steps':     return this.parseBlock('steps');
      case 'step':      return this.parseBlock('step');
      case 'testimonial': return this.parseBlock('testimonial');

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
      case 'use':       return this.parseUse();
      case 'call':      return this.parseInline('call');
      case 'animate':   return this.parseInline('animate');
      case 'show':      return this.parseInline('show');
      case 'hide':      return this.parseInline('hide');

      // ── NEW v2.0 inline keywords ─────────────────────────────────
      case 'badge':     return this.parseInline('badge');
      case 'tag':       return this.parseInline('tag');
      case 'alert':     return this.parseInline('alert');
      case 'progress':  return this.parseInline('progress');
      case 'avatar':    return this.parseInline('avatar');
      case 'quote':     return this.parseInline('quote');
      case 'code':      return this.parseInline('codeblock');
      case 'stat':      return this.parseInline('stat');
      case 'select':    return this.parseInline('select');
      case 'checkbox':  return this.parseInline('checkbox');
      case 'toggle':    return this.parseInline('toggle');
      case 'embed':     return this.parseInline('embed');
      case 'rating':    return this.parseInline('rating');
      case 'countdown': return this.parseInline('countdown');
      case 'th':        return this.parseInline('th');
      case 'td':        return this.parseInline('td');
      case 'theme-toggle':
      case 'theme_toggle': return this.parseInline('themetoggle');
      case 'toast':        return this.parseInline('toast');
      case 'whatsapp-buy':
      case 'whatsapp_buy': return this.parseInline('whatsappbuy');
      case 'pricing-table':
      case 'pricing_table': return this.parseBlock('pricingtable');
      case 'plan':          return this.parseBlock('plan');

      default:
        // Fuzzy match suggestion using Levenshtein distance
        const suggestion = suggestKeyword(t.value, KEYWORDS);
        let msg = `Unknown keyword "${t.value}" at line ${t.line}, col ${t.col}`;
        if (suggestion) msg += `. Did you mean "${suggestion}"?`;
        this.addDiagnostic(DIAGNOSTIC_LEVELS.ERROR, msg, t.line, t.col, suggestion);
        this.consume();
        return new ASTNode('ErrorBlock', { message: msg, line: t.line, col: t.col, suggestion });
    }
  }

  /** Collect inline tokens on the same logical line (until INDENT, DEDENT, EOF, or next statement keyword) */
  collectProps() {
    const props    = { modifiers: [] };

    while (
      this.current &&
      this.current.type !== TOKEN_TYPES.INDENT &&
      this.current.type !== TOKEN_TYPES.DEDENT &&
      this.current.type !== TOKEN_TYPES.EOF
    ) {
      const t = this.current;

      // Stop if we hit a keyword that starts a new statement (e.g. "text", "button", "title")
      if ((t.type === TOKEN_TYPES.KEYWORD || t.type === TOKEN_TYPES.WORD) &&
          STATEMENT_KEYWORDS.has(t.value)) {
        break;
      }

      if (t.type === TOKEN_TYPES.STRING) {
        if (!props.label) props.label = t.value;
        else {
          if (!props.args) props.args = [];
          props.args.push(t.value);
        }
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
      // Stop if we hit 'end' keyword at the right indentation
      if (this.check(TOKEN_TYPES.KEYWORD, 'end')) break;
      const node = this.parseStatement();
      if (node) children.push(node);
    }
    if (this.check(TOKEN_TYPES.DEDENT)) this.consume(); // DEDENT
    return children;
  }

  /** Consume 'end' keyword if present at current level */
  consumeEnd() {
    while (this.check(TOKEN_TYPES.KEYWORD, 'end')) {
      this.consume();
    }
  }

  parseBlock(type) {
    this.consume(); // keyword
    const props    = this.collectProps();
    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode(type, { props, children });
  }

  parseIf() {
    this.consume(); // 'if'
    const props = this.collectProps();
    const children = this.collectChildren();
    const elseChildren = [];

    // Handle else / else if
    while (this.check(TOKEN_TYPES.KEYWORD, 'else')) {
      this.consume(); // 'else'
      // Check for 'else if'
      if (this.check(TOKEN_TYPES.KEYWORD, 'if')) {
        this.consume(); // 'if'
        const elifProps = this.collectProps();
        const elifChildren = this.collectChildren();
        elseChildren.push(new ASTNode('elif', { props: elifProps, children: elifChildren }));
      } else if (this.check(TOKEN_TYPES.INDENT)) {
        const elseKids = this.collectChildren();
        elseChildren.push(...elseKids);
      }
    }
    this.consumeEnd();
    return new ASTNode('if', { props, children, elseChildren });
  }

  parseFor() {
    this.consume(); // 'for'
    const varName = this.current?.value; this.consume();
    if (this.check(TOKEN_TYPES.EQUALS)) this.consume();
    const start = this.current?.value; this.consume();
    const isTo = this.check(TOKEN_TYPES.KEYWORD, 'to');
    const isIn = this.check(TOKEN_TYPES.KEYWORD, 'in') || this.check(TOKEN_TYPES.KEYWORD, 'of');
    if (isTo || isIn) this.consume();
    const end = this.current?.value; this.consume();
    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode('for', { props: { varName, start, end, isTo, isIn }, children });
  }

  parseWhile() {
    this.consume(); // 'while'
    const props = this.collectProps();
    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode('while', { props, children });
  }

  parseEach() {
    this.consume(); // 'each'
    const varName = this.current?.value; this.consume();
    const isIn = this.check(TOKEN_TYPES.KEYWORD, 'in') || this.check(TOKEN_TYPES.KEYWORD, 'of');
    if (isIn) this.consume();
    const listName = this.current?.value; this.consume();
    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode('each', { props: { varName, listName }, children });
  }

  parseRepeat() {
    this.consume(); // 'repeat'
    let itemVar = null;
    let listVar = null;

    // Check for repeat item in items
    const firstWord = this.current?.value;
    this.consume();

    if (this.check(TOKEN_TYPES.KEYWORD, 'in') || this.check(TOKEN_TYPES.KEYWORD, 'of')) {
      this.consume(); // 'in'
      itemVar = firstWord;
      listVar = this.current?.value;
      this.consume();
    } else {
      listVar = firstWord;
      if (this.check(TOKEN_TYPES.KEYWORD, 'times')) this.consume();
    }

    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode('repeat', { props: { count: listVar, itemVar, listVar }, children });
  }

  parseComponentDef() {
    this.consume(); // 'component'
    const nameToken = this.current;
    const name = nameToken?.value;
    this.consume();
    if (name) this.knownComponents.add(name);

    // Consume parameter names on definition line (e.g. component Pricing title price)
    const params = [];
    while (
      this.current &&
      this.current.type !== TOKEN_TYPES.INDENT &&
      this.current.type !== TOKEN_TYPES.DEDENT &&
      this.current.type !== TOKEN_TYPES.EOF
    ) {
      if (this.current.type === TOKEN_TYPES.WORD || this.current.type === TOKEN_TYPES.KEYWORD) {
        params.push(this.current.value);
      }
      this.consume();
    }

    const children = this.collectChildren();
    this.consumeEnd();
    return new ASTNode('component', { props: { label: name, name, params }, children });
  }

  parseComponentCall() {
    const t = this.current;
    const componentName = t.value;
    this.consume(); // component name
    const props = this.collectProps();
    return new ASTNode('use', { props: { componentName, ...props } });
  }

  parseImport() {
    this.consume(); // 'import'
    const label = this.current?.value; this.consume();
    const from = this.current?.value; this.consume();
    const source = this.current?.value; this.consume();
    return new ASTNode('import', { props: { label, from, source } });
  }

  parseDefine() {
    this.consume(); // 'define'
    const props = this.collectProps();
    const children = this.collectChildren();
    this.consumeEnd();
    const params = props.modifiers || [];
    return new ASTNode('define', { props: { ...props, params }, children });
  }

  parseUse() {
    this.consume(); // 'use'
    const props = this.collectProps();
    return new ASTNode('use', { props });
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
    const children = this.collectChildren();
    return new ASTNode('links', { props: { items }, children });
  }

  parseSet() {
    this.consume(); // 'set'
    const name = this.current?.value; this.consume();
    if (this.check(TOKEN_TYPES.EQUALS)) this.consume();
    // Handle array literal: [1, 2, 3] or ["a", "b"]
    if (this.check(TOKEN_TYPES.LBRACKET)) {
      this.consume(); // '['
      const items = [];
      while (this.current && !this.check(TOKEN_TYPES.RBRACKET)) {
        if (this.current.type === TOKEN_TYPES.NUMBER || this.current.type === TOKEN_TYPES.STRING) {
          items.push(this.consume().value);
        } else if (this.check(TOKEN_TYPES.COMMA)) {
          this.consume(); // skip comma
        } else {
          const v = this.current?.value;
          if (v !== undefined) { items.push(v); this.consume(); }
          else break;
        }
      }
      if (this.check(TOKEN_TYPES.RBRACKET)) this.consume(); // ']'
      return new ASTNode('set', { props: { name, value: items } });
    }
    const value = this.current?.value; this.consume();
    return new ASTNode('set', { props: { name, value } });
  }
}

module.exports = { Parser, ASTNode };
