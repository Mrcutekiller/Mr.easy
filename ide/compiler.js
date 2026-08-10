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
    'animate','component','use','function','call',
    'accordion','tabs','tab','table','thead','tbody','tr','th','td',
    'badge','tag','alert','progress','avatar','quote','code','stat',
    'select','checkbox','toggle','embed','rating','countdown','steps','step',
    'testimonial','page','sidebar','modal','dropdown'];

  const STYLE_WORDS = ['big','medium','small','tiny','glow','shadow','rounded','outline',
    'bold','italic','dark','light','gradient','glass','center','left','right',
    'blue','red','green','purple','orange','pink','yellow','white','black','gray','cyan',
    'on','off','float','autoplay','required','ordered','done','checked','success','warning','error','info'];

  const COLOR_MAP = { blue:'#3b82f6', purple:'#8b5cf6', green:'#22c55e', red:'#ef4444', orange:'#f97316', pink:'#ec4899', yellow:'#eab308', white:'#fff', black:'#0f172a', gray:'#6b7280', cyan:'#06b6d4' };
  const ICON_MAP = { star:'fa-star', heart:'fa-heart', rocket:'fa-rocket', bolt:'fa-bolt', globe:'fa-globe', lock:'fa-lock', home:'fa-house', user:'fa-user', mail:'fa-envelope', check:'fa-check', code:'fa-code', fire:'fa-fire', diamond:'fa-gem', moon:'fa-moon', sun:'fa-sun', phone:'fa-phone', settings:'fa-gear', download:'fa-download', upload:'fa-upload', share:'fa-share-nodes', chat:'fa-comments', info:'fa-circle-info', warn:'fa-triangle-exclamation' };
  const SIZE_MAP = ['big','medium','small','tiny'];

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
    let source = line.trim();
    while (source) {
      if (source[0] === '"') {
        const end = source.indexOf('"', 1);
        tokens.push(source.slice(1, end === -1 ? undefined : end));
        source = end === -1 ? '' : source.slice(end + 1).trim();
      } else {
        const whitespace = source.search(/\s/);
        tokens.push(whitespace === -1 ? source : source.slice(0, whitespace));
        source = whitespace === -1 ? '' : source.slice(whitespace).trim();
      }
    }
    return tokens;
  }

  function compileLines(lines) {
    let title = 'MR.easy Page';
    let index = 0;
    const vars = {};

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
          const classes = `mr-title${size ? ` mr-title-size-${size}` : ''}${hasMod(tokens, 'glow') ? ' mr-glow' : ''}`;
          return `<${tag} class="${classes}" ${lineAttr} ${color ? `style="color:${color}"` : ''}>${label}</${tag}>`;
        }
        case 'subtitle': return `<p class="mr-subtitle" ${lineAttr} ${color ? `style="color:${color}"` : ''}>${label}</p>`;
        case 'text': return `<p class="mr-text" ${lineAttr} ${color ? `style="color:${color}"` : ''}>${label}</p>`;
        case 'label': return `<label class="mr-label" ${lineAttr} for="${prop('for') || ''}">${label}</label>`;
        case 'item': return `<li class="mr-item" ${lineAttr}>${label}</li>`;
        case 'button': {
          const buttonColor = btnColor(tokens);
          const sizeClass = size === 'big' ? 'mr-btn-big' : size === 'small' ? 'mr-btn-small' : '';
          const outlineClass = hasMod(tokens, 'outline') ? 'mr-btn-outline' : '';
          const action = prop('action') || '';
          const style = buttonColor && !outlineClass ? `background:${buttonColor.background};box-shadow:${buttonColor.boxShadow}` : '';
          return `<button class="mr-button ${sizeClass} ${outlineClass}" ${lineAttr} ${style ? `style="${style}"` : ''} onclick="${action ? resolveAction(action) : 'void 0'}">${label || 'Button'}</button>`;
        }
        case 'link': return `<a class="mr-link" ${lineAttr} href="${prop('url') || '#'}" ${color ? `style="color:${color}"` : ''}>${label || prop('url') || 'Link'}</a>`;
        case 'image': {
          const source = prop('src') || label || '';
          const dimensions = `${prop('width') ? `width:${prop('width')}px;` : ''}${prop('height') ? `height:${prop('height')}px;` : ''}`;
          return `<img class="mr-image${hasMod(tokens, 'rounded') ? ' mr-rounded' : ''}${hasMod(tokens, 'shadow') ? ' mr-shadow' : ''}" ${lineAttr} src="${source}" alt="${label}" ${dimensions ? `style="${dimensions}"` : ''}>`;
        }
        case 'icon': {
          const icon = ICON_MAP[label.toLowerCase()] || `fa-${label.toLowerCase() || 'star'}`;
          return `<i class="mr-icon fa ${icon}" ${lineAttr} ${color || prop('size') ? `style="${color ? `color:${color};` : ''}${prop('size') ? `font-size:${prop('size')}px;` : ''}"` : ''}></i>`;
        }
        case 'input': return `<input class="mr-input" ${lineAttr} type="${prop('type') || 'text'}" placeholder="${prop('placeholder') || label}" id="${prop('id') || ''}" name="${prop('id') || ''}">`;
        case 'logo': return `<div class="mr-nav-logo" ${lineAttr}>${label}</div>`;
        case 'links': return `<div class="mr-nav-links" ${lineAttr}>${tokens.filter(token => !token.includes(':')).map(item => `<a class="mr-nav-item" href="#${item.toLowerCase()}">${item}</a>`).join('')}</div>`;
        case 'divider': return `<hr class="mr-divider" ${lineAttr}>`;
        case 'spacer': return `<div class="mr-spacer" ${lineAttr} style="height:${prop('size') || '40'}px"></div>`;
        case 'video': return `<video class="mr-video" ${lineAttr} src="${prop('src') || label || ''}" controls></video>`;
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
        const blocks = ['nav','hero','section','header','footer','row','column','col','grid','card','box','list','form'];
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
    return wrapPage(compiled.title, compiled.body, options);
  }

  function wrapPage(title, body, options = {}) {
    const isDark = options.isDarkTheme ?? root.mreasyPreviewTheme !== 'light';
    const darkVars = `:root{--mr-primary:#C8963A;--mr-secondary:#E8B45A;--mr-accent:#4A7A2E;--mr-danger:#8B2020;--mr-dark:#080706;--mr-dark2:#141210;--mr-text:#F2EAD8;--mr-muted:#A69A86;--mr-border:rgba(242,234,216,.13);--mr-glass:rgba(200,150,58,.06);--mr-radius:2px;--mr-shadow:0 25px 60px rgba(0,0,0,.45);--mr-font:'Inter',system-ui,sans-serif;--mr-display:'Playfair Display',Georgia,serif}`;
    const lightVars = `:root{--mr-primary:#B88028;--mr-secondary:#9A681A;--mr-accent:#3A6A24;--mr-danger:#8B2020;--mr-dark:#F8F4EA;--mr-dark2:#FFFDF8;--mr-text:#241F18;--mr-muted:#6D6458;--mr-border:rgba(120,85,30,.22);--mr-glass:rgba(120,85,30,.04);--mr-radius:2px;--mr-shadow:0 18px 45px rgba(62,45,20,.14);--mr-font:'Inter',system-ui,sans-serif;--mr-display:'Playfair Display',Georgia,serif}`;
    const themeCss = isDark ? darkVars : lightVars;

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
${themeCss}
html{scroll-behavior:smooth}body{font-family:var(--mr-font);background:var(--mr-dark);color:var(--mr-text);line-height:1.6;min-height:100vh;overflow-x:hidden}.mr-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;position:sticky;top:0;z-index:1000;background:color-mix(in srgb,var(--mr-dark2) 92%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--mr-border);flex-wrap:wrap}.mr-nav-logo{font:500 1.35rem var(--mr-display);color:var(--mr-secondary)}.mr-nav-links{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.mr-nav-item{color:var(--mr-muted);text-decoration:none;font-weight:500;font-size:.88rem;transition:color .2s}.mr-nav-item:hover{color:var(--mr-text)}.mr-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 28px;min-height:68vh;position:relative;overflow:hidden}.mr-hero::before{content:'፨';position:absolute;color:var(--mr-primary);opacity:.05;font:26rem/1 Georgia,serif;top:-80px;left:-40px;pointer-events:none}.mr-hero-inner{position:relative;z-index:1;width:100%}.mr-section{padding:62px 28px;max-width:1200px;margin:0 auto;width:100%}.mr-header{padding:50px 28px;text-align:center}.mr-footer{padding:42px 28px;text-align:center;border-top:1px solid var(--mr-border);color:var(--mr-muted);background:var(--mr-dark2)}.mr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;width:100%}.mr-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.mr-column{display:flex;flex-direction:column;gap:12px}.mr-card{background:var(--mr-glass);border:1px solid var(--mr-border);border-radius:var(--mr-radius);padding:24px;transition:transform .3s,box-shadow .3s,border-color .3s}.mr-card:hover{transform:translateY(-3px);border-color:rgba(200,150,58,.5);box-shadow:var(--mr-shadow)}.mr-title{font:500 1.5rem/1.1 var(--mr-display);color:var(--mr-text);margin-bottom:14px;letter-spacing:-.03em}.mr-title-size-big,.mr-title.big{font-size:clamp(2rem,5vw,3.4rem)!important}.mr-title-size-medium,.mr-title.medium{font-size:clamp(1.45rem,3.5vw,2.35rem)!important}.mr-title-size-small,.mr-title.small{font-size:clamp(1rem,2.5vw,1.35rem)!important}.mr-glow{color:var(--mr-secondary);text-shadow:0 0 24px rgba(200,150,58,.3)}.mr-subtitle{font-size:1.05rem;color:var(--mr-muted);line-height:1.7;max-width:640px;margin:0 auto 16px}.mr-text{font-size:.95rem;color:var(--mr-muted);line-height:1.8;margin-bottom:12px}.mr-label{font-size:.85rem;font-weight:600;color:var(--mr-text);display:block;margin-bottom:6px}.mr-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 26px;border-radius:2px;font-size:.9rem;font-weight:600;font-family:var(--mr-font);border:1px solid var(--mr-primary);cursor:pointer;transition:all .25s;background:var(--mr-primary);color:#080706;box-shadow:0 4px 15px rgba(0,0,0,.24);margin:4px}.mr-button:hover{transform:translateY(-2px);background:var(--mr-secondary);border-color:var(--mr-secondary)}.mr-btn-big{padding:15px 34px!important;font-size:1rem!important}.mr-btn-small{padding:8px 16px!important;font-size:.8rem!important}.mr-btn-outline{background:transparent!important;border-color:var(--mr-primary)!important;color:var(--mr-secondary)!important;box-shadow:none!important}.mr-input{width:100%;padding:13px 16px;background:var(--mr-dark2);border:1px solid var(--mr-border);border-radius:2px;color:var(--mr-text);font-size:1rem;font-family:var(--mr-font);outline:none;margin-bottom:12px}.mr-input:focus{border-color:var(--mr-primary);box-shadow:0 0 0 2px rgba(200,150,58,.18)}.mr-form{display:flex;flex-direction:column;gap:8px;max-width:480px}.mr-image{max-width:100%;display:block}.mr-image.mr-rounded{border-radius:var(--mr-radius)}.mr-image.mr-shadow{box-shadow:var(--mr-shadow)}.mr-link{color:var(--mr-primary);text-decoration:none;font-weight:500}.mr-icon{font-size:2rem;color:var(--mr-primary);margin-bottom:12px;display:block}.mr-divider{border:none;border-top:1px solid var(--mr-border);margin:32px 0}.mr-spacer{display:block}.mr-shadow{box-shadow:var(--mr-shadow)}.mr-rounded{border-radius:50%}.mr-error{color:var(--mr-danger)!important}@media(max-width:768px){.mr-nav{padding:14px 18px}.mr-section{padding:52px 18px}.mr-hero{padding:74px 18px}.mr-grid{grid-template-columns:1fr}.mr-row{flex-direction:column;align-items:stretch}}
</style></head><body>${body}<script>(function(){let activeOutline=null;document.addEventListener('mouseover',function(event){const element=event.target.closest('[data-line]');if(element&&element!==activeOutline){if(activeOutline)activeOutline.style.outline='none';activeOutline=element;activeOutline.style.outline='2px dashed #C8963A';activeOutline.style.outlineOffset='2px';activeOutline.title='Click to jump to line in code editor'}});document.addEventListener('mouseout',function(){if(activeOutline){activeOutline.style.outline='none';activeOutline=null}});document.addEventListener('click',function(event){const element=event.target.closest('[data-line]');if(element){const line=parseInt(element.getAttribute('data-line'),10);if(!Number.isNaN(line))window.parent.postMessage({type:'JUMP_TO_LINE',line},'*')}})})();<\/script></body></html>`;
  }

  registerCodeMirrorMode();
  root.MrEasyCompiler = Object.freeze({ KEYWORDS, STYLE_WORDS, COLOR_MAP, ICON_MAP, SIZE_MAP, STARTER, registerCodeMirrorMode, browserCompile, compileLines, wrapPage });
})(window);
