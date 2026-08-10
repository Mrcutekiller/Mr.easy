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
      case 'nav':         return this.Nav(node);
      case 'hero':        return this.Hero(node);
      case 'section':     return this.Section(node);
      case 'header':      return this.Header(node);
      case 'footer':      return this.Footer(node);
      case 'row':         return this.Row(node);
      case 'column':      return this.Column(node);
      case 'grid':        return this.Grid(node);
      case 'card':        return this.Card(node);
      case 'box':         return this.Box(node);
      case 'list':        return this.List(node);
      case 'form':        return this.Form(node);
      case 'title':       return this.Title(node);
      case 'subtitle':    return this.Subtitle(node);
      case 'text':        return this.Text(node);
      case 'label':       return this.Label(node);
      case 'item':        return this.Item(node);
      case 'button':      return this.Button(node);
      case 'link':        return this.Link(node);
      case 'links':       return this.Links(node);
      case 'logo':        return this.Logo(node);
      case 'menu':        return this.Menu(node);
      case 'image':       return this.Image(node);
      case 'video':       return this.Video(node);
      case 'icon':        return this.Icon(node);
      case 'input':       return this.Input(node);
      case 'divider':     return `<hr class="mr-divider">`;
      case 'spacer':      return this.Spacer(node);
      case 'set':         return this.Set(node);
      case 'repeat':      return this.Repeat(node);
      case 'component':   return this.ComponentDef(node);
      case 'use':         return this.Use(node);
      case 'function':    return this.FunctionDef(node);
      case 'call':        return this.Call(node);
      case 'animate':     return this.Animate(node);
      // ── NEW v2.0 ─────────────────────────────────────────────────
      case 'accordion':   return this.Accordion(node);
      case 'tabs':        return this.Tabs(node);
      case 'tab':         return this.Tab(node);
      case 'table':       return this.Table(node);
      case 'thead':       return `<thead class="mr-thead">${this.compileChildren(node.children)}</thead>`;
      case 'tbody':       return `<tbody>${this.compileChildren(node.children)}</tbody>`;
      case 'tr':          return `<tr class="mr-tr">${this.compileChildren(node.children)}</tr>`;
      case 'th':          return this.TH(node);
      case 'td':          return this.TD(node);
      case 'badge':       return this.Badge(node);
      case 'tag':         return this.Tag(node);
      case 'alert':       return this.Alert(node);
      case 'progress':    return this.Progress(node);
      case 'avatar':      return this.Avatar(node);
      case 'quote':       return this.Quote(node);
      case 'codeblock':   return this.CodeBlock(node);
      case 'stat':        return this.Stat(node);
      case 'select':      return this.Select(node);
      case 'checkbox':    return this.Checkbox(node);
      case 'toggle':      return this.Toggle(node);
      case 'embed':       return this.Embed(node);
      case 'rating':      return this.Rating(node);
      case 'countdown':   return this.Countdown(node);
      case 'steps':       return this.Steps(node);
      case 'step':        return this.Step(node);
      case 'testimonial': return this.Testimonial(node);
      case 'page':        return this.Page(node);
      case 'sidebar':     return this.Sidebar(node);
      case 'modal':       return this.Modal(node);
      case 'dropdown':    return this.Dropdown(node);
      default:            return '';
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

  // ── PAGE (sets global theme/color/font) ─────────────────────────────────
  Page(node) {
    const { primary, font, theme, background } = node.props || {};
    let css = ':root {';
    if (primary) css += `--mr-primary:${this.color(primary) || primary};--mr-secondary:${this.color(primary) || primary};`;
    if (font)    css += `--mr-font:'${font}',system-ui,sans-serif;`;
    if (background) css += `} body { background:${this.color(background) || background};`;
    css += '}';
    if (theme === 'light') {
      css += 'body{background:#f8fafc;color:#0f172a;}.mr-card{background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.08);}.mr-nav{background:rgba(248,250,252,0.9);}.mr-text,.mr-muted{color:#475569;}.mr-subtitle{color:#64748b;}';
      this.pageStyle.light = true;
    }
    this.extraCSS.push(`<style>${css}</style>`);
    return '';
  }

  // ── ACCORDION (expandable sections) ─────────────────────────────────────
  Accordion(node) {
    const id = `acc_${Math.random().toString(36).slice(2,7)}`;
    const { label } = node.props || {};
    const body = this.compileChildren(node.children);
    return `<div class="mr-accordion">
  <button class="mr-accordion-btn" onclick="mrToggle('${id}')">
    ${this.esc(label || 'Click to expand')}
    <span class="mr-accordion-icon">▾</span>
  </button>
  <div class="mr-accordion-body" id="${id}">${body}</div>
</div>`;
  }

  // ── TABS ─────────────────────────────────────────────────────────────────
  Tabs(node) {
    const id = `tabs_${Math.random().toString(36).slice(2,7)}`;
    const tabs = (node.children || []).filter(c => c.type === 'tab');
    const btns = tabs.map((t, i) =>
      `<button class="mr-tab-btn${i===0?' active':''}" onclick="mrTab('${id}',${i})" id="${id}_btn_${i}">${this.esc(t.props?.label || `Tab ${i+1}`)}</button>`
    ).join('');
    const panes = tabs.map((t, i) =>
      `<div class="mr-tab-pane${i===0?' active':''}" id="${id}_pane_${i}">${this.compileChildren(t.children)}</div>`
    ).join('');
    this.extraJS.push(`function mrTab(id,idx){document.querySelectorAll('#'+id+' .mr-tab-btn').forEach((b,i)=>{b.classList.toggle('active',i===idx)});document.querySelectorAll('#'+id+' .mr-tab-pane').forEach((p,i)=>{p.classList.toggle('active',i===idx)});}`);
    return `<div class="mr-tabs" id="${id}"><div class="mr-tab-bar">${btns}</div><div class="mr-tab-content">${panes}</div></div>`;
  }

  Tab(node) { return this.compileChildren(node.children); }

  // ── TABLE ─────────────────────────────────────────────────────────────────
  Table(node) {
    const inner = this.compileChildren(node.children);
    return `<div class="mr-table-wrapper"><table class="mr-table">${inner}</table></div>`;
  }

  TH(node) {
    const { label } = node.props || {};
    return `<th class="mr-th">${this.esc(this.vars_(label))}</th>`;
  }

  TD(node) {
    const { label } = node.props || {};
    return `<td class="mr-td">${this.esc(this.vars_(label))}</td>`;
  }

  // ── BADGE ─────────────────────────────────────────────────────────────────
  Badge(node) {
    const { label, color: clr } = node.props || {};
    const m = this.mods(node);
    const col = this.color(clr) || (m.includes('green') ? '#22c55e' : m.includes('red') ? '#ef4444' : m.includes('yellow') ? '#eab308' : m.includes('blue') ? '#3b82f6' : null);
    const s = col ? `style="background:${col}20;color:${col};border-color:${col}40;"` : '';
    return `<span class="mr-badge" ${s}>${this.esc(label || '')}</span>`;
  }

  // ── TAG ───────────────────────────────────────────────────────────────────
  Tag(node) {
    const { label } = node.props || {};
    return `<span class="mr-tag">#${this.esc(label || '')}</span>`;
  }

  // ── ALERT ─────────────────────────────────────────────────────────────────
  Alert(node) {
    const { label, type } = node.props || {};
    const m    = this.mods(node);
    const kind = type || m.find(x => ['success','warning','error','info'].includes(x)) || 'info';
    const icons = { success:'✓', warning:'⚠', error:'✕', info:'ℹ' };
    return `<div class="mr-alert mr-alert-${kind}"><span class="mr-alert-icon">${icons[kind]||'ℹ'}</span><span>${this.esc(label || '')}</span></div>`;
  }

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  Progress(node) {
    const { value, label, color: clr } = node.props || {};
    const pct = Math.min(100, Math.max(0, parseInt(value || 0)));
    const col = this.color(clr) || 'var(--mr-primary)';
    return `<div class="mr-progress-wrap">${label ? `<div class="mr-progress-label"><span>${this.esc(label)}</span><span>${pct}%</span></div>` : ''}<div class="mr-progress-bar"><div class="mr-progress-fill" style="width:${pct}%;background:${col};"></div></div></div>`;
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  Avatar(node) {
    const { src, label, size } = node.props || {};
    const sz = size ? size + 'px' : '64px';
    const s = `width:${sz};height:${sz};`;
    if (src) return `<img class="mr-avatar" src="${this.esc(src)}" alt="${this.esc(label || '')}" style="${s}">`;
    const initials = (label || 'A').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="mr-avatar mr-avatar-initials" style="${s}">${initials}</div>`;
  }

  // ── QUOTE / TESTIMONIAL ───────────────────────────────────────────────────
  Quote(node) {
    const { label, author } = node.props || {};
    const body = this.compileChildren(node.children);
    return `<blockquote class="mr-quote"><p class="mr-quote-text">"${this.vars_(label || '')}"</p>${body}${author ? `<cite class="mr-quote-author">— ${this.esc(author)}</cite>` : ''}</blockquote>`;
  }

  Testimonial(node) {
    const { label, author, role } = node.props || {};
    const body = this.compileChildren(node.children);
    return `<div class="mr-testimonial"><p class="mr-testimonial-text">"${this.vars_(label || '')}"</p>${body}<div class="mr-testimonial-author"><strong>${this.esc(author || '')}</strong>${role ? `<span>${this.esc(role)}</span>` : ''}</div></div>`;
  }

  // ── CODE BLOCK ────────────────────────────────────────────────────────────
  CodeBlock(node) {
    const { label, lang } = node.props || {};
    const m = this.mods(node);
    const isInline = m.includes('inline');
    if (isInline) return `<code class="mr-code-inline">${this.esc(label || '')}</code>`;
    return `<pre class="mr-code-block"><code class="mr-code-lang-${this.esc(lang || 'text')}">${this.esc(label || '')}</code></pre>`;
  }

  // ── STAT ──────────────────────────────────────────────────────────────────
  Stat(node) {
    const { label, value, icon } = node.props || {};
    const ic = icon ? `<i class="mr-icon fa fa-${icon}" style="margin-bottom:8px;"></i>` : '';
    return `<div class="mr-stat">${ic}<div class="mr-stat-value">${this.esc(value || label || '0')}</div>${label && value ? `<div class="mr-stat-label">${this.esc(label)}</div>` : ''}</div>`;
  }

  // ── SELECT ────────────────────────────────────────────────────────────────
  Select(node) {
    const { label, id, name } = node.props || {};
    const items = (node.props?.items || []).map(it => `<option value="${this.esc(it)}">${this.esc(it)}</option>`).join('');
    const children = this.compileChildren(node.children);
    return `<select class="mr-input mr-select" id="${id || ''}" name="${name || id || ''}">${items}${children}</select>`;
  }

  // ── CHECKBOX ──────────────────────────────────────────────────────────────
  Checkbox(node) {
    const { label, id, checked } = node.props || {};
    const m = this.mods(node);
    return `<label class="mr-checkbox-wrap"><input type="checkbox" class="mr-checkbox" id="${id || ''}" ${(checked || m.includes('checked')) ? 'checked' : ''}><span class="mr-checkbox-label">${this.esc(label || '')}</span></label>`;
  }

  // ── TOGGLE ────────────────────────────────────────────────────────────────
  Toggle(node) {
    const { label, id } = node.props || {};
    const m = this.mods(node);
    const tid = id || `tog_${Math.random().toString(36).slice(2,7)}`;
    return `<label class="mr-toggle-wrap"><input type="checkbox" class="mr-toggle-input" id="${tid}" ${m.includes('on') ? 'checked' : ''}><span class="mr-toggle-slider"></span>${label ? `<span class="mr-toggle-label">${this.esc(label)}</span>` : ''}</label>`;
  }

  // ── EMBED (YouTube / iframe) ───────────────────────────────────────────────
  Embed(node) {
    const { src, label, width, height } = node.props || {};
    const url = src || label || '';
    // Convert YouTube watch URLs to embed URLs
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : url;
    const h = height || '400';
    return `<div class="mr-embed-wrapper" style="height:${h}px"><iframe class="mr-embed" src="${this.esc(embedUrl)}" width="${width || '100%'}" height="${h}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe></div>`;
  }

  // ── RATING ────────────────────────────────────────────────────────────────
  Rating(node) {
    const { value, max, label } = node.props || {};
    const total = parseInt(max || 5);
    const filled = Math.round(parseFloat(value || 5));
    let stars = '';
    for (let i = 1; i <= total; i++) {
      stars += `<span class="mr-star${i <= filled ? ' filled' : ''}">★</span>`;
    }
    return `<div class="mr-rating">${stars}${label ? `<span class="mr-rating-label">${this.esc(label)}</span>` : ''}</div>`;
  }

  // ── COUNTDOWN ─────────────────────────────────────────────────────────────
  Countdown(node) {
    const { to, label } = node.props || {};
    const id = `cd_${Math.random().toString(36).slice(2,7)}`;
    this.extraJS.push(`(function(){const t=new Date('${to||''}').getTime();if(!t||isNaN(t))return;function upd(){const n=new Date().getTime(),d=t-n;if(d<0){document.getElementById('${id}').innerHTML='<span>Time is up!</span>';return;}const days=Math.floor(d/86400000),hrs=Math.floor((d%86400000)/3600000),min=Math.floor((d%3600000)/60000),sec=Math.floor((d%60000)/1000);document.getElementById('${id}').innerHTML='<div class=\\"mr-cd-unit\\"><span class=\\"mr-cd-num\\">'+days+'</span><span class=\\"mr-cd-lbl\\">Days</span></div><div class=\\"mr-cd-sep\\">:</div><div class=\\"mr-cd-unit\\"><span class=\\"mr-cd-num\\">'+hrs+'</span><span class=\\"mr-cd-lbl\\">Hours</span></div><div class=\\"mr-cd-sep\\">:</div><div class=\\"mr-cd-unit\\"><span class=\\"mr-cd-num\\">'+min+'</span><span class=\\"mr-cd-lbl\\">Mins</span></div><div class=\\"mr-cd-sep\\">:</div><div class=\\"mr-cd-unit\\"><span class=\\"mr-cd-num\\">'+sec+'</span><span class=\\"mr-cd-lbl\\">Secs</span></div>';}upd();setInterval(upd,1000);})();`);
    return `<div class="mr-countdown">${label?`<p class="mr-countdown-title">${this.esc(label)}</p>`:''}<div class="mr-countdown-timer" id="${id}">Loading...</div></div>`;
  }

  // ── STEPS ─────────────────────────────────────────────────────────────────
  Steps(node) {
    return `<div class="mr-steps">${this.compileChildren(node.children)}</div>`;
  }

  Step(node) {
    const { label, number } = node.props || {};
    const m = this.mods(node);
    const n = number || '';
    const body = this.compileChildren(node.children);
    return `<div class="mr-step${m.includes('done')?'  mr-step-done':''}"><div class="mr-step-num">${n}</div><div class="mr-step-body"><div class="mr-step-title">${this.esc(label || '')}</div>${body}</div></div>`;
  }

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  Sidebar(node) {
    const body = this.compileChildren(node.children);
    return `<aside class="mr-sidebar">${body}</aside>`;
  }

  // ── MODAL ──────────────────────────────────────────────────────────────────
  Modal(node) {
    const { label, id } = node.props || {};
    const mid = id || `modal_${Math.random().toString(36).slice(2,7)}`;
    const body = this.compileChildren(node.children);
    this.extraJS.push(`function mrOpenModal(id){document.getElementById(id).classList.add('open');}function mrCloseModal(id){document.getElementById(id).classList.remove('open');}`);
    return `<div class="mr-modal" id="${mid}"><div class="mr-modal-overlay" onclick="mrCloseModal('${mid}')"></div><div class="mr-modal-box"><button class="mr-modal-close" onclick="mrCloseModal('${mid}')">✕</button>${label?`<h2 class="mr-modal-title">${this.esc(label)}</h2>`:''}<div class="mr-modal-body">${body}</div></div></div>`;
  }

  // ── DROPDOWN ───────────────────────────────────────────────────────────────
  Dropdown(node) {
    const { label } = node.props || {};
    const body = this.compileChildren(node.children);
    return `<div class="mr-dropdown"><button class="mr-dropdown-btn">${this.esc(label||'Options')} ▾</button><div class="mr-dropdown-menu">${body}</div></div>`;
  }

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
