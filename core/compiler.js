/**
 * MR.easy Compiler v2
 * Converts AST → Beautiful HTML + CSS + JavaScript
 */

const { builtinStyles, builtinAnimations, iconMap, COLOR_MAP, SIZE_MAP } = require('./builtins');

class Compiler {
  constructor() {
    this.vars       = {};
    this.components = {};
    this.functions  = {};
    this.extraCSS   = [];
    this.extraJS    = [];
    this.pageStyle  = { dark: true, gradient: false, light: false };
  }

  compile(ast) {
    const title    = ast.title || 'My MR.easy Page';
    const bodyHTML = this.compileChildren(ast.body || []);
    const css      = this.extraCSS.join('\n');
    const js       = this.extraJS.join('\n');
    const bodyBg   = this.pageStyle.gradient
      ? 'background: linear-gradient(135deg, #0f172a 0%, #1e0a3c 50%, #0c1a3a 100%);'
      : this.pageStyle.light
      ? 'background: #f8fafc; color: #0f172a;'
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="MR.easy language">
  <title>${this.esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
${builtinStyles}
${css}
body { ${bodyBg} }
  </style>
</head>
<body>
${bodyHTML}
${builtinAnimations}
<script>
${js}
</script>
</body>
</html>`;
  }

  compileChildren(nodes) {
    return (nodes || []).map(n => this.compileNode(n)).filter(Boolean).join('\n');
  }

  compileNode(node) {
    if (!node) return '';
    switch (node.type) {
      case 'nav':       return this.Nav(node);
      case 'hero':      return this.Hero(node);
      case 'section':   return this.Section(node);
      case 'header':    return this.Header(node);
      case 'footer':    return this.Footer(node);
      case 'row':       return this.Row(node);
      case 'column':    return this.Column(node);
      case 'grid':      return this.Grid(node);
      case 'card':      return this.Card(node);
      case 'box':       return this.Box(node);
      case 'list':      return this.List(node);
      case 'form':      return this.Form(node);
      case 'title':     return this.Title(node);
      case 'subtitle':  return this.Subtitle(node);
      case 'text':      return this.Text(node);
      case 'label':     return this.Label(node);
      case 'item':      return this.Item(node);
      case 'button':    return this.Button(node);
      case 'link':      return this.Link(node);
      case 'links':     return this.Links(node);
      case 'logo':      return this.Logo(node);
      case 'menu':      return this.Menu(node);
      case 'image':     return this.Image(node);
      case 'video':     return this.Video(node);
      case 'icon':      return this.Icon(node);
      case 'input':     return this.Input(node);
      case 'divider':   return `<hr class="mr-divider">`;
      case 'spacer':    return this.Spacer(node);
      case 'set':       return this.Set(node);
      case 'repeat':    return this.Repeat(node);
      case 'component': return this.ComponentDef(node);
      case 'use':       return this.Use(node);
      case 'function':  return this.FunctionDef(node);
      case 'call':      return this.Call(node);
      case 'animate':   return this.Animate(node);
      default:          return '';
    }
  }

  // ── STYLE HELPERS ──────────────────────────────────────────────────────────

  /** Read style modifiers from node.props.modifiers */
  mods(node) { return node.props?.modifiers || []; }

  /** Build CSS class list from base + modifiers */
  cls(base, node, extra = []) {
    const m = this.mods(node);
    const classes = [base];

    // Size classes
    if (m.includes('big'))    classes.push(`${base.split(' ')[0]}-size-big`);
    if (m.includes('medium')) classes.push(`${base.split(' ')[0]}-size-medium`);
    if (m.includes('small'))  classes.push(`${base.split(' ')[0]}-size-small`);
    if (m.includes('tiny'))   classes.push(`${base.split(' ')[0]}-size-tiny`);

    // Button color variants (mr-btn-blue etc)
    const colors = ['blue','red','green','purple','orange','pink','yellow','cyan'];
    colors.forEach(c => { if (m.includes(c)) classes.push(`mr-btn-${c}`); });

    // Style modifiers
    if (m.includes('glow'))    classes.push('mr-glow');
    if (m.includes('shadow'))  classes.push('mr-shadow');
    if (m.includes('rounded')) classes.push('mr-rounded');
    if (m.includes('outline')) classes.push('mr-btn-outline');
    if (m.includes('ghost'))   classes.push('mr-btn-ghost');
    if (m.includes('center'))  classes.push('mr-center');
    if (m.includes('glass'))   classes.push('mr-glass');
    if (m.includes('gradient'))classes.push('mr-anim-gradient');
    if (m.includes('float'))   classes.push('mr-anim-float');
    if (m.includes('big') && base === 'mr-button') classes.push('mr-btn-big');
    if (m.includes('small') && base === 'mr-button') classes.push('mr-btn-small');

    classes.push(...extra);
    return classes.filter(Boolean).join(' ');
  }

  /** Build inline style string */
  style(obj) {
    const s = Object.entries(obj).filter(([,v]) => v).map(([k,v]) => `${k}:${v}`).join(';');
    return s ? `style="${s}"` : '';
  }

  /** Resolve {varname} in text */
  vars_(text) {
    return String(text || '').replace(/\{([a-zA-Z_]+)\}/g, (_, n) => this.vars[n] ?? `{${n}}`);
  }

  /** HTML escape */
  esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /** Resolve a color name or hex value */
  color(val) { return COLOR_MAP[val] || val || null; }

  // ── LAYOUT NODES ───────────────────────────────────────────────────────────

  Nav(node) {
    const inner = this.compileChildren(node.children);
    return `<nav class="mr-nav">${inner}</nav>`;
  }

  Hero(node) {
    const m   = this.mods(node);
    const cls = ['mr-hero', m.includes('center') ? 'mr-center' : 'mr-center'].join(' ');
    const bg  = node.props?.background ? `background:${this.color(node.props.background)};` : '';
    return `<div class="${cls}" ${bg ? `style="${bg}"` : ''}>\n<div class="mr-hero-inner">\n${this.compileChildren(node.children)}\n</div>\n</div>`;
  }

  Section(node) {
    const { label, id, background, color: clr, 'min-height': mh, full } = node.props || {};
    const s   = this.style({ background: this.color(background), color: this.color(clr), 'min-height': mh ? mh + 'vh' : null });
    const cls = full === 'on' ? 'mr-section-full' : 'mr-section';
    const sid = id || label?.replace(/\s+/g, '-').toLowerCase() || '';
    return `<section id="${sid}" class="${cls}" ${s}>\n${this.compileChildren(node.children)}\n</section>`;
  }

  Header(node) {
    return `<div class="mr-header">\n${this.compileChildren(node.children)}\n</div>`;
  }

  Footer(node) {
    return `<footer class="mr-footer">\n${this.compileChildren(node.children)}\n</footer>`;
  }

  Row(node) {
    const { gap, align, justify } = node.props || {};
    const m = this.mods(node);
    const s = this.style({ gap: gap ? gap + 'px' : null, 'align-items': align, 'justify-content': m.includes('center') ? 'center' : justify });
    return `<div class="mr-row" ${s}>${this.compileChildren(node.children)}</div>`;
  }

  Column(node) {
    const { gap, width } = node.props || {};
    const s = this.style({ gap: gap ? gap + 'px' : null, width });
    return `<div class="mr-column" ${s}>${this.compileChildren(node.children)}</div>`;
  }

  Grid(node) {
    const { cols, gap } = node.props || {};
    const s = this.style({
      'grid-template-columns': cols ? `repeat(${cols}, 1fr)` : null,
      gap: gap ? gap + 'px' : null
    });
    return `<div class="mr-grid" ${s}>\n${this.compileChildren(node.children)}\n</div>`;
  }

  Card(node) {
    const m   = this.mods(node);
    const cls = this.cls('mr-card', node);
    const { background, color: clr, padding } = node.props || {};
    const s   = this.style({ background: this.color(background), color: this.color(clr), padding: padding ? padding + 'px' : null });
    return `<div class="${cls}" ${s}>\n${this.compileChildren(node.children)}\n</div>`;
  }

  Box(node) {
    return `<div class="mr-box">\n${this.compileChildren(node.children)}\n</div>`;
  }

  List(node) {
    const { type } = node.props || {};
    const tag = type === 'ordered' ? 'ol' : 'ul';
    return `<${tag} class="mr-list">${this.compileChildren(node.children)}</${tag}>`;
  }

  Form(node) {
    const { action, method, id } = node.props || {};
    return `<form class="mr-form" action="${action || '#'}" method="${method || 'post'}" id="${id || 'mr-form'}">\n${this.compileChildren(node.children)}\n</form>`;
  }

  // ── NAV HELPERS ────────────────────────────────────────────────────────────

  Logo(node) {
    const { label } = node.props || {};
    return `<div class="mr-nav-logo">${this.esc(label || 'Mr.easy')}</div>`;
  }

  Links(node) {
    const items = node.props?.items || [];
    const childLinks = this.compileChildren(node.children);
    const itemLinks  = items.map(it =>
      `<a class="mr-nav-item" href="#${it.toLowerCase()}">${this.esc(it)}</a>`
    ).join('\n');
    return `<div class="mr-nav-links">${itemLinks}${childLinks}</div>`;
  }

  Menu(node) {
    const items = node.props?.items || [];
    return items.map(it =>
      `<a class="mr-nav-item" href="#${it.toLowerCase()}">${this.esc(it)}</a>`
    ).join('\n');
  }

  // ── TEXT NODES ─────────────────────────────────────────────────────────────

  Title(node) {
    const { label, color: clr, align } = node.props || {};
    const m   = this.mods(node);
    const tag = m.includes('big') ? 'h1' : m.includes('medium') ? 'h2' : m.includes('small') ? 'h3' : 'h2';
    const s   = this.style({ color: this.color(clr), 'text-align': m.includes('center') ? 'center' : align });
    const cls = this.cls('mr-title', node);
    return `<${tag} class="${cls}" ${s}>${this.vars_(label)}</${tag}>`;
  }

  Subtitle(node) {
    const { label, color: clr, align } = node.props || {};
    const m = this.mods(node);
    const s = this.style({ color: this.color(clr), 'text-align': m.includes('center') ? 'center' : align });
    return `<p class="mr-subtitle" ${s}>${this.vars_(label)}</p>`;
  }

  Text(node) {
    const { label, color: clr, size, align, weight } = node.props || {};
    const m = this.mods(node);
    const s = this.style({
      color: this.color(clr),
      'text-align': m.includes('center') ? 'center' : align,
      'font-size': size ? size + 'px' : null,
      'font-weight': m.includes('bold') ? '700' : weight
    });
    return `<p class="mr-text" ${s}>${this.vars_(label)}</p>`;
  }

  Label(node) {
    const { label, for: f } = node.props || {};
    return `<label class="mr-label" for="${f || ''}">${this.vars_(label)}</label>`;
  }

  Item(node) {
    const { label } = node.props || {};
    return `<li class="mr-item">${this.vars_(label)}</li>`;
  }

  // ── INTERACTIVE ────────────────────────────────────────────────────────────

  Button(node) {
    const { label, action, id } = node.props || {};
    const cls     = this.cls('mr-button', node);
    const onClick = action ? `onclick="${this.resolveAction(action)}"` : '';
    return `<button class="${cls}" ${onClick} id="${id || ''}">${this.esc(label || 'Button')}</button>`;
  }

  Link(node) {
    const { label, url, target, color: clr } = node.props || {};
    const s = this.style({ color: this.color(clr) });
    return `<a class="mr-link" href="${url || '#'}" target="${target || '_self'}" ${s}>${this.esc(label || url || 'Link')}</a>`;
  }

  Image(node) {
    const { label, src, width, height, alt } = node.props || {};
    const cls = this.cls('mr-image', node);
    const s   = this.style({ width: width ? width + 'px' : null, height: height ? height + 'px' : null });
    return `<img class="${cls}" src="${this.esc(src || label || '')}" alt="${this.esc(alt || label || '')}" ${s}>`;
  }

  Video(node) {
    const { label, src, width, height } = node.props || {};
    const s = this.style({ width: width ? width + 'px' : null, height: height ? height + 'px' : null });
    const m = this.mods(node);
    return `<video class="mr-video" src="${this.esc(src || label || '')}" controls ${m.includes('autoplay') ? 'autoplay muted' : ''} ${s}></video>`;
  }

  Icon(node) {
    const { label, size, color: clr } = node.props || {};
    const ic = iconMap[label] || `fa-${label || 'star'}`;
    const s  = this.style({ color: this.color(clr), 'font-size': size ? size + 'px' : null });
    return `<i class="mr-icon fa ${ic}" ${s}></i>`;
  }

  Input(node) {
    const { type, placeholder, id, name, value } = node.props || {};
    const m = this.mods(node);
    return `<input class="mr-input" type="${type || 'text'}" placeholder="${this.esc(placeholder || '')}" id="${id || ''}" name="${name || id || ''}" ${m.includes('required') ? 'required' : ''} value="${this.esc(value || '')}">`;
  }

  Spacer(node) {
    const { size } = node.props || {};
    return `<div class="mr-spacer" style="height:${size ? size + 'px' : '40px'}"></div>`;
  }

  // ── LOGIC ──────────────────────────────────────────────────────────────────

  Set(node) {
    const { name, value } = node.props || {};
    if (name) this.vars[name] = value;
    return '';
  }

  Repeat(node) {
    const count = parseInt(node.props?.count || 1);
    let out = '';
    for (let i = 0; i < count; i++) {
      this.vars['index']  = i + 1;
      this.vars['index0'] = i;
      out += this.compileChildren(node.children);
    }
    return out;
  }

  ComponentDef(node) {
    const { label } = node.props || {};
    if (label) this.components[label] = node.children;
    return '';
  }

  Use(node) {
    const { label } = node.props || {};
    if (label && this.components[label]) return this.compileChildren(this.components[label]);
    return `<!-- component "${label}" not found -->`;
  }

  FunctionDef(node) {
    const { label } = node.props || {};
    if (label) this.functions[label] = node.children;
    return '';
  }

  Call(node) {
    const { label } = node.props || {};
    if (label && this.functions[label]) return this.compileChildren(this.functions[label]);
    return '';
  }

  Animate(node) {
    const { label: effect, target, delay } = node.props || {};
    this.extraJS.push(`
document.querySelectorAll('${target ? '#' + target : '.mr-animate'}').forEach(function(el) {
  el.classList.add('mr-anim-${effect || 'float'}');
  if ('${delay}') el.style.animationDelay = '${delay}ms';
});`);
    return '';
  }

  // ── UTILITY ────────────────────────────────────────────────────────────────

  resolveAction(action) {
    if (!action) return '';
    const shortcuts = {
      alert:  `alert('Hello from MR.easy! 👋')`,
      scroll: `window.scrollTo({top:0,behavior:'smooth'})`,
      top:    `window.scrollTo({top:0,behavior:'smooth'})`,
    };
    if (shortcuts[action]) return shortcuts[action];
    if (action.startsWith('alert(')) return action;
    if (action.startsWith('go:'))   return `window.location.href='${action.slice(3)}'`;
    return action;
  }
}

module.exports = { Compiler };
