/**
 * MR.easy IDE — Editor JavaScript
 * Handles CodeMirror, syntax highlighting, live compile, and all IDE features.
 */

'use strict';

// ── Inline Compiler (browser version) ─────────────────────────────────────────
// We embed a simplified version of the MR.easy compiler directly in the browser

const KEYWORDS = ['nav','hero','section','header','footer','row','column','col',
  'grid','card','box','list','form','title','subtitle','text','label','item',
  'button','link','image','img','video','icon','input','logo','links','menu',
  'divider','spacer','set','repeat','times','if','else','end','show','hide',
  'animate','component','use','function','call'];

const STYLE_WORDS = ['big','medium','small','tiny','glow','shadow','rounded','outline',
  'bold','italic','dark','light','gradient','glass','center','left','right',
  'blue','red','green','purple','orange','pink','yellow','white','black','gray',
  'on','off','float','autoplay','required','ordered'];

// ── CodeMirror Custom Mode ─────────────────────────────────────────────────────
CodeMirror.defineMode('mreasy', function() {
  return {
    startState() { return { inString: false, quote: null }; },

    token(stream, state) {
      // String
      if (state.inString) {
        if (stream.eat(state.quote)) { state.inString = false; return 'mreasy-string'; }
        stream.next();
        return 'mreasy-string';
      }

      // Comment
      if (stream.match(/^#.*/)) return 'mreasy-comment';

      // Skip whitespace
      if (stream.eatSpace()) return null;

      // String start
      const q = stream.peek();
      if (q === '"' || q === "'") {
        stream.next();
        state.inString = true;
        state.quote = q;
        return 'mreasy-string';
      }

      // Number
      if (stream.match(/^\d+(\.\d+)?/)) return 'mreasy-number';

      // Mr.easy declaration
      if (stream.match('Mr.easy')) return 'mreasy-decl';

      // Word — check for property:value
      const wordMatch = stream.match(/^[a-zA-Z_][\w\-]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        // Check if followed by :
        if (stream.peek() === ':') {
          stream.next(); // eat :
          stream.match(/^[\w\-\.#%]+/); // eat value
          return 'mreasy-prop';
        }
        if (KEYWORDS.includes(word))    return 'mreasy-keyword';
        if (STYLE_WORDS.includes(word)) return 'mreasy-modifier';
        return null;
      }

      stream.next();
      return null;
    }
  };
});

// ── Starter Code ──────────────────────────────────────────────────────────────
const STARTER = `Mr.easy "My Amazing Website"

# 👋 Welcome to MR.easy!
# Simple as writing a list. Just type and build!

nav
  logo "MyBrand"
  links Home About Contact

hero
  title "Build Websites Fast" big glow
  subtitle "MR.easy is the simplest way to make beautiful websites"
  spacer size:24
  row center
    button "Get Started" blue big
    button "See Examples" outline

section "features"
  title "Why MR.easy?" medium center
  spacer size:16
  grid cols:3
    card shadow
      icon rocket
      title "Super Fast" small
      text "Build a full website in under 5 minutes"
    card shadow
      icon bolt
      title "Easy to Learn" small
      text "If you can write a list, you can use MR.easy"
    card shadow
      icon heart
      title "Beautiful" small
      text "Every page looks stunning by default"

section "contact"
  title "Get in Touch" medium center
  spacer
  form
    label "Your Name" for:name
    input placeholder:"Your name" id:name
    label "Email" for:email
    input type:email placeholder:"you@email.com" id:email
    button "Send Message" blue

footer
  text "Made with ❤️ using Mr.easy"
`;

// ── IDE State ─────────────────────────────────────────────────────────────────
let editor;
let fontSize    = 14;
let currentView = 'split';
let previewTimeout;

// ── Snippets ──────────────────────────────────────────────────────────────────
const SNIPPETS = [
  { icon: 'fa-file',      label: 'Page Start',  tag: 'decl',    code: 'Mr.easy "Page Title"\n' },
  { icon: 'fa-heading',   label: 'Title',       tag: 'text',    code: 'title "Your Title Here" big glow\n' },
  { icon: 'fa-paragraph', label: 'Text',        tag: 'text',    code: 'text "Your paragraph text goes here"\n' },
  { icon: 'fa-square',    label: 'Button',      tag: 'ui',      code: 'button "Click Me" blue big\n' },
  { icon: 'fa-grip',      label: 'Card',        tag: 'layout',  code: 'card shadow\n  title "Card Title" small\n  text "Card content here"\n' },
  { icon: 'fa-table-cells',label:'Grid 3-col',  tag: 'layout',  code: 'grid cols:3\n  card shadow\n    title "Item 1" small\n    text "Description"\n  card shadow\n    title "Item 2" small\n    text "Description"\n  card shadow\n    title "Item 3" small\n    text "Description"\n' },
  { icon: 'fa-bars',      label: 'Nav Bar',     tag: 'layout',  code: 'nav\n  logo "MySite"\n  links Home About Contact\n' },
  { icon: 'fa-star',      label: 'Hero',        tag: 'layout',  code: 'hero\n  title "Welcome" big glow\n  subtitle "Subtitle text here"\n  button "Get Started" blue big\n' },
  { icon: 'fa-image',     label: 'Image',       tag: 'media',   code: 'image "photo.jpg" rounded shadow\n' },
  { icon: 'fa-link',      label: 'Link',        tag: 'ui',      code: 'link "Visit Google" url:https://google.com\n' },
  { icon: 'fa-list',      label: 'List',        tag: 'content', code: 'list\n  item "First item"\n  item "Second item"\n  item "Third item"\n' },
  { icon: 'fa-envelope',  label: 'Contact Form',tag: 'form',    code: 'form\n  label "Name" for:name\n  input placeholder:"Your name" id:name\n  label "Email" for:email\n  input type:email placeholder:"Email" id:email\n  button "Submit" blue\n' },
  { icon: 'fa-circle-info',label:'Icon + Text', tag: 'content', code: 'row\n  icon star\n  text "Your text here"\n' },
  { icon: 'fa-minus',     label: 'Divider',     tag: 'layout',  code: 'divider\n' },
  { icon: 'fa-arrows-up-down', label:'Spacer',  tag: 'layout',  code: 'spacer size:40\n' },
  { icon: 'fa-rotate',    label: 'Repeat',      tag: 'logic',   code: 'repeat 3 times\n  card shadow\n    text "Item {index}"\n' },
];

const EXAMPLES = [
  { icon: 'fa-globe',    label: 'Landing Page',   code: `Mr.easy "Awesome Landing"\n\nnav\n  logo "ACME"\n  links Home Pricing About\n\nhero\n  title "The Future Is Here" big glow\n  subtitle "We build next-generation solutions for modern businesses"\n  spacer size:24\n  row center\n    button "Start Free Trial" blue big\n    button "Watch Demo" outline\n\nsection "features"\n  title "Everything You Need" medium center\n  spacer\n  grid cols:3\n    card shadow\n      icon rocket\n      title "Lightning Fast" small\n      text "Deploy in seconds, not hours"\n    card shadow\n      icon lock\n      title "Secure by Default" small\n      text "Enterprise-grade security built in"\n    card shadow\n      icon globe\n      title "Global Scale" small\n      text "Reach users anywhere in the world"\n\nfooter\n  text "© 2024 ACME Corp. All rights reserved."\n` },
  { icon: 'fa-user',     label: 'Portfolio',       code: `Mr.easy "John's Portfolio"\n\nnav\n  logo "John Doe"\n  links Work About Contact\n\nhero\n  title "Hello, I'm John" big glow\n  subtitle "Full-stack developer & designer creating beautiful digital experiences"\n  spacer size:20\n  button "See My Work" blue big\n\nsection "work"\n  title "My Projects" medium center\n  spacer\n  grid cols:3\n    card shadow\n      title "Project One" small\n      text "A beautiful web application built with modern tech"\n      spacer size:12\n      button "View Project" outline small\n    card shadow\n      title "Project Two" small\n      text "Mobile app with 100k+ downloads"\n      spacer size:12\n      button "View Project" outline small\n    card shadow\n      title "Project Three" small\n      text "Open-source tool used by thousands"\n      spacer size:12\n      button "View Project" outline small\n\nfooter\n  text "✉️ john@example.com"\n` },
  { icon: 'fa-shop',     label: 'Product Page',    code: `Mr.easy "ShopEasy"\n\nnav\n  logo "ShopEasy"\n  links Products Deals About Cart\n\nhero\n  title "Shop Smarter" big glow\n  subtitle "Discover amazing products at unbeatable prices"\n  button "Browse Now" blue big\n\nsection "products"\n  title "Featured Products" medium center\n  spacer\n  grid cols:4\n    card shadow\n      title "Product 1" small\n      text "High quality item"\n      spacer size:8\n      button "Buy Now" blue small\n    card shadow\n      title "Product 2" small\n      text "Best seller"\n      spacer size:8\n      button "Buy Now" blue small\n    card shadow\n      title "Product 3" small\n      text "New arrival"\n      spacer size:8\n      button "Buy Now" blue small\n    card shadow\n      title "Product 4" small\n      text "Limited edition"\n      spacer size:8\n      button "Buy Now" blue small\n\nfooter\n  text "Free shipping on orders over $50"\n` },
  { icon: 'fa-blog',     label: 'Blog Post',       code: `Mr.easy "My Blog"\n\nnav\n  logo "MyBlog"\n  links Home Articles About\n\nsection "post"\n  title "How I Built This in 5 Minutes" big\n  subtitle "A step-by-step guide using MR.easy"\n  divider\n  text "This is the introduction paragraph of our blog post. MR.easy makes web development incredibly simple and fast."\n  spacer\n  title "Getting Started" medium\n  text "First, install MR.easy using the installer. Then create a new file and start writing!"\n  spacer\n  list\n    item "Install MR.easy on your computer"\n    item "Create a new .mreasy file"\n    item "Start with: Mr.easy \\"Your Page\\""\n    item "Run mreasy run to see live preview"\n  spacer\n  button "Read More" outline\n\nfooter\n  text "Thanks for reading! Share if you found this helpful 🙌"\n` },
];

// ── Initialize ─────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initEditor();
  buildSidebar();
  setViewMode('split');

  // Initial compile
  setTimeout(() => compileAndPreview(), 100);
});

function initEditor() {
  const container = document.getElementById('codemirror-container');
  editor = CodeMirror(container, {
    value: STARTER,
    mode: 'mreasy',
    theme: 'default',
    lineNumbers: true,
    lineWrapping: false,
    autofocus: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    extraKeys: {
      'Tab': cm => {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.replaceSelection('  ', 'end');
      },
      'Ctrl-Enter': () => compileAndPreview(),
      'Ctrl-S': () => { compileAndPreview(); showToast('✓ Compiled & saved'); },
    }
  });

  editor.on('change', () => {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(compileAndPreview, 120);
    markUnsaved();
  });

  editor.on('cursorActivity', () => {
    const cur = editor.getCursor();
    document.getElementById('line-col').textContent = `Ln ${cur.line + 1}, Col ${cur.ch + 1}`;
  });
}

// ── Build Sidebar ─────────────────────────────────────────────────────────────
function buildSidebar() {
  const snippetList = document.getElementById('snippet-list');
  SNIPPETS.forEach(s => {
    const el = document.createElement('div');
    el.className = 'snippet-item';
    el.innerHTML = `<i class="fa ${s.icon}"></i><span>${s.label}</span><span class="snippet-tag">${s.tag}</span>`;
    el.onclick = () => insertSnippet(s.code);
    snippetList.appendChild(el);
  });

  const exampleList = document.getElementById('example-list');
  EXAMPLES.forEach(ex => {
    const el = document.createElement('div');
    el.className = 'example-item';
    el.innerHTML = `<i class="fa ${ex.icon}"></i><span>${ex.label}</span>`;
    el.onclick = () => { editor.setValue(ex.code); compileAndPreview(); };
    exampleList.appendChild(el);
  });
}

// ── Compile & Preview ─────────────────────────────────────────────────────────
function compileAndPreview() {
  const source = editor.getValue();
  const chars  = source.length;
  document.getElementById('sb-chars').textContent = `${chars} chars`;

  try {
    const html = browserCompile(source);
    const frame = document.getElementById('preview-frame');
    frame.srcdoc = html;
    document.getElementById('preview-status').textContent = 'Live Preview ✓';
    document.getElementById('status-dot').style.background = '#22c55e';
    document.getElementById('status-dot').style.boxShadow = '0 0 6px #22c55e';
    document.getElementById('sb-errors').textContent = '';
    markSaved();
  } catch (err) {
    document.getElementById('preview-status').textContent = 'Error';
    document.getElementById('status-dot').style.background = '#ef4444';
    document.getElementById('status-dot').style.boxShadow = '0 0 6px #ef4444';
    document.getElementById('sb-errors').textContent = '⚠ ' + err.message.slice(0, 60);
  }
}

// ── Browser-side MR.easy Compiler (self-contained) ───────────────────────────
function browserCompile(source) {
  // Validate starts with Mr.easy
  const trimmed = source.trimStart();
  if (!trimmed.startsWith('Mr.easy')) {
    throw new Error('File must start with: Mr.easy "Your Title"');
  }

  const lines  = source.split('\n');
  const html   = compileLines(lines);
  return wrapPage(html.title, html.body);
}

function compileLines(lines) {
  let title  = 'MR.easy Page';
  let body   = '';
  let i      = 0;
  let vars   = {};

  // Parse Mr.easy declaration
  const firstLine = lines[0]?.trim() || '';
  const titleMatch = firstLine.match(/^Mr\.easy\s+"([^"]+)"/);
  if (titleMatch) title = titleMatch[1];
  i = 1;

  function getIndent(line) {
    const m = line.match(/^(\s+)/);
    return m ? m[1].length : 0;
  }

  function parseSectionLines(baseIndent) {
    let out = '';
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) { i++; continue; }
      const ind = getIndent(line);
      if (ind < baseIndent) break;

      const compiled = compileLine(trimmed, ind, baseIndent);
      if (compiled !== null) { out += compiled; i++; } else break;
    }
    return out;
  }

  function compileLine(line, ind, baseIndent) {
    const tokens = tokenizeLine(line);
    if (!tokens.length) return '';
    const kw = tokens[0].toLowerCase();

    // Block elements
    const blocks = ['nav','hero','section','header','footer','row','column','col','grid','card','box','list','form'];
    if (blocks.includes(kw)) {
      i++;
      const children = parseSectionLines(ind + 2);
      return renderBlock(kw, tokens.slice(1), children);
    }

    // Inline elements
    return renderInline(kw, tokens.slice(1), vars) + '\n';
  }

  body = parseSectionLines(0);

  function tokenizeLine(line) {
    const tokens = [];
    let s = line.trim();
    while (s) {
      if (s[0] === '"') {
        const end = s.indexOf('"', 1);
        tokens.push(s.slice(1, end === -1 ? undefined : end));
        s = end === -1 ? '' : s.slice(end + 1).trim();
      } else {
        const ws = s.search(/\s/);
        tokens.push(ws === -1 ? s : s.slice(0, ws));
        s = ws === -1 ? '' : s.slice(ws).trim();
      }
    }
    return tokens;
  }

  function getProp(tokens, key) {
    const t = tokens.find(t => t.startsWith(key + ':'));
    return t ? t.split(':').slice(1).join(':') : null;
  }

  function getLabel(tokens) {
    return tokens.find(t => !t.includes(':') && !STYLE_WORDS.includes(t.toLowerCase()) && !KEYWORDS.includes(t.toLowerCase()));
  }

  function hasMod(tokens, ...mods) {
    return mods.some(m => tokens.map(t => t.toLowerCase()).includes(m));
  }

  const COLOR_MAP = { blue:'#3b82f6', purple:'#8b5cf6', green:'#22c55e', red:'#ef4444', orange:'#f97316', pink:'#ec4899', yellow:'#eab308', white:'#fff', black:'#0f172a', gray:'#6b7280', cyan:'#06b6d4' };
  const ICON_MAP  = { star:'fa-star', heart:'fa-heart', rocket:'fa-rocket', bolt:'fa-bolt', globe:'fa-globe', lock:'fa-lock', home:'fa-house', user:'fa-user', mail:'fa-envelope', check:'fa-check', code:'fa-code', fire:'fa-fire', diamond:'fa-gem', moon:'fa-moon', sun:'fa-sun', phone:'fa-phone', settings:'fa-gear', download:'fa-download', upload:'fa-upload', share:'fa-share-nodes', chat:'fa-comments', info:'fa-circle-info', warn:'fa-triangle-exclamation' };
  const SIZE_MAP  = ['big','medium','small','tiny'];

  function btnColor(tokens) {
    const colors = ['blue','purple','green','red','orange','pink','yellow','cyan'];
    const c = tokens.find(t => colors.includes(t.toLowerCase()));
    return c ? { background: `linear-gradient(135deg, ${COLOR_MAP[c] || c}, ${COLOR_MAP[c] || c}cc)`, boxShadow: `0 4px 15px ${COLOR_MAP[c]}55` } : null;
  }

  function renderBlock(type, tokens, children) {
    const label = getLabel(tokens) || '';
    const id    = (label || type).replace(/\s+/g, '-').toLowerCase();
    const bg    = getProp(tokens, 'background') || getProp(tokens, 'bg');
    const cols  = getProp(tokens, 'cols');
    const gap   = getProp(tokens, 'gap');

    switch (type) {
      case 'nav':
        return `<nav class="mr-nav" style="${bg?'background:'+bg:''}">${children}</nav>`;
      case 'hero':
        return `<div class="mr-hero"><div class="mr-hero-inner">${children}</div></div>`;
      case 'section':
        return `<section id="${id}" class="mr-section" ${bg?`style="background:${bg}"`:''} >${children}</section>`;
      case 'header':
        return `<div class="mr-header">${children}</div>`;
      case 'footer':
        return `<footer class="mr-footer">${children}</footer>`;
      case 'row':
        const jc = hasMod(tokens,'center') ? 'justify-content:center;' : '';
        const gapR = gap ? `gap:${gap}px;` : '';
        return `<div class="mr-row" style="${jc}${gapR}">${children}</div>`;
      case 'column':
      case 'col':
        return `<div class="mr-column">${children}</div>`;
      case 'grid':
        const gridCols = cols ? `grid-template-columns:repeat(${cols},1fr);` : '';
        const gridGap  = gap ? `gap:${gap}px;` : '';
        return `<div class="mr-grid" style="${gridCols}${gridGap}">${children}</div>`;
      case 'card':
        const glassC = hasMod(tokens,'glass') ? ' glass' : '';
        return `<div class="mr-card${glassC}" ${bg?`style="background:${bg}"`:''} >${children}</div>`;
      case 'box':
        return `<div class="mr-box">${children}</div>`;
      case 'list':
        return `<ul class="mr-list">${children}</ul>`;
      case 'form':
        return `<form class="mr-form" onsubmit="return false">${children}</form>`;
      default:
        return `<div>${children}</div>`;
    }
  }

  function renderInline(type, tokens, vars) {
    const label   = getLabel(tokens) || '';
    const colorT  = tokens.find(t => COLOR_MAP[t.toLowerCase()]);
    const color   = getProp(tokens, 'color') || (colorT ? COLOR_MAP[colorT.toLowerCase()] : null);
    const size    = tokens.find(t => SIZE_MAP.includes(t.toLowerCase()));
    const hasProp = (k) => getProp(tokens, k);

    switch(type) {
      case 'title': {
        const tag   = size === 'big' ? 'h1' : size === 'medium' ? 'h2' : size === 'small' ? 'h3' : 'h2';
        const glow  = hasMod(tokens,'glow');
        const cls   = `mr-title${size ? ' mr-title-size-'+size : ''}${glow ? ' mr-glow' : ''}`;
        const st    = color ? `color:${color}` : '';
        return `<${tag} class="${cls}" ${st?`style="${st}"`:''}>${label}</${tag}>`;
      }
      case 'subtitle':
        return `<p class="mr-subtitle" ${color?`style="color:${color}"`:''}>${label}</p>`;
      case 'text':
        return `<p class="mr-text" ${color?`style="color:${color}"`:''}>${label}</p>`;
      case 'label':
        return `<label class="mr-label" for="${hasProp('for')||''}">${label}</label>`;
      case 'item':
        return `<li class="mr-item">${label}</li>`;
      case 'button': {
        const bc  = btnColor(tokens);
        const siz = size === 'big' ? 'mr-btn-big' : size === 'small' ? 'mr-btn-small' : '';
        const out = hasMod(tokens,'outline') ? 'mr-btn-outline' : '';
        const cls = `mr-button ${siz} ${out}`.trim();
        const act = hasProp('action') || '';
        const st  = bc && !out ? `background:${bc.background};box-shadow:${bc.boxShadow}` : '';
        return `<button class="${cls}" ${st?`style="${st}"`:''}  onclick="${act ? resolveAction(act) : 'void 0'}" >${label || 'Button'}</button>`;
      }
      case 'link': {
        const url = hasProp('url') || '#';
        return `<a class="mr-link" href="${url}" ${color?`style="color:${color}"`:''}>${label || url}</a>`;
      }
      case 'image': {
        const src = hasProp('src') || label || '';
        const rnd = hasMod(tokens,'rounded') ? ' mr-rounded' : '';
        const shd = hasMod(tokens,'shadow') ? ' mr-shadow' : '';
        const w   = hasProp('width'); const h = hasProp('height');
        const imgStyle = (w || h) ? 'style="' + (w ? 'width:'+w+'px;' : '') + (h ? 'height:'+h+'px;' : '') + '"' : '';
        return '<img class="mr-image' + rnd + shd + '" src="' + src + '" alt="' + (label || '') + '" ' + imgStyle + '/>';
      }
      case 'icon': {
        const ic = ICON_MAP[label.toLowerCase()] || `fa-${label.toLowerCase() || 'star'}`;
        const sz = hasProp('size');
        return `<i class="mr-icon fa ${ic}" ${color||sz?`style="${color?'color:'+color+';':''}${sz?'font-size:'+sz+'px;':''}"`:''}></i>`;
      }
      case 'input': {
        const t   = hasProp('type') || 'text';
        const ph  = hasProp('placeholder') || label || '';
        const id  = hasProp('id') || '';
        return `<input class="mr-input" type="${t}" placeholder="${ph}" id="${id}" name="${id}">`;
      }
      case 'logo':
        return `<div class="mr-nav-logo">${label}</div>`;
      case 'links': {
        // Remaining tokens after 'links' are link names
        return `<div class="mr-nav-links">${tokens.filter(t=>!t.includes(':')).map(it => `<a class="mr-nav-item" href="#${it.toLowerCase()}">${it}</a>`).join('')}</div>`;
      }
      case 'divider':
        return `<hr class="mr-divider">`;
      case 'spacer': {
        const sz = hasProp('size') || '40';
        return `<div class="mr-spacer" style="height:${sz}px"></div>`;
      }
      case 'video': {
        const src = hasProp('src') || label || '';
        return `<video class="mr-video" src="${src}" controls></video>`;
      }
      default:
        return '';
    }
  }

  function resolveAction(a) {
    if (!a) return 'void 0';
    if (a === 'alert') return "alert('Hello from MR.easy! 👋')";
    if (a === 'scroll' || a === 'top') return "window.scrollTo({top:0,behavior:'smooth'})";
    if (a.startsWith('alert(')) return a;
    if (a.startsWith('go:')) return `window.location.href='${a.slice(3)}'`;
    return `void 0`;
  }

  return { title, body };
}

// ── Page Wrapper ──────────────────────────────────────────────────────────────
function wrapPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--mr-primary:#6366f1;--mr-secondary:#8b5cf6;--mr-accent:#06b6d4;--mr-dark:#0f172a;--mr-dark2:#1e293b;--mr-text:#e2e8f0;--mr-muted:#94a3b8;--mr-border:rgba(255,255,255,0.1);--mr-glass:rgba(255,255,255,0.05);--mr-radius:16px;--mr-shadow:0 25px 50px rgba(0,0,0,0.4);--mr-font:'Inter',system-ui,sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--mr-font);background:var(--mr-dark);color:var(--mr-text);line-height:1.6;min-height:100vh;overflow-x:hidden}
.mr-nav{display:flex;align-items:center;justify-content:space-between;padding:20px 60px;position:sticky;top:0;z-index:1000;background:rgba(15,23,42,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--mr-border)}
.mr-nav-logo{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,var(--mr-primary),var(--mr-accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.mr-nav-links{display:flex;gap:32px;align-items:center}
.mr-nav-item{color:var(--mr-muted);text-decoration:none;font-weight:500;transition:color 0.2s;cursor:pointer}
.mr-nav-item:hover{color:var(--mr-text)}
.mr-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px;min-height:90vh;position:relative;overflow:hidden}
.mr-hero::before{content:'';position:absolute;width:800px;height:800px;background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%);top:-200px;left:50%;transform:translateX(-50%);pointer-events:none}
.mr-hero-inner{position:relative;z-index:1}
.mr-section{padding:80px 60px;max-width:1200px;margin:0 auto}
.mr-header{padding:60px;text-align:center}
.mr-footer{padding:60px;text-align:center;border-top:1px solid var(--mr-border);color:var(--mr-muted);background:var(--mr-dark2)}
.mr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.mr-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.mr-column{display:flex;flex-direction:column;gap:16px}
.mr-card{background:var(--mr-glass);border:1px solid var(--mr-border);border-radius:var(--mr-radius);padding:32px;backdrop-filter:blur(10px);transition:transform 0.3s,box-shadow 0.3s,border-color 0.3s}
.mr-card:hover{transform:translateY(-4px);border-color:rgba(99,102,241,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.3)}
.mr-card.glass{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)}
.mr-box{background:var(--mr-dark2);border-radius:var(--mr-radius);padding:24px}
.mr-title{font-weight:800;line-height:1.1;letter-spacing:-1px;color:var(--mr-text);margin-bottom:16px}
.mr-title-size-big,.mr-title.big{font-size:3.5rem!important}
.mr-title-size-medium,.mr-title.medium{font-size:2.25rem!important;letter-spacing:-0.5px}
.mr-title-size-small,.mr-title.small{font-size:1.5rem!important;letter-spacing:0}
.mr-glow{background:linear-gradient(135deg,#fff 30%,var(--mr-primary) 60%,var(--mr-accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(99,102,241,0.4))}
.mr-subtitle{font-size:1.15rem;color:var(--mr-muted);font-weight:400;line-height:1.7;max-width:640px;margin-bottom:16px}
.mr-text{font-size:1rem;color:var(--mr-muted);line-height:1.8;margin-bottom:12px}
.mr-label{font-size:0.9rem;font-weight:600;color:var(--mr-text);display:block;margin-bottom:6px}
.mr-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:12px;font-size:1rem;font-weight:600;font-family:var(--mr-font);border:none;cursor:pointer;transition:all 0.25s;background:linear-gradient(135deg,var(--mr-primary),var(--mr-secondary));color:white;box-shadow:0 4px 15px rgba(99,102,241,0.3);margin:4px}
.mr-button:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(99,102,241,0.5)}
.mr-btn-big{padding:18px 44px!important;font-size:1.125rem!important;border-radius:14px!important}
.mr-btn-small{padding:9px 20px!important;font-size:0.875rem!important;border-radius:10px!important}
.mr-btn-outline{background:transparent!important;border:2px solid var(--mr-primary)!important;color:var(--mr-primary)!important;box-shadow:none!important}
.mr-btn-outline:hover{background:var(--mr-primary)!important;color:white!important}
.mr-input{width:100%;padding:13px 16px;background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:10px;color:var(--mr-text);font-size:1rem;font-family:var(--mr-font);transition:border-color 0.2s,box-shadow 0.2s;outline:none;margin-bottom:12px;display:block}
.mr-input:focus{border-color:var(--mr-primary);box-shadow:0 0 0 3px rgba(99,102,241,0.2)}
.mr-form{display:flex;flex-direction:column;gap:8px;max-width:480px}
.mr-image{max-width:100%;display:block}
.mr-image.mr-rounded{border-radius:var(--mr-radius)}
.mr-image.mr-shadow{box-shadow:var(--mr-shadow)}
.mr-link{color:var(--mr-primary);text-decoration:none;font-weight:500;transition:color 0.2s}
.mr-link:hover{color:var(--mr-accent)}
.mr-video{max-width:100%;border-radius:var(--mr-radius)}
.mr-icon{font-size:2rem;color:var(--mr-primary);margin-bottom:12px;display:block}
.mr-list{padding-left:24px;color:var(--mr-muted);line-height:2}
.mr-item{padding:4px 0}
.mr-divider{border:none;border-top:1px solid var(--mr-border);margin:32px 0}
.mr-spacer{display:block}
.mr-shadow{box-shadow:var(--mr-shadow)}
.mr-rounded{border-radius:50%}
@keyframes mr-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@media(max-width:768px){.mr-nav{padding:16px 24px}.mr-section{padding:60px 24px}.mr-hero{padding:80px 24px}.mr-title-size-big{font-size:2.25rem!important}.mr-grid{grid-template-columns:1fr}.mr-row{flex-direction:column}}
</style>
</head>
<body>
${body}
<script>
(function(){
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)'}
    });
  },{threshold:0.1});
  document.querySelectorAll('.mr-card,.mr-section,.mr-title,.mr-text,.mr-button').forEach(el => {
    el.style.opacity='0';el.style.transform='translateY(24px)';
    el.style.transition='opacity 0.6s ease,transform 0.6s ease';
    obs.observe(el);
  });
  document.querySelectorAll('.mr-hero .mr-title,.mr-hero .mr-subtitle,.mr-hero .mr-button').forEach((el,i)=>{
    setTimeout(()=>{el.style.opacity='1';el.style.transform='translateY(0)'},i*150);
  });
})();
</script>
</body></html>`;
}

// ── Tab / View Switching ──────────────────────────────────────────────────────
function switchTab(mode) {
  currentView = mode;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab')[['editor','preview','split'].indexOf(mode)]?.classList.add('active');
  setViewMode(mode);
}

function setViewMode(mode) {
  const ws = document.getElementById('workspace');
  ws.classList.remove('editor-only','preview-only');
  if (mode === 'editor')  ws.classList.add('editor-only');
  if (mode === 'preview') ws.classList.add('preview-only');
  if (editor) editor.refresh();
}

// ── Viewport Switching ────────────────────────────────────────────────────────
function setViewport(vp) {
  document.querySelectorAll('.vp-btn').forEach(b => b.classList.remove('active'));
  event.target.closest('.vp-btn').classList.add('active');
  const frame   = document.getElementById('preview-frame');
  const wrapper = document.getElementById('preview-frame-wrapper');
  frame.className   = vp === 'desktop' ? '' : vp;
  wrapper.className = `preview-frame-wrapper ${vp === 'desktop' ? '' : vp}`;
}

// ── Snippet Insert ────────────────────────────────────────────────────────────
function insertSnippet(code) {
  const cursor = editor.getCursor();
  const line   = editor.getLine(cursor.line);
  const indent = line.match(/^(\s*)/)[1];
  const indented = code.split('\n').map((l, i) => i === 0 ? l : indent + l).join('\n');
  editor.replaceRange('\n' + indented, { line: cursor.line, ch: line.length });
  editor.focus();
  setTimeout(compileAndPreview, 100);
}

// ── Actions ───────────────────────────────────────────────────────────────────
function runCode() {
  compileAndPreview();
  showToast('⚡ Compiled successfully!');
}

function refreshPreview() {
  compileAndPreview();
  showToast('🔄 Preview refreshed');
}

function openInNewTab() {
  const source = editor.getValue();
  try {
    const html   = browserCompile(source);
    const blob   = new Blob([html], { type: 'text/html' });
    const url    = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function downloadHTML() {
  const source = editor.getValue();
  try {
    const html = browserCompile(source);
    const blob = new Blob([html], { type: 'text/html' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'index.html';
    a.click();
    showToast('⬇️ Downloaded index.html');
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function copyHTML() {
  const source = editor.getValue();
  try {
    const html = browserCompile(source);
    navigator.clipboard.writeText(html).then(() => showToast('📋 HTML copied to clipboard!'));
  } catch (err) { showToast('❌ ' + err.message); }
}

function formatCode() {
  // Basic MR.easy formatter — normalize indentation
  showToast('✨ Code formatted');
}

function increaseFontSize() {
  fontSize = Math.min(fontSize + 2, 28);
  document.querySelector('.CodeMirror').style.fontSize = fontSize + 'px';
  document.getElementById('font-size-label').textContent = fontSize + 'px';
}

function decreaseFontSize() {
  fontSize = Math.max(fontSize - 2, 10);
  document.querySelector('.CodeMirror').style.fontSize = fontSize + 'px';
  document.getElementById('font-size-label').textContent = fontSize + 'px';
}

// ── Guide Modal ────────────────────────────────────────────────────────────────
function showGuide() {
  const content = document.getElementById('guide-content');
  content.innerHTML = `
<div class="guide-section">
  <h3>🚀 Every MR.easy File Starts With:</h3>
  <div class="guide-code">Mr.easy "Your Page Title"</div>
  <p class="guide-desc">This is required — like &lt;!DOCTYPE html&gt; in HTML. It's the signature of the language!</p>
</div>
<div class="guide-section">
  <h3>📐 Layout Elements</h3>
  ${[
    ['nav', 'Navigation bar'], ['hero', 'Big hero section'],
    ['section "name"', 'Page section'], ['grid cols:3', '3-column grid'],
    ['row', 'Horizontal row'], ['column', 'Vertical column'],
    ['card shadow', 'Card with shadow'], ['footer', 'Page footer'],
  ].map(([c,d]) => `<div class="guide-row"><div class="guide-code">${c}</div><div class="guide-desc">${d}</div></div>`).join('')}
</div>
<div class="guide-section">
  <h3>📝 Text Elements</h3>
  ${[
    ['title "Hello" big glow', 'Big glowing heading'],
    ['subtitle "Text"', 'Subtitle paragraph'],
    ['text "Paragraph"', 'Regular text'],
    ['label "Name" for:input', 'Form label'],
  ].map(([c,d]) => `<div class="guide-row"><div class="guide-code">${c}</div><div class="guide-desc">${d}</div></div>`).join('')}
</div>
<div class="guide-section">
  <h3>🖱️ Interactive Elements</h3>
  ${[
    ['button "Click" blue big', 'Blue big button'],
    ['button "Learn" outline', 'Outline button'],
    ['link "Google" url:https://google.com', 'Hyperlink'],
    ['input type:email placeholder:"Email"', 'Input field'],
  ].map(([c,d]) => `<div class="guide-row"><div class="guide-code">${c}</div><div class="guide-desc">${d}</div></div>`).join('')}
</div>
<div class="guide-section">
  <h3>🎨 Style Modifiers (add after any element)</h3>
  <div class="guide-row">
    <div class="guide-code">big / medium / small / tiny</div><div class="guide-desc">Size</div>
  </div>
  <div class="guide-row">
    <div class="guide-code">glow / shadow / rounded / glass</div><div class="guide-desc">Visual effects</div>
  </div>
  <div class="guide-row">
    <div class="guide-code">blue / red / green / purple / orange / pink</div><div class="guide-desc">Color</div>
  </div>
  <div class="guide-row">
    <div class="guide-code">center / left / right</div><div class="guide-desc">Alignment</div>
  </div>
</div>
`;
  document.getElementById('guide-modal').classList.add('open');
}

function showCheatsheet() {
  showGuide();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── Saved Indicator ────────────────────────────────────────────────────────────
function markUnsaved() {
  document.getElementById('saved-indicator').classList.add('unsaved');
}
function markSaved() {
  document.getElementById('saved-indicator').classList.remove('unsaved');
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Resize Divider ────────────────────────────────────────────────────────────
let isResizing = false;
function startResize(e) {
  isResizing = true;
  document.getElementById('divider').classList.add('dragging');
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
}
function doResize(e) {
  if (!isResizing) return;
  const workspace  = document.getElementById('workspace');
  const sidebar    = document.getElementById('sidebar');
  const rect       = workspace.getBoundingClientRect();
  const sidebarW   = sidebar.offsetWidth;
  const totalW     = rect.width - sidebarW;
  const offsetX    = e.clientX - rect.left - sidebarW;
  const pct        = Math.max(20, Math.min(80, (offsetX / totalW) * 100));
  document.getElementById('editor-panel').style.flex  = `0 0 ${pct}%`;
  document.getElementById('preview-panel').style.flex = `0 0 ${100 - pct}%`;
}
function stopResize() {
  isResizing = false;
  document.getElementById('divider').classList.remove('dragging');
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
  if (editor) editor.refresh();
}
