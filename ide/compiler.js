/*
 * MR.easy shared browser compiler
 * Single source of truth for syntax metadata, CodeMirror mode, compilation,
 * generated preview markup, and preview theme tokens.
 */
(function (root) {
  'use strict';

  const KEYWORDS = ['nav','hero','section','header','footer','row','column','col',
    'grid','card','box','list','form','title','subtitle','text','label','item',
    'button','link','image','img','video','icon','input','logo','links','menu',
    'divider','spacer','set','repeat','times','if','else','end','show','hide',
    'animate','component','use','function','call','define','import','from',
    'for','while','each','in','of','to','head','meta','page',
    'accordion','tabs','tab','table','thead','tbody','tr','th','td',
    'badge','tag','alert','progress','avatar','quote','code','stat',
    'select','checkbox','toggle','embed','rating','countdown','steps','step',
    'testimonial','sidebar','modal','dropdown'];

  const STYLE_WORDS = ['big','medium','small','tiny','glow','shadow','rounded','outline',
    'bold','italic','dark','light','gradient','glass','center','left','right',
    'blue','red','green','purple','orange','pink','yellow','white','black','gray','cyan',
    'on','off','float','autoplay','required','ordered','done','checked','success','warning','error','info'];

  const COLOR_MAP = { blue:'#3b82f6', purple:'#8b5cf6', green:'#22c55e', red:'#ef4444', orange:'#f97316', pink:'#ec4899', yellow:'#eab308', white:'#fff', black:'#0f172a', gray:'#6b7280', cyan:'#06b6d4' };
  const ICON_MAP = { star:'fa-star', heart:'fa-heart', rocket:'fa-rocket', bolt:'fa-bolt', globe:'fa-globe', lock:'fa-lock', home:'fa-house', user:'fa-user', mail:'fa-envelope', check:'fa-check', code:'fa-code', fire:'fa-fire', diamond:'fa-gem', moon:'fa-moon', sun:'fa-sun', phone:'fa-phone', settings:'fa-gear', download:'fa-download', upload:'fa-upload', share:'fa-share-nodes', chat:'fa-comments', info:'fa-circle-info', warn:'fa-triangle-exclamation' };
  const SIZE_MAP = ['big','medium','small','tiny'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  const STARTER = `Mr.easy "My Amazing Website"

# 👋 Welcome to MR.easy!
# Rule 1: Every file MUST start with: Mr.easy "Page Title"
# Rule 2: No brackets {}, no semicolons ;, no HTML tags needed!
# Rule 3: Indent with 2 spaces to nest elements inside sections!

# 💡 Follow developer for more tips: IG @mrcute_killer

nav
  logo "MyBrand"
  links Home About Contact

hero
  title "Build Websites Fast" big glow
  subtitle "MR.easy is the simplest language to make beautiful websites"
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
  text "Made with ❤️ using Mr.easy — IG @mrcute_killer 🇪🇹"
`;

  function registerCodeMirrorMode() {
    if (!root.CodeMirror || root.CodeMirror.modes?.mreasy) return;
    root.CodeMirror.defineMode('mreasy', function () {
      return {
        startState() { return { inString: false, quote: null }; },
        token(stream, state) {
          if (state.inString) {
            if (stream.eat(state.quote)) { state.inString = false; return 'mreasy-string'; }
            stream.next();
            return 'mreasy-string';
          }
          if (stream.match(/^#.*/)) return 'mreasy-comment';
          if (stream.eatSpace()) return null;
          const quote = stream.peek();
          if (quote === '"' || quote === "'") {
            stream.next();
            state.inString = true;
            state.quote = quote;
            return 'mreasy-string';
          }
          if (stream.match(/^\d+(\.\d+)?/)) return 'mreasy-number';
          if (stream.match('Mr.easy')) return 'mreasy-decl';
          const wordMatch = stream.match(/^[a-zA-Z_][\w\-]*/);
          if (wordMatch) {
            const word = wordMatch[0];
            if (stream.peek() === ':') {
              stream.next();
              stream.match(/^[\w\-\.#%]+/);
              return 'mreasy-prop';
            }
            if (KEYWORDS.includes(word)) return 'mreasy-keyword';
            if (STYLE_WORDS.includes(word)) return 'mreasy-modifier';
            return null;
          }
          stream.next();
          return null;
        }
      };
    });
  }

  function tokenizeLine(line) {
    const tokens = [];
    let index = 0;
    while (index < line.length) {
      while (/\s/.test(line[index] || '')) index += 1;
      if (index >= line.length) break;
      if (line[index] === '"' || line[index] === "'") {
        const quote = line[index++];
        const start = index;
        while (index < line.length && line[index] !== quote) index += 1;
        tokens.push(line.slice(start, index));
        index += 1;
        continue;
      }
      let token = '';
      while (index < line.length && !/\s/.test(line[index])) {
        if (line[index] === '"' || line[index] === "'") {
          const quote = line[index++];
          const start = index;
          while (index < line.length && line[index] !== quote) index += 1;
          token += line.slice(start, index);
          index += 1;
        } else {
          token += line[index++];
        }
      }
      tokens.push(token);
    }
    return tokens;
  }

  function compileLines(lines) {
    let title = 'MR.easy Page';
    let index = 0;
    const vars = {};
    const components = {};
    const componentParams = {};
    let headTags = '';

    function getIndent(line) {
      const match = line.match(/^(\s+)/);
      return match ? match[1].length : 0;
    }

    function getProp(tokens, key) {
      const token = tokens.find(item => item.startsWith(key + ':'));
      return token ? token.split(':').slice(1).join(':') : null;
    }

    function getLabel(tokens) {
      return tokens.find(token => !token.includes(':') && !STYLE_WORDS.includes(token.toLowerCase()) && !KEYWORDS.includes(token.toLowerCase()));
    }

    function hasMod(tokens, ...mods) {
      return mods.some(mod => tokens.map(token => token.toLowerCase()).includes(mod));
    }

    function resolveVars(text) {
      return String(text || '').replace(/\{([a-zA-Z_]+)\}/g, (_, n) => vars[n] !== undefined ? vars[n] : `{${n}}`);
    }

    function resolveExpression(expr) {
      if (expr === undefined || expr === null) return expr;
      const s = String(expr);
      if (/^[a-zA-Z_]\w*$/.test(s) && vars[s] !== undefined) return vars[s];
      const arithMatch = s.match(/^(\w+)\s*([+\-*\/])\s*(\w+)$/);
      if (arithMatch) {
        const [, left, op, right] = arithMatch;
        const lv = vars[left] !== undefined ? Number(vars[left]) : Number(left);
        const rv = vars[right] !== undefined ? Number(vars[right]) : Number(right);
        if (!isNaN(lv) && !isNaN(rv)) {
          switch (op) {
            case '+': return lv + rv;
            case '-': return lv - rv;
            case '*': return lv * rv;
            case '/': return rv !== 0 ? lv / rv : 0;
          }
        }
      }
      if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      if (s === 'on' || s === 'true') return true;
      if (s === 'off' || s === 'false') return false;
      return s;
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    }

    function escapeAttribute(value) {
      return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function resolveAction(action) {
      if (!action) return 'void 0';
      if (action === 'alert') return "alert('Hello from MR.easy! 👋')";
      if (action === 'scroll' || action === 'top') return "window.scrollTo({top:0,behavior:'smooth'})";
      if (action.startsWith('alert(')) return action;
      if (action.startsWith('go:')) return `window.location.href='${action.slice(3)}'`;
      return 'void 0';
    }

    function btnColor(tokens) {
      const colors = ['blue','purple','green','red','orange','pink','yellow','cyan'];
      const color = tokens.find(token => colors.includes(token.toLowerCase()));
      return color ? { background: `linear-gradient(135deg, ${COLOR_MAP[color]}, ${COLOR_MAP[color]}cc)`, boxShadow: `0 4px 15px ${COLOR_MAP[color]}55` } : null;
    }

    function renderIconMarkup(label, tokens, lineIndex) {
      const icon = ICON_MAP[String(label).toLowerCase()] || `fa-${String(label || 'star').toLowerCase()}`;
      const color = getProp(tokens, 'color');
      const size = getProp(tokens, 'size');
      const style = `${color ? `color:${escapeAttribute(color)};` : ''}${size ? `font-size:${escapeAttribute(size)}px;` : ''}`;
      return `<i class="mr-icon fa ${escapeAttribute(icon)}" data-line="${lineIndex}"${style ? ` style="${style}"` : ''} aria-hidden="true"></i>`;
    }

    function renderBlock(type, tokens, children, lineIndex) {
      const label = getLabel(tokens) || '';
      const id = (label || type).replace(/\s+/g, '-').toLowerCase();
      const background = getProp(tokens, 'background') || getProp(tokens, 'bg');
      const columns = getProp(tokens, 'cols');
      const gap = getProp(tokens, 'gap');
      const lineAttr = `data-line="${lineIndex}"`;

      switch (type) {
        case 'nav': return `<nav class="mr-nav" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</nav>`;
        case 'hero': return `<div class="mr-hero" ${lineAttr}><div class="mr-hero-inner">${children}</div></div>`;
        case 'section': return `<section id="${id}" class="mr-section" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</section>`;
        case 'header': return `<div class="mr-header" ${lineAttr}>${children}</div>`;
        case 'footer': return `<footer class="mr-footer" ${lineAttr}>${children}</footer>`;
        case 'row': return `<div class="mr-row" ${lineAttr} style="${hasMod(tokens, 'center') ? 'justify-content:center;' : ''}${gap ? `gap:${gap}px;` : ''}">${children}</div>`;
        case 'column':
        case 'col': return `<div class="mr-column" ${lineAttr}>${children}</div>`;
        case 'grid': return `<div class="mr-grid" ${lineAttr} style="${columns ? `grid-template-columns:repeat(${columns},1fr);` : ''}${gap ? `gap:${gap}px;` : ''}">${children}</div>`;
        case 'card': return `<div class="mr-card${hasMod(tokens, 'glass') ? ' glass' : ''}" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</div>`;
        case 'box': return `<div class="mr-box" ${lineAttr}>${children}</div>`;
        case 'list': return `<ul class="mr-list" ${lineAttr}>${children}</ul>`;
        case 'form': return `<form class="mr-form" ${lineAttr} onsubmit="return false">${children}</form>`;
        case 'accordion': {
          const itemId = `mr-accordion-${lineIndex}`;
          return `<div class="mr-accordion" ${lineAttr}><button type="button" class="mr-accordion-btn" aria-expanded="false" aria-controls="${itemId}" onclick="window.mrToggle('${itemId}', this)">${escapeHtml(label || 'Accordion')}<span class="mr-accordion-icon" aria-hidden="true">⌄</span></button><div class="mr-accordion-body" id="${itemId}">${children}</div></div>`;
        }
        case 'tabs': {
          const firstButton = children.replace(/class="mr-tab-btn"/, 'class="mr-tab-btn active"').replace(/aria-selected="false"/, 'aria-selected="true"');
          const firstPane = firstButton.replace(/class="mr-tab-pane"/, 'class="mr-tab-pane active"');
          return `<div class="mr-tabs" ${lineAttr}><div class="mr-tab-bar" role="tablist">${firstPane}</div></div>`;
        }
        case 'tab': {
          const tabId = `mr-tab-${lineIndex}`;
          return `<div class="mr-tab-item"><button type="button" class="mr-tab-btn" role="tab" aria-selected="false" data-tab-target="${tabId}" ${lineAttr} onclick="window.mrSelectTab(this)">${escapeHtml(label || 'Tab')}</button><div class="mr-tab-pane" role="tabpanel" id="${tabId}" ${lineAttr}>${children}</div></div>`;
        }
        default: return `<div ${lineAttr}>${children}</div>`;
      }
    }

    function renderInline(type, tokens, lineIndex) {
      const label = getLabel(tokens) || '';
      const colorToken = tokens.find(token => COLOR_MAP[token.toLowerCase()]);
      const color = getProp(tokens, 'color') || (colorToken ? COLOR_MAP[colorToken.toLowerCase()] : null);
      const size = tokens.find(token => SIZE_MAP.includes(token.toLowerCase()));
      const prop = key => getProp(tokens, key);
      const lineAttr = `data-line="${lineIndex}"`;

      switch (type) {
        case 'title': {
          const tag = size === 'big' ? 'h1' : size === 'medium' ? 'h2' : size === 'small' ? 'h3' : 'h2';
          const classes = `mr-title${size ? ` mr-size-${size}` : ''}${hasMod(tokens, 'glow') ? ' mr-glow' : ''}`;
          return `<${tag} class="${classes}" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(resolveVars(label))}</${tag}>`;
        }
        case 'subtitle': return `<p class="mr-subtitle" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(resolveVars(label))}</p>`;
        case 'text': return `<p class="mr-text" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(resolveVars(label))}</p>`;
        case 'label': return `<label class="mr-label" ${lineAttr} for="${escapeAttribute(prop('for') || '')}">${escapeHtml(resolveVars(label))}</label>`;
        case 'item': return `<li class="mr-item" ${lineAttr}>${escapeHtml(resolveVars(label))}</li>`;
        case 'button': {
          const buttonColor = btnColor(tokens);
          const sizeClass = size === 'big' ? 'mr-btn-big' : size === 'small' ? 'mr-btn-small' : '';
          const outlineClass = hasMod(tokens, 'outline') ? 'mr-btn-outline' : '';
          const action = prop('action') || '';
          const style = buttonColor && !outlineClass ? `background:${buttonColor.background};box-shadow:${buttonColor.boxShadow}` : '';
          const actionMarkup = action ? ` onclick="${escapeAttribute(resolveAction(action))}"` : '';
          return `<button type="button" class="mr-button ${sizeClass} ${outlineClass}" ${lineAttr}${style ? ` style="${style}"` : ''}${actionMarkup}>${escapeHtml(resolveVars(label || 'Button'))}</button>`;
        }
        case 'link': return `<a class="mr-link" ${lineAttr} href="${escapeAttribute(prop('url') || '#')}" ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(label || prop('url') || 'Link')}</a>`;
        case 'image': {
          const source = prop('src') || label || '';
          const dimensions = `${prop('width') ? `width:${escapeAttribute(prop('width'))}px;` : ''}${prop('height') ? `height:${escapeAttribute(prop('height'))}px;` : ''}`;
          return `<img class="mr-image${hasMod(tokens, 'rounded') ? ' mr-rounded' : ''}${hasMod(tokens, 'shadow') ? ' mr-shadow' : ''}" ${lineAttr} src="${escapeAttribute(source)}" alt="${escapeAttribute(label)}" ${dimensions ? `style="${dimensions}"` : ''}>`;
        }
        case 'icon': return renderIconMarkup(label, tokens, lineIndex);
        case 'input': return `<input class="mr-input" ${lineAttr} type="${escapeAttribute(prop('type') || 'text')}" placeholder="${escapeAttribute(prop('placeholder') || label)}" id="${escapeAttribute(prop('id') || '')}" name="${escapeAttribute(prop('id') || '')}">`;
        case 'logo': return `<div class="mr-nav-logo" ${lineAttr}>${escapeHtml(label)}</div>`;
        case 'links': return `<div class="mr-nav-links" ${lineAttr}>${tokens.filter(token => !token.includes(':')).map(item => `<a class="mr-nav-item" href="#${escapeAttribute(item.toLowerCase())}">${escapeHtml(item)}</a>`).join('')}</div>`;
        case 'divider': return `<hr class="mr-divider" ${lineAttr}>`;
        case 'spacer': return `<div class="mr-spacer" ${lineAttr} style="height:${escapeAttribute(prop('size') || '40')}px"></div>`;
        case 'badge':
        case 'tag': return `<span class="mr-badge mr-badge-${escapeAttribute(colorToken || 'default')}" ${lineAttr}>${escapeHtml(label)}</span>`;
        case 'alert': {
          const tone = hasMod(tokens, 'success') ? 'success' : hasMod(tokens, 'warning') ? 'warning' : hasMod(tokens, 'error') ? 'error' : 'info';
          return `<div class="mr-alert mr-alert-${tone}" role="status" ${lineAttr}><span class="mr-alert-icon" aria-hidden="true">${tone === 'success' ? '✓' : tone === 'warning' ? '!' : tone === 'error' ? '×' : 'i'}</span><span>${escapeHtml(label)}</span></div>`;
        }
        case 'progress': {
          const value = Math.max(0, Math.min(100, Number(prop('value') || 0)));
          const progressLabel = prop('label') || label || 'Progress';
          return `<div class="mr-progress-wrap" ${lineAttr}><div class="mr-progress-label"><span>${escapeHtml(progressLabel)}</span><span>${value}%</span></div><div class="mr-progress-bar" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><div class="mr-progress-fill" style="width:${value}%"></div></div></div>`;
        }
        case 'rating': {
          const value = Math.max(0, Math.min(5, Number(prop('value') || 0)));
          return `<div class="mr-rating" ${lineAttr} aria-label="${value} out of 5 stars">${[1,2,3,4,5].map(star => `<span class="mr-star${star <= value ? ' filled' : ''}" aria-hidden="true">★</span>`).join('')}<span class="mr-rating-label">${escapeHtml(prop('label') || '')}</span></div>`;
        }
        case 'stat': return `<div class="mr-stat" ${lineAttr}><strong class="mr-stat-value">${escapeHtml(prop('value') || label || '0')}</strong><span class="mr-stat-label">${escapeHtml(prop('label') || '')}</span></div>`;
        case 'quote': return `<blockquote class="mr-quote" ${lineAttr}><p class="mr-quote-text">\u201c${escapeHtml(resolveVars(label))}\u201d</p>${prop('author') ? `<cite class="mr-quote-author">${escapeHtml(prop('author'))}</cite>` : ''}</blockquote>`;
        case 'code': return `<pre class="mr-code-block" ${lineAttr}><code>${escapeHtml(label)}</code></pre>`;
        case 'avatar': return `<span class="mr-avatar mr-avatar-initials" ${lineAttr} aria-label="${escapeAttribute(label)}">${escapeHtml((label || '?').slice(0, 2).toUpperCase())}</span>`;
        case 'video': return `<video class="mr-video" ${lineAttr} src="${escapeAttribute(prop('src') || label || '')}" controls></video>`;
        case 'meta': {
          const name = prop('name') || prop('description') ? 'description' : prop('keywords') ? 'keywords' : prop('name');
          const content = prop('content') || prop('description') || prop('keywords') || label;
          if (name && content) headTags += `<meta name="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`;
          return '';
        }
        default: return '';
      }
    }

    function parseSectionLines(baseIndent) {
      let output = '';
      while (index < lines.length) {
        const rawLine = lines[index];
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.startsWith('#')) { index += 1; continue; }
        const indent = getIndent(rawLine);
        if (indent < baseIndent) break;
        const tokens = tokenizeLine(trimmed);
        if (!tokens.length) { index += 1; continue; }
        const keyword = tokens[0].toLowerCase();
        const lineIndex = index;

        // ── Logic keywords ──
        if (keyword === 'set') {
          const name = tokens[1] || '';
          let value = tokens[3] || tokens[2] || '';
          if (tokens[2] === '=') value = tokens[3] || '';
          vars[name] = resolveExpression(value);
          index += 1;
          continue;
        }

        if (keyword === 'repeat') {
          const countToken = tokens[1] || '1';
          let count = vars[countToken] !== undefined ? Number(vars[countToken]) : Number(countToken);
          if (isNaN(count) || count < 0) count = 0;
          index += 1;
          const childIndent = baseIndent + 2;
          let childLines = [];
          while (index < lines.length) {
            const cl = lines[index];
            const ci = getIndent(cl);
            if (ci < childIndent || (!cl.trim() && ci < childIndent)) break;
            childLines.push(lines[index]);
            index += 1;
          }
          const savedIndex = index;
          const savedVars = { ...vars };
          for (let i = 0; i < count; i++) {
            vars['index'] = i + 1;
            vars['index0'] = i;
            index = savedIndex - childLines.length;
            const childOutput = parseSectionLines(childIndent);
            output += childOutput;
          }
          Object.assign(vars, savedVars);
          index = savedIndex;
          continue;
        }

        if (keyword === 'for') {
          const varName = tokens[1] || 'i';
          const startVal = resolveExpression(tokens[3] || tokens[2] || '1');
          const isTo = tokens.includes('to');
          const endVal = resolveExpression(isTo ? tokens[tokens.indexOf('to') + 1] : tokens[4] || '10');
          index += 1;
          const childIndent = baseIndent + 2;
          let childLines = [];
          while (index < lines.length) {
            const cl = lines[index];
            const ci = getIndent(cl);
            if (ci < childIndent || (!cl.trim() && ci < childIndent)) break;
            childLines.push(lines[index]);
            index += 1;
          }
          const sv = Number(startVal);
          const ev = Number(endVal);
          if (!isNaN(sv) && !isNaN(ev)) {
            const savedIndex = index;
            for (let i = sv; i <= ev; i++) {
              vars[varName] = i;
              vars['index'] = i;
              index = savedIndex - childLines.length;
              output += parseSectionLines(childIndent);
            }
          }
          continue;
        }

        if (keyword === 'if') {
          const cond = tokens[1] || '';
          const truthy = (cond === 'on' || cond === 'true' || (vars[cond] !== undefined && !!vars[cond]) || cond === '');
          index += 1;
          const childIndent = baseIndent + 2;
          let ifOutput = '';
          let elseOutput = '';
          let inElse = false;
          while (index < lines.length) {
            const cl = lines[index];
            const ci = getIndent(cl);
            if (ci < childIndent && cl.trim()) break;
            if (!cl.trim()) { index += 1; continue; }
            const ct = cl.trim().toLowerCase();
            if (ct === 'else') { inElse = true; index += 1; continue; }
            if (ct === 'end') { index += 1; break; }
            if (inElse) {
              index++;
              const savedIdx = index;
              index = savedIdx - 1;
              elseOutput += parseSectionLines(childIndent);
            } else {
              ifOutput += parseSectionLines(childIndent);
            }
          }
          output += truthy ? ifOutput : elseOutput;
          continue;
        }

        if (keyword === 'end' || keyword === 'else') {
          index += 1;
          continue;
        }

        // ── Block keywords ──
        const blocks = ['nav','hero','section','header','footer','row','column','col','grid','card','box','list','form','accordion','tabs','tab'];
        if (blocks.includes(keyword)) {
          index += 1;
          output += renderBlock(keyword, tokens.slice(1), parseSectionLines(indent + 2), lineIndex);
        } else {
          output += renderInline(keyword, tokens.slice(1), lineIndex) + '\n';
          index += 1;
        }
      }
      return output;
    }

    const declaration = lines[0]?.trim() || '';
    const titleMatch = declaration.match(/^Mr\.easy\s+"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];
    index = 1;
    const body = parseSectionLines(0);
    return { title, body, vars, headTags };
  }

    function getProp(tokens, key) {
      const token = tokens.find(item => item.startsWith(key + ':'));
      return token ? token.split(':').slice(1).join(':') : null;
    }

    function getLabel(tokens) {
      return tokens.find(token => !token.includes(':') && !STYLE_WORDS.includes(token.toLowerCase()) && !KEYWORDS.includes(token.toLowerCase()));
    }

    function hasMod(tokens, ...mods) {
      return mods.some(mod => tokens.map(token => token.toLowerCase()).includes(mod));
    }

    function resolveAction(action) {
      if (!action) return 'void 0';
      if (action === 'alert') return "alert('Hello from MR.easy! 👋')";
      if (action === 'scroll' || action === 'top') return "window.scrollTo({top:0,behavior:'smooth'})";
      if (action.startsWith('alert(')) return action;
      if (action.startsWith('go:')) return `window.location.href='${action.slice(3)}'`;
      return 'void 0';
    }

    function btnColor(tokens) {
      const colors = ['blue','purple','green','red','orange','pink','yellow','cyan'];
      const color = tokens.find(token => colors.includes(token.toLowerCase()));
      return color ? { background: `linear-gradient(135deg, ${COLOR_MAP[color]}, ${COLOR_MAP[color]}cc)`, boxShadow: `0 4px 15px ${COLOR_MAP[color]}55` } : null;
    }

    function renderIconMarkup(label, tokens, lineIndex) {
      const icon = ICON_MAP[String(label).toLowerCase()] || `fa-${String(label || 'star').toLowerCase()}`;
      const color = getProp(tokens, 'color');
      const size = getProp(tokens, 'size');
      const style = `${color ? `color:${escapeAttribute(color)};` : ''}${size ? `font-size:${escapeAttribute(size)}px;` : ''}`;
      return `<i class="mr-icon fa ${escapeAttribute(icon)}" data-line="${lineIndex}"${style ? ` style="${style}"` : ''} aria-hidden="true"></i>`;
    }

    function renderBlock(type, tokens, children, lineIndex) {
      const label = getLabel(tokens) || '';
      const id = (label || type).replace(/\s+/g, '-').toLowerCase();
      const background = getProp(tokens, 'background') || getProp(tokens, 'bg');
      const columns = getProp(tokens, 'cols');
      const gap = getProp(tokens, 'gap');
      const lineAttr = `data-line="${lineIndex}"`;

      switch (type) {
        case 'nav': return `<nav class="mr-nav" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</nav>`;
        case 'hero': return `<div class="mr-hero" ${lineAttr}><div class="mr-hero-inner">${children}</div></div>`;
        case 'section': return `<section id="${id}" class="mr-section" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</section>`;
        case 'header': return `<div class="mr-header" ${lineAttr}>${children}</div>`;
        case 'footer': return `<footer class="mr-footer" ${lineAttr}>${children}</footer>`;
        case 'row': return `<div class="mr-row" ${lineAttr} style="${hasMod(tokens, 'center') ? 'justify-content:center;' : ''}${gap ? `gap:${gap}px;` : ''}">${children}</div>`;
        case 'column':
        case 'col': return `<div class="mr-column" ${lineAttr}>${children}</div>`;
        case 'grid': return `<div class="mr-grid" ${lineAttr} style="${columns ? `grid-template-columns:repeat(${columns},1fr);` : ''}${gap ? `gap:${gap}px;` : ''}">${children}</div>`;
        case 'card': return `<div class="mr-card${hasMod(tokens, 'glass') ? ' glass' : ''}" ${lineAttr} ${background ? `style="background:${background}"` : ''}>${children}</div>`;
        case 'box': return `<div class="mr-box" ${lineAttr}>${children}</div>`;
        case 'list': return `<ul class="mr-list" ${lineAttr}>${children}</ul>`;
        case 'form': return `<form class="mr-form" ${lineAttr} onsubmit="return false">${children}</form>`;
        case 'accordion': {
          const itemId = `mr-accordion-${lineIndex}`;
          return `<div class="mr-accordion" ${lineAttr}><button type="button" class="mr-accordion-btn" aria-expanded="false" aria-controls="${itemId}" onclick="window.mrToggle('${itemId}', this)">${escapeHtml(label || 'Accordion')}<span class="mr-accordion-icon" aria-hidden="true">⌄</span></button><div class="mr-accordion-body" id="${itemId}">${children}</div></div>`;
        }
        case 'tabs': {
          const firstButton = children.replace(/class="mr-tab-btn"/, 'class="mr-tab-btn active"').replace(/aria-selected="false"/, 'aria-selected="true"');
          const firstPane = firstButton.replace(/class="mr-tab-pane"/, 'class="mr-tab-pane active"');
          return `<div class="mr-tabs" ${lineAttr}><div class="mr-tab-bar" role="tablist">${firstPane}</div></div>`;
        }
        case 'tab': {
          const tabId = `mr-tab-${lineIndex}`;
          return `<div class="mr-tab-item"><button type="button" class="mr-tab-btn" role="tab" aria-selected="false" data-tab-target="${tabId}" ${lineAttr} onclick="window.mrSelectTab(this)">${escapeHtml(label || 'Tab')}</button><div class="mr-tab-pane" role="tabpanel" id="${tabId}" ${lineAttr}>${children}</div></div>`;
        }
        default: return `<div ${lineAttr}>${children}</div>`;
      }
    }

    function renderInline(type, tokens, lineIndex) {
      const label = getLabel(tokens) || '';
      const colorToken = tokens.find(token => COLOR_MAP[token.toLowerCase()]);
      const color = getProp(tokens, 'color') || (colorToken ? COLOR_MAP[colorToken.toLowerCase()] : null);
      const size = tokens.find(token => SIZE_MAP.includes(token.toLowerCase()));
      const prop = key => getProp(tokens, key);
      const lineAttr = `data-line="${lineIndex}"`;

      switch (type) {
        case 'title': {
          const tag = size === 'big' ? 'h1' : size === 'medium' ? 'h2' : size === 'small' ? 'h3' : 'h2';
          const classes = `mr-title${size ? ` mr-size-${size}` : ''}${hasMod(tokens, 'glow') ? ' mr-glow' : ''}`;
          return `<${tag} class="${classes}" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(label)}</${tag}>`;
        }
        case 'subtitle': return `<p class="mr-subtitle" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(label)}</p>`;
        case 'text': return `<p class="mr-text" ${lineAttr} ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(label)}</p>`;
        case 'label': return `<label class="mr-label" ${lineAttr} for="${escapeAttribute(prop('for') || '')}">${escapeHtml(label)}</label>`;
        case 'item': return `<li class="mr-item" ${lineAttr}>${escapeHtml(label)}</li>`;
        case 'button': {
          const buttonColor = btnColor(tokens);
          const sizeClass = size === 'big' ? 'mr-btn-big' : size === 'small' ? 'mr-btn-small' : '';
          const outlineClass = hasMod(tokens, 'outline') ? 'mr-btn-outline' : '';
          const action = prop('action') || '';
          const style = buttonColor && !outlineClass ? `background:${buttonColor.background};box-shadow:${buttonColor.boxShadow}` : '';
          const actionMarkup = action ? ` onclick="${escapeAttribute(resolveAction(action))}"` : '';
          return `<button type="button" class="mr-button ${sizeClass} ${outlineClass}" ${lineAttr}${style ? ` style="${style}"` : ''}${actionMarkup}>${escapeHtml(label || 'Button')}</button>`;
        }
        case 'link': return `<a class="mr-link" ${lineAttr} href="${escapeAttribute(prop('url') || '#')}" ${color ? `style="color:${escapeAttribute(color)}"` : ''}>${escapeHtml(label || prop('url') || 'Link')}</a>`;
        case 'image': {
          const source = prop('src') || label || '';
          const dimensions = `${prop('width') ? `width:${escapeAttribute(prop('width'))}px;` : ''}${prop('height') ? `height:${escapeAttribute(prop('height'))}px;` : ''}`;
          return `<img class="mr-image${hasMod(tokens, 'rounded') ? ' mr-rounded' : ''}${hasMod(tokens, 'shadow') ? ' mr-shadow' : ''}" ${lineAttr} src="${escapeAttribute(source)}" alt="${escapeAttribute(label)}" ${dimensions ? `style="${dimensions}"` : ''}>`;
        }
        case 'icon': return renderIconMarkup(label, tokens, lineIndex);
        case 'input': return `<input class="mr-input" ${lineAttr} type="${escapeAttribute(prop('type') || 'text')}" placeholder="${escapeAttribute(prop('placeholder') || label)}" id="${escapeAttribute(prop('id') || '')}" name="${escapeAttribute(prop('id') || '')}">`;
        case 'logo': return `<div class="mr-nav-logo" ${lineAttr}>${escapeHtml(label)}</div>`;
        case 'links': return `<div class="mr-nav-links" ${lineAttr}>${tokens.filter(token => !token.includes(':')).map(item => `<a class="mr-nav-item" href="#${escapeAttribute(item.toLowerCase())}">${escapeHtml(item)}</a>`).join('')}</div>`;
        case 'divider': return `<hr class="mr-divider" ${lineAttr}>`;
        case 'spacer': return `<div class="mr-spacer" ${lineAttr} style="height:${escapeAttribute(prop('size') || '40')}px"></div>`;
        case 'badge':
        case 'tag': return `<span class="mr-badge mr-badge-${escapeAttribute(colorToken || 'default')}" ${lineAttr}>${escapeHtml(label)}</span>`;
        case 'alert': {
          const tone = hasMod(tokens, 'success') ? 'success' : hasMod(tokens, 'warning') ? 'warning' : hasMod(tokens, 'error') ? 'error' : 'info';
          return `<div class="mr-alert mr-alert-${tone}" role="status" ${lineAttr}><span class="mr-alert-icon" aria-hidden="true">${tone === 'success' ? '✓' : tone === 'warning' ? '!' : tone === 'error' ? '×' : 'i'}</span><span>${escapeHtml(label)}</span></div>`;
        }
        case 'progress': {
          const value = Math.max(0, Math.min(100, Number(prop('value') || 0)));
          const progressLabel = prop('label') || label || 'Progress';
          return `<div class="mr-progress-wrap" ${lineAttr}><div class="mr-progress-label"><span>${escapeHtml(progressLabel)}</span><span>${value}%</span></div><div class="mr-progress-bar" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><div class="mr-progress-fill" style="width:${value}%"></div></div></div>`;
        }
        case 'rating': {
          const value = Math.max(0, Math.min(5, Number(prop('value') || 0)));
          return `<div class="mr-rating" ${lineAttr} aria-label="${value} out of 5 stars">${[1,2,3,4,5].map(star => `<span class="mr-star${star <= value ? ' filled' : ''}" aria-hidden="true">★</span>`).join('')}<span class="mr-rating-label">${escapeHtml(prop('label') || '')}</span></div>`;
        }
        case 'stat': return `<div class="mr-stat" ${lineAttr}><strong class="mr-stat-value">${escapeHtml(prop('value') || label || '0')}</strong><span class="mr-stat-label">${escapeHtml(prop('label') || '')}</span></div>`;
        case 'quote': return `<blockquote class="mr-quote" ${lineAttr}><p class="mr-quote-text">“${escapeHtml(label)}”</p>${prop('author') ? `<cite class="mr-quote-author">${escapeHtml(prop('author'))}</cite>` : ''}</blockquote>`;
        case 'code': return `<pre class="mr-code-block" ${lineAttr}><code>${escapeHtml(label)}</code></pre>`;
        case 'avatar': return `<span class="mr-avatar mr-avatar-initials" ${lineAttr} aria-label="${escapeAttribute(label)}">${escapeHtml((label || '?').slice(0, 2).toUpperCase())}</span>`;
        case 'video': return `<video class="mr-video" ${lineAttr} src="${escapeAttribute(prop('src') || label || '')}" controls></video>`;
        default: return '';
      }
    }

    function parseSectionLines(baseIndent) {
      let output = '';
      while (index < lines.length) {
        const rawLine = lines[index];
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.startsWith('#')) { index += 1; continue; }
        const indent = getIndent(rawLine);
        if (indent < baseIndent) break;
        const tokens = tokenizeLine(trimmed);
        if (!tokens.length) { index += 1; continue; }
        const keyword = tokens[0].toLowerCase();
        const blocks = ['nav','hero','section','header','footer','row','column','col','grid','card','box','list','form','accordion','tabs','tab'];
        const lineIndex = index;
        if (blocks.includes(keyword)) {
          index += 1;
          output += renderBlock(keyword, tokens.slice(1), parseSectionLines(indent + 2), lineIndex);
        } else {
          output += renderInline(keyword, tokens.slice(1), lineIndex) + '\n';
          index += 1;
        }
      }
      return output;
    }

    const declaration = lines[0]?.trim() || '';
    const titleMatch = declaration.match(/^Mr\.easy\s+"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];
    index = 1;
    return { title, body: parseSectionLines(0), vars };
  }

  function browserCompile(source, options = {}) {
    if (!source || !source.trim()) {
      return wrapPage('MR.easy Studio', '<div class="mr-hero"><h1 class="mr-title big mr-glow">Start Writing MR.easy Code</h1><p class="mr-subtitle">Every document starts with: Mr.easy "Title"</p></div>', options);
    }
    if (!source.trimStart().startsWith('Mr.easy')) {
      return wrapPage('MR.easy Studio', '<div class="mr-hero" style="min-height:60vh"><h2 class="mr-title medium mr-error">⚠ Declaration Required</h2><p class="mr-subtitle">Please add <code>Mr.easy "Your Page Title"</code> at line 1.</p></div>', options);
    }
    const compiled = compileLines(source.split('\n'));
    return wrapPage(compiled.title, compiled.body, options, compiled.headTags);
  }

  function wrapPage(title, body, options = {}, headTags = '') {
    const isDark = options.isDarkTheme ?? root.mreasyPreviewTheme !== 'light';
    const darkVars = `:root{--mr-primary:#6366f1;--mr-secondary:#8b5cf6;--mr-accent:#06b6d4;--mr-dark:#0f172a;--mr-dark2:#1e293b;--mr-dark3:#334155;--mr-light:#f8fafc;--mr-text:#e2e8f0;--mr-muted:#94a3b8;--mr-border:rgba(255,255,255,0.1);--mr-glass:rgba(255,255,255,0.05);--mr-radius:16px;--mr-shadow:0 25px 50px rgba(0,0,0,0.4);--mr-glow-color:#6366f1;--mr-font:'Inter','Space Grotesk',system-ui,sans-serif}`;
    const lightVars = `:root{--mr-primary:#6366f1;--mr-secondary:#8b5cf6;--mr-accent:#06b6d4;--mr-dark:#f8fafc;--mr-dark2:#ffffff;--mr-dark3:#e2e8f0;--mr-light:#0f172a;--mr-text:#0f172a;--mr-muted:#475569;--mr-border:rgba(0,0,0,0.1);--mr-glass:rgba(0,0,0,0.03);--mr-radius:16px;--mr-shadow:0 25px 50px rgba(0,0,0,0.1);--mr-glow-color:#6366f1;--mr-font:'Inter','Space Grotesk',system-ui,sans-serif}`;
    const themeCss = isDark ? darkVars : lightVars;
    const bodyBg = isDark ? '' : 'background:#f8fafc;color:#0f172a;';
    const navBg = isDark ? 'background:rgba(15,23,42,0.85);' : 'background:rgba(248,250,252,0.9);';
    const cardBg = isDark ? '' : '.mr-card{background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.08);}';

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${headTags}<title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
${themeCss}
html{scroll-behavior:smooth}body{font-family:var(--mr-font);background:var(--mr-dark);color:var(--mr-text);line-height:1.6;min-height:100vh;overflow-x:hidden;${bodyBg}}
.mr-nav{display:flex;align-items:center;justify-content:space-between;padding:20px 60px;position:sticky;top:0;z-index:1000;${navBg}backdrop-filter:blur(20px);border-bottom:1px solid var(--mr-border)}
.mr-nav-logo{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,var(--mr-primary),var(--mr-accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px}
.mr-nav-links{display:flex;gap:32px;align-items:center}
.mr-nav-item{color:var(--mr-muted);font-weight:500;cursor:pointer;transition:color 0.2s;font-size:0.95rem;text-decoration:none}
.mr-nav-item:hover{color:var(--mr-text)}
.mr-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px;min-height:90vh;position:relative;overflow:hidden}
.mr-hero::before{content:'';position:absolute;width:800px;height:800px;background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%);top:-200px;left:50%;transform:translateX(-50%);pointer-events:none}
.mr-hero-inner{position:relative;z-index:1;width:100%}
.mr-hero .mr-title{font-size:4rem;margin-bottom:24px}
.mr-hero .mr-subtitle{font-size:1.25rem;color:var(--mr-muted);margin-bottom:40px;max-width:600px}
.mr-hero .mr-row{gap:16px}
.mr-section{padding:80px 60px;max-width:1200px;margin:0 auto}
.mr-header{padding:60px;text-align:center}
.mr-footer{padding:60px;text-align:center;border-top:1px solid var(--mr-border);color:var(--mr-muted);background:var(--mr-dark2)}
.mr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.mr-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.mr-row.center{justify-content:center}
.mr-column{display:flex;flex-direction:column;gap:16px}
.mr-card{background:var(--mr-glass);border:1px solid var(--mr-border);border-radius:var(--mr-radius);padding:32px;backdrop-filter:blur(10px);transition:transform 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease}
.mr-card:hover{transform:translateY(-4px);border-color:rgba(99,102,241,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.3)}
.mr-card.glass{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)}
${cardBg}
.mr-box{background:var(--mr-dark2);border-radius:var(--mr-radius);padding:24px}
.mr-title{font-weight:800;line-height:1.1;letter-spacing:-1px;color:var(--mr-text)}
.mr-title.mr-size-big{font-size:3.5rem}
.mr-title.mr-size-medium{font-size:2.25rem;letter-spacing:-0.5px}
.mr-title.mr-size-small{font-size:1.5rem;letter-spacing:0}
.mr-title.mr-glow{background:linear-gradient(135deg,#ffffff 30%,var(--mr-primary) 60%,var(--mr-accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(99,102,241,0.4))}
.mr-subtitle{font-size:1.15rem;color:var(--mr-muted);font-weight:400;line-height:1.7;max-width:640px}
.mr-text{font-size:1rem;color:var(--mr-muted);line-height:1.8}
.mr-label{font-size:0.9rem;font-weight:600;color:var(--mr-text);display:block;margin-bottom:6px}
.mr-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:12px;font-size:1rem;font-weight:600;font-family:var(--mr-font);border:none;cursor:pointer;transition:all 0.25s ease;text-decoration:none;background:linear-gradient(135deg,var(--mr-primary),var(--mr-secondary));color:white;box-shadow:0 4px 15px rgba(99,102,241,0.3);position:relative;overflow:hidden}
.mr-button:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(99,102,241,0.5)}
.mr-button:active{transform:translateY(0)}
.mr-button.mr-btn-outline{background:transparent;border:2px solid var(--mr-primary);color:var(--mr-primary);box-shadow:none}
.mr-button.mr-btn-outline:hover{background:var(--mr-primary);color:white}
.mr-button.mr-btn-big{padding:18px 44px;font-size:1.125rem;border-radius:14px}
.mr-button.mr-btn-small{padding:9px 20px;font-size:0.875rem;border-radius:10px}
.mr-button.mr-btn-blue{background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 4px 15px rgba(59,130,246,0.3)}
.mr-button.mr-btn-green{background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 4px 15px rgba(34,197,94,0.3)}
.mr-button.mr-btn-red{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 4px 15px rgba(239,68,68,0.3)}
.mr-button.mr-btn-orange{background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 4px 15px rgba(249,115,22,0.3)}
.mr-button.mr-btn-purple{background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 15px rgba(139,92,246,0.3)}
.mr-button.mr-btn-pink{background:linear-gradient(135deg,#ec4899,#db2777);box-shadow:0 4px 15px rgba(236,72,153,0.3)}
.mr-input{width:100%;padding:13px 16px;background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:10px;color:var(--mr-text);font-size:1rem;font-family:var(--mr-font);transition:border-color 0.2s,box-shadow 0.2s;outline:none}
.mr-input:focus{border-color:var(--mr-primary);box-shadow:0 0 0 3px rgba(99,102,241,0.2)}
.mr-form{display:flex;flex-direction:column;gap:16px}
.mr-image{max-width:100%;display:block}
.mr-image.mr-rounded{border-radius:var(--mr-radius)}
.mr-image.mr-shadow{box-shadow:var(--mr-shadow)}
.mr-link{color:var(--mr-primary);text-decoration:none;font-weight:500;transition:color 0.2s}
.mr-link:hover{color:var(--mr-accent)}
.mr-video{max-width:100%;border-radius:var(--mr-radius)}
.mr-icon{font-size:1.5rem;color:var(--mr-primary)}
.mr-list{padding-left:24px;color:var(--mr-muted);line-height:2}
.mr-item{padding:4px 0}
.mr-divider{border:none;border-top:1px solid var(--mr-border);margin:32px 0}
.mr-spacer{display:block}
.mr-shadow{box-shadow:var(--mr-shadow)}
.mr-rounded{border-radius:50%}
.mr-glass{background:rgba(255,255,255,0.05);backdrop-filter:blur(12px)}
.mr-center{text-align:center}
.mr-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px;border:1px solid var(--mr-border);background:var(--mr-glass);color:var(--mr-text);text-transform:uppercase}
.mr-tag{display:inline-block;padding:3px 10px;border-radius:6px;font-size:0.8rem;font-weight:500;background:rgba(99,102,241,0.12);color:var(--mr-primary);border:1px solid rgba(99,102,241,0.2);margin:2px;cursor:pointer;transition:all 0.2s}
.mr-alert{display:flex;align-items:flex-start;gap:12px;padding:16px 20px;border-radius:12px;font-size:0.95rem;border:1px solid}
.mr-alert-icon{font-size:1.1rem;font-weight:900;flex-shrink:0}
.mr-alert-info{background:rgba(6,182,212,0.1);border-color:rgba(6,182,212,0.3);color:#67e8f9}
.mr-alert-success{background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.3);color:#86efac}
.mr-alert-warning{background:rgba(234,179,8,0.1);border-color:rgba(234,179,8,0.3);color:#fde68a}
.mr-alert-error{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#fca5a5}
.mr-progress-wrap{width:100%}
.mr-progress-label{display:flex;justify-content:space-between;font-size:0.85rem;color:var(--mr-muted);margin-bottom:6px;font-weight:500}
.mr-progress-bar{background:var(--mr-dark3);border-radius:999px;height:8px;overflow:hidden}
.mr-progress-fill{height:100%;border-radius:999px;transition:width 1s ease;background:var(--mr-primary)}
.mr-avatar{border-radius:50%;object-fit:cover;display:inline-flex;align-items:center;justify-content:center}
.mr-avatar-initials{background:linear-gradient(135deg,var(--mr-primary),var(--mr-accent));color:white;font-weight:800;font-size:1.1rem}
.mr-quote{border-left:4px solid var(--mr-primary);padding:20px 28px;background:var(--mr-glass);border-radius:0 var(--mr-radius) var(--mr-radius) 0;backdrop-filter:blur(10px)}
.mr-quote-text{font-size:1.15rem;line-height:1.7;color:var(--mr-text);font-style:italic;margin-bottom:12px}
.mr-quote-author{color:var(--mr-primary);font-weight:600;font-size:0.9rem}
.mr-testimonial{background:var(--mr-glass);border:1px solid var(--mr-border);border-radius:var(--mr-radius);padding:28px;backdrop-filter:blur(10px)}
.mr-testimonial-text{font-size:1.05rem;color:var(--mr-text);line-height:1.8;margin-bottom:20px;font-style:italic}
.mr-testimonial-author{display:flex;flex-direction:column;gap:2px}
.mr-testimonial-author strong{color:var(--mr-text);font-weight:700}
.mr-testimonial-author span{color:var(--mr-muted);font-size:0.85rem}
.mr-code-inline{background:var(--mr-dark3);color:var(--mr-accent);padding:2px 7px;border-radius:5px;font-family:monospace;font-size:0.9em}
.mr-code-block{background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:12px;padding:24px;overflow-x:auto;font-family:monospace;font-size:0.88rem;line-height:1.75;color:#94a3b8}
.mr-stat{display:flex;flex-direction:column;align-items:center;padding:32px 20px}
.mr-stat-value{font-size:3rem;font-weight:900;letter-spacing:-2px;background:linear-gradient(135deg,#fff 30%,var(--mr-primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1}
.mr-stat-label{font-size:0.9rem;color:var(--mr-muted);font-weight:500;margin-top:8px}
.mr-rating{display:inline-flex;align-items:center;gap:2px}
.mr-star{font-size:1.3rem;color:var(--mr-dark3);transition:color 0.2s}
.mr-star.filled{color:#f59e0b}
.mr-rating-label{margin-left:8px;font-size:0.9rem;color:var(--mr-muted)}
.mr-countdown{text-align:center}
.mr-countdown-title{font-size:1.1rem;color:var(--mr-muted);margin-bottom:20px}
.mr-countdown-timer{display:inline-flex;align-items:center;gap:8px}
.mr-cd-unit{display:flex;flex-direction:column;align-items:center;background:var(--mr-glass);border:1px solid var(--mr-border);border-radius:12px;padding:16px 20px;min-width:72px}
.mr-cd-num{font-size:2.5rem;font-weight:900;color:var(--mr-text);line-height:1}
.mr-cd-lbl{font-size:0.65rem;color:var(--mr-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.mr-cd-sep{font-size:2rem;font-weight:900;color:var(--mr-primary)}
.mr-steps{display:flex;flex-direction:column;gap:0}
.mr-step{display:flex;gap:20px;position:relative;padding-bottom:32px}
.mr-step:last-child{padding-bottom:0}
.mr-step::before{content:'';position:absolute;left:19px;top:40px;width:2px;height:calc(100% - 8px);background:var(--mr-border)}
.mr-step:last-child::before{display:none}
.mr-step-num{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--mr-primary),var(--mr-secondary));color:white;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;z-index:1}
.mr-step-done .mr-step-num{background:linear-gradient(135deg,#22c55e,#16a34a)}
.mr-step-body{padding-top:8px}
.mr-step-title{font-weight:700;color:var(--mr-text);font-size:1rem;margin-bottom:4px}
.mr-sidebar{background:var(--mr-dark2);border-right:1px solid var(--mr-border);padding:24px 16px;min-width:240px}
.mr-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center}
.mr-modal.open{display:flex}
.mr-modal-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px)}
.mr-modal-box{position:relative;background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:20px;padding:36px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;z-index:1;box-shadow:0 40px 80px rgba(0,0,0,0.5)}
.mr-modal-close{position:absolute;top:16px;right:16px;background:var(--mr-dark3);border:none;color:var(--mr-muted);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center}
.mr-modal-title{font-size:1.3rem;font-weight:800;color:var(--mr-text);margin-bottom:16px}
.mr-dropdown{position:relative;display:inline-block}
.mr-dropdown-btn{background:var(--mr-glass);border:1px solid var(--mr-border);color:var(--mr-text);padding:10px 18px;border-radius:10px;cursor:pointer;font-family:var(--mr-font);font-size:0.9rem;font-weight:600;transition:all 0.2s}
.mr-dropdown-btn:hover{border-color:var(--mr-primary)}
.mr-dropdown-menu{position:absolute;top:calc(100% + 8px);left:0;background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:12px;min-width:180px;padding:6px;box-shadow:0 20px 40px rgba(0,0,0,0.4);opacity:0;pointer-events:none;transform:translateY(-8px);transition:all 0.2s;z-index:100}
.mr-dropdown:hover .mr-dropdown-menu,.mr-dropdown.open .mr-dropdown-menu{opacity:1;pointer-events:auto;transform:translateY(0)}
.mr-dropdown-menu .mr-nav-item{display:block;padding:10px 14px;border-radius:8px;color:var(--mr-muted);font-size:0.9rem}
.mr-dropdown-menu .mr-nav-item:hover{background:rgba(99,102,241,0.1);color:var(--mr-text)}
.mr-accordion{border:1px solid var(--mr-border);border-radius:var(--mr-radius);margin-bottom:8px;overflow:hidden}
.mr-accordion-btn{width:100%;background:var(--mr-glass);border:none;color:var(--mr-text);font-size:1rem;font-family:var(--mr-font);font-weight:600;padding:18px 24px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background 0.2s}
.mr-accordion-btn:hover{background:rgba(99,102,241,0.08)}
.mr-accordion-icon{transition:transform 0.3s}
.mr-accordion-body{background:var(--mr-dark2);padding:0;max-height:0;overflow:hidden;transition:max-height 0.35s ease,padding 0.35s ease}
.mr-accordion-body.open{max-height:800px;padding:20px 24px}
.mr-tabs{border:1px solid var(--mr-border);border-radius:var(--mr-radius);overflow:hidden}
.mr-tab-bar{display:flex;background:var(--mr-dark2);border-bottom:1px solid var(--mr-border);overflow-x:auto}
.mr-tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--mr-muted);font-family:var(--mr-font);font-size:0.9rem;font-weight:600;padding:14px 24px;cursor:pointer;transition:all 0.2s;white-space:nowrap}
.mr-tab-btn:hover{color:var(--mr-text)}
.mr-tab-btn.active{color:var(--mr-primary);border-bottom-color:var(--mr-primary)}
.mr-tab-content{position:relative}
.mr-tab-pane{display:none;padding:24px}
.mr-tab-pane.active{display:block}
.mr-table-wrapper{overflow-x:auto;border-radius:var(--mr-radius);border:1px solid var(--mr-border)}
.mr-table{width:100%;border-collapse:collapse;font-size:0.95rem}
.mr-th{background:var(--mr-dark2);color:var(--mr-text);font-weight:700;padding:14px 20px;text-align:left;border-bottom:2px solid var(--mr-border);white-space:nowrap}
.mr-td{padding:13px 20px;border-bottom:1px solid var(--mr-border);color:var(--mr-muted)}
.mr-tr:hover .mr-td{background:rgba(99,102,241,0.04)}
.mr-tr:last-child .mr-td{border-bottom:none}
.mr-checkbox-wrap{display:inline-flex;align-items:center;gap:10px;cursor:pointer}
.mr-checkbox{width:18px;height:18px;accent-color:var(--mr-primary);cursor:pointer}
.mr-checkbox-label{font-size:0.95rem;color:var(--mr-text)}
.mr-toggle-wrap{display:inline-flex;align-items:center;gap:12px;cursor:pointer}
.mr-toggle-input{display:none}
.mr-toggle-slider{position:relative;width:48px;height:26px;background:var(--mr-dark3);border-radius:999px;transition:background 0.3s;flex-shrink:0}
.mr-toggle-slider::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;background:white;border-radius:50%;transition:transform 0.3s}
.mr-toggle-input:checked+.mr-toggle-slider{background:var(--mr-primary)}
.mr-toggle-input:checked+.mr-toggle-slider::after{transform:translateX(22px)}
.mr-toggle-label{font-size:0.95rem;color:var(--mr-text)}
.mr-embed-wrapper{position:relative;border-radius:var(--mr-radius);overflow:hidden}
.mr-embed{width:100%;border:none;border-radius:var(--mr-radius)}
@keyframes mr-float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-10px)}}
@keyframes mr-pulse-glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 40px rgba(99,102,241,0.7)}}
.mr-anim-float{animation:mr-float 3s ease-in-out infinite}
.mr-anim-glow{animation:mr-pulse-glow 2s ease-in-out infinite}
@media(max-width:768px){.mr-nav{padding:16px 24px}.mr-nav-links{gap:20px}.mr-section{padding:60px 24px}.mr-hero{padding:80px 24px}.mr-hero .mr-title{font-size:2.5rem}.mr-title.mr-size-big{font-size:2.25rem}.mr-grid{grid-template-columns:1fr}.mr-row{flex-direction:column}}
.mr-tab-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));}.mr-tab-item{display:contents}.mr-tab-pane{grid-column:1/-1;display:none}.mr-tab-pane.active{display:block}
</style></head><body>${body}<script>
(function(){let activeOutline=null;document.addEventListener('mouseover',function(event){const element=event.target.closest('[data-line]');if(element&&element!==activeOutline){if(activeOutline)activeOutline.style.outline='none';activeOutline=element;activeOutline.style.outline='2px dashed #6366f1';activeOutline.style.outlineOffset='2px';activeOutline.title='Click to jump to line in code editor'}});document.addEventListener('mouseout',function(){if(activeOutline){activeOutline.style.outline='none';activeOutline=null}});document.addEventListener('click',function(event){const element=event.target.closest('[data-line]');if(element){const line=parseInt(element.getAttribute('data-line'),10);if(!Number.isNaN(line))window.parent.postMessage({type:'JUMP_TO_LINE',line},'*')}})})();
window.mrToggle=function(id,button){var body=document.getElementById(id);if(!body)return;var open=body.classList.toggle('open');if(button){button.setAttribute('aria-expanded',String(open));var icon=button.querySelector('.mr-accordion-icon');if(icon)icon.style.transform=open?'rotate(180deg)':'rotate(0deg')}};
window.mrSelectTab=function(button){var tabs=button.closest('.mr-tabs');if(!tabs)return;tabs.querySelectorAll('.mr-tab-btn').forEach(function(item){item.classList.remove('active');item.setAttribute('aria-selected','false')});tabs.querySelectorAll('.mr-tab-pane').forEach(function(item){item.classList.remove('active')});button.classList.add('active');button.setAttribute('aria-selected','true');var pane=tabs.querySelector('#'+button.getAttribute('data-tab-target'));if(pane)pane.classList.add('active')};
</script></body></html>`;
  }

  registerCodeMirrorMode();
  root.MrEasyCompiler = Object.freeze({ KEYWORDS, STYLE_WORDS, COLOR_MAP, ICON_MAP, SIZE_MAP, STARTER, registerCodeMirrorMode, browserCompile, compileLines, wrapPage });
})(window);
