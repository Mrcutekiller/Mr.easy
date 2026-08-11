/**
 * MR.easy Built-in Styles, Animations, and Icon Map
 * The global design system for every MR.easy page.
 */

// ── Color Map ─────────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:   '#3b82f6',  purple: '#8b5cf6',  green:  '#22c55e',
  red:    '#ef4444',  orange: '#f97316',  pink:   '#ec4899',
  yellow: '#eab308',  cyan:   '#06b6d4',  white:  '#ffffff',
  black:  '#0f172a',  gray:   '#6b7280',
};

// ── Font Size Map ──────────────────────────────────────────────────────────────
const SIZE_MAP = {
  big:    { title: '3.5rem',  text: '1.25rem', button: '1.125rem', padding: '16px 36px' },
  medium: { title: '2rem',    text: '1rem',    button: '1rem',     padding: '12px 28px' },
  small:  { title: '1.25rem', text: '0.875rem',button: '0.875rem', padding: '8px 20px'  },
  tiny:   { title: '0.875rem',text: '0.75rem', button: '0.75rem',  padding: '6px 14px'  },
};

// ── Icon Map ───────────────────────────────────────────────────────────────────
const iconMap = {
  star:     'fa-star',    heart:    'fa-heart',   home:     'fa-house',
  user:     'fa-user',    check:    'fa-check',   close:    'fa-xmark',
  search:   'fa-magnifying-glass',  plus: 'fa-plus',  minus: 'fa-minus',
  mail:     'fa-envelope',arrow:    'fa-arrow-right', link: 'fa-link',
  image:    'fa-image',   play:     'fa-play',    pause:    'fa-pause',
  code:     'fa-code',    globe:    'fa-globe',   bolt:     'fa-bolt',
  fire:     'fa-fire',    lock:     'fa-lock',    key:      'fa-key',
  info:     'fa-circle-info', warn: 'fa-triangle-exclamation',
  rocket:   'fa-rocket',  moon:     'fa-moon',    sun:      'fa-sun',
  diamond:  'fa-gem',     chat:     'fa-comments',phone:    'fa-phone',
  settings: 'fa-gear',    trash:    'fa-trash',   edit:     'fa-pen',
  download: 'fa-download',upload:   'fa-upload',  share:    'fa-share-nodes',
};

// ── Builtin Animations (injected into every page) ─────────────────────────────
const builtinAnimations = `
<script>
// MR.easy Auto-Animate — smooth entrance animations on scroll
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.mr-section, .mr-card, .mr-title, .mr-text, .mr-button, .mr-hero').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Animate elements already in view
  setTimeout(() => {
    document.querySelectorAll('.mr-hero .mr-title, .mr-hero .mr-subtitle, .mr-hero .mr-button').forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 150);
    });
  }, 100);

  // Accordion toggle helper
  window.mrToggle = function(id) {
    const body = document.getElementById(id);
    const btn  = body && body.previousElementSibling;
    if (!body) return;
    const open = body.classList.toggle('open');
    if (btn) {
      const icon = btn.querySelector('.mr-accordion-icon');
      if (icon) icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  // Two-Way Live Preview Editing Event Listener
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-mreasy-text], .mr-title, .mr-text, .mr-button, .mr-card, .mr-subtitle');
    if (!el) return;
    const text = el.dataset.mreasyText || el.textContent.trim();
    const type = el.dataset.mreasyType || (el.classList.contains('mr-title') ? 'title' : el.classList.contains('mr-text') ? 'text' : el.classList.contains('mr-button') ? 'button' : 'element');
    window.parent.postMessage({ type: 'PREVIEW_ELEMENT_EDIT', elementText: text, elementType: type }, '*');
  });
})();
</script>
`;

// ── Global CSS Design System ───────────────────────────────────────────────────
const builtinStyles = `
  /* MR.easy Global Design System */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mr-primary:    #6366f1;
    --mr-secondary:  #8b5cf6;
    --mr-accent:     #06b6d4;
    --mr-dark:       #0f172a;
    --mr-dark2:      #1e293b;
    --mr-dark3:      #334155;
    --mr-light:      #f8fafc;
    --mr-text:       #e2e8f0;
    --mr-muted:      #94a3b8;
    --mr-border:     rgba(255,255,255,0.1);
    --mr-glass:      rgba(255,255,255,0.05);
    --mr-radius:     16px;
    --mr-shadow:     0 25px 50px rgba(0,0,0,0.4);
    --mr-glow-color: #6366f1;
    --mr-font:       'Inter', 'Space Grotesk', system-ui, sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--mr-font);
    background: var(--mr-dark);
    color: var(--mr-text);
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── NAVIGATION ── */
  .mr-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 60px;
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(15,23,42,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--mr-border);
  }
  .mr-nav-logo {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--mr-primary), var(--mr-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }
  .mr-nav-links {
    display: flex;
    gap: 32px;
    align-items: center;
  }
  .mr-nav-links .mr-link {
    color: var(--mr-muted);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
    font-size: 0.95rem;
  }
  .mr-nav-links .mr-link:hover { color: var(--mr-text); }
  .mr-nav-item {
    color: var(--mr-muted);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
    font-size: 0.95rem;
    text-decoration: none;
  }
  .mr-nav-item:hover { color: var(--mr-text); }

  /* ── HERO ── */
  .mr-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 40px;
    min-height: 90vh;
    position: relative;
    overflow: hidden;
  }
  .mr-hero::before {
    content: '';
    position: absolute;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .mr-hero .mr-title { font-size: 4rem; margin-bottom: 24px; }
  .mr-hero .mr-subtitle { font-size: 1.25rem; color: var(--mr-muted); margin-bottom: 40px; max-width: 600px; }
  .mr-hero .mr-row { gap: 16px; }

  /* ── SECTIONS ── */
  .mr-section {
    padding: 80px 60px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .mr-section-full { padding: 80px 60px; }

  .mr-header {
    padding: 60px;
    text-align: center;
  }

  /* ── FOOTER ── */
  .mr-footer {
    padding: 60px;
    text-align: center;
    border-top: 1px solid var(--mr-border);
    color: var(--mr-muted);
    background: var(--mr-dark2);
  }

  /* ── GRID & LAYOUT ── */
  .mr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }
  .mr-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
  .mr-row.center { justify-content: center; }
  .mr-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── CARD ── */
  .mr-card {
    background: var(--mr-glass);
    border: 1px solid var(--mr-border);
    border-radius: var(--mr-radius);
    padding: 32px;
    backdrop-filter: blur(10px);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .mr-card:hover {
    transform: translateY(-4px);
    border-color: rgba(99,102,241,0.4);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }
  .mr-card.glass {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .mr-box {
    background: var(--mr-dark2);
    border-radius: var(--mr-radius);
    padding: 24px;
  }

  /* ── TYPOGRAPHY ── */
  .mr-title {
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1px;
    color: var(--mr-text);
  }
  .mr-title.mr-size-big    { font-size: 3.5rem; }
  .mr-title.mr-size-medium { font-size: 2.25rem; letter-spacing: -0.5px; }
  .mr-title.mr-size-small  { font-size: 1.5rem; letter-spacing: 0; }
  .mr-title.mr-size-tiny   { font-size: 1rem;   letter-spacing: 0; }

  .mr-title.mr-glow {
    background: linear-gradient(135deg, #ffffff 30%, var(--mr-primary) 60%, var(--mr-accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 30px rgba(99,102,241,0.4));
  }

  .mr-subtitle {
    font-size: 1.15rem;
    color: var(--mr-muted);
    font-weight: 400;
    line-height: 1.7;
    max-width: 640px;
  }
  .mr-text {
    font-size: 1rem;
    color: var(--mr-muted);
    line-height: 1.8;
  }
  .mr-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--mr-text);
    display: block;
    margin-bottom: 6px;
  }

  /* ── BUTTON ── */
  .mr-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 28px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    font-family: var(--mr-font);
    border: none;
    cursor: pointer;
    transition: all 0.25s ease;
    text-decoration: none;
    background: linear-gradient(135deg, var(--mr-primary), var(--mr-secondary));
    color: white;
    box-shadow: 0 4px 15px rgba(99,102,241,0.3);
    position: relative;
    overflow: hidden;
  }
  .mr-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.2s;
  }
  .mr-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99,102,241,0.5);
  }
  .mr-button:hover::before { background: rgba(255,255,255,0.1); }
  .mr-button:active { transform: translateY(0); }

  .mr-button.mr-btn-outline {
    background: transparent;
    border: 2px solid var(--mr-primary);
    color: var(--mr-primary);
    box-shadow: none;
  }
  .mr-button.mr-btn-outline:hover {
    background: var(--mr-primary);
    color: white;
  }
  .mr-button.mr-btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--mr-text);
    box-shadow: none;
    border: 1px solid var(--mr-border);
  }
  .mr-button.mr-btn-big    { padding: 18px 44px; font-size: 1.125rem; border-radius: 14px; }
  .mr-button.mr-btn-small  { padding: 9px 20px;  font-size: 0.875rem; border-radius: 10px; }
  .mr-button.mr-btn-blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 15px rgba(59,130,246,0.3); }
  .mr-button.mr-btn-green  { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 4px 15px rgba(34,197,94,0.3); }
  .mr-button.mr-btn-red    { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 15px rgba(239,68,68,0.3); }
  .mr-button.mr-btn-orange { background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 4px 15px rgba(249,115,22,0.3); }
  .mr-button.mr-btn-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 15px rgba(139,92,246,0.3); }
  .mr-button.mr-btn-pink   { background: linear-gradient(135deg, #ec4899, #db2777); box-shadow: 0 4px 15px rgba(236,72,153,0.3); }

  /* ── INPUT / FORM ── */
  .mr-input {
    width: 100%;
    padding: 13px 16px;
    background: var(--mr-dark2);
    border: 1px solid var(--mr-border);
    border-radius: 10px;
    color: var(--mr-text);
    font-size: 1rem;
    font-family: var(--mr-font);
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .mr-input:focus {
    border-color: var(--mr-primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
  }
  .mr-form { display: flex; flex-direction: column; gap: 16px; }

  /* ── IMAGE ── */
  .mr-image {
    max-width: 100%;
    display: block;
  }
  .mr-image.mr-rounded  { border-radius: var(--mr-radius); }
  .mr-image.mr-shadow   { box-shadow: var(--mr-shadow); }

  /* ── LINK ── */
  .mr-link {
    color: var(--mr-primary);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }
  .mr-link:hover { color: var(--mr-accent); }

  /* ── VIDEO ── */
  .mr-video { max-width: 100%; border-radius: var(--mr-radius); }

  /* ── ICON ── */
  .mr-icon { font-size: 1.5rem; color: var(--mr-primary); }

  /* ── LIST ── */
  .mr-list { padding-left: 24px; color: var(--mr-muted); line-height: 2; }
  .mr-item { padding: 4px 0; }

  /* ── DIVIDER & SPACER ── */
  .mr-divider {
    border: none;
    border-top: 1px solid var(--mr-border);
    margin: 32px 0;
  }
  .mr-spacer { display: block; }

  /* ── UTILITY MODIFIERS ── */
  .mr-shadow    { box-shadow: var(--mr-shadow); }
  .mr-rounded   { border-radius: 50%; }
  .mr-glass     { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); }
  .mr-center    { text-align: center; }
  .mr-gradient-text {
    background: linear-gradient(135deg, var(--mr-primary), var(--mr-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── ANIMATIONS ── */
  @keyframes mr-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes mr-pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
    50%       { box-shadow: 0 0 40px rgba(99,102,241,0.7); }
  }
  @keyframes mr-gradient-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .mr-anim-float   { animation: mr-float 3s ease-in-out infinite; }
  .mr-anim-glow    { animation: mr-pulse-glow 2s ease-in-out infinite; }
  .mr-anim-gradient {
    background: linear-gradient(270deg, var(--mr-primary), var(--mr-accent), var(--mr-secondary));
    background-size: 400% 400%;
    animation: mr-gradient-shift 6s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .mr-nav { padding: 16px 24px; }
    .mr-nav-links { gap: 20px; }
    .mr-section { padding: 60px 24px; }
    .mr-hero { padding: 80px 24px; }
    .mr-hero .mr-title { font-size: 2.5rem; }
    .mr-title.mr-size-big { font-size: 2.25rem; }
    .mr-grid { grid-template-columns: 1fr; }
    .mr-row { flex-direction: column; }
  }

  /* ══════════════════════════════════════════════════
     MR.easy v2.0 — New Language Elements
  ══════════════════════════════════════════════════ */

  /* ── ACCORDION ── */
  .mr-accordion { border: 1px solid var(--mr-border); border-radius: var(--mr-radius); margin-bottom: 8px; overflow: hidden; }
  .mr-accordion-btn { width:100%; background:var(--mr-glass); border:none; color:var(--mr-text); font-size:1rem; font-family:var(--mr-font); font-weight:600; padding:18px 24px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; transition:background 0.2s; }
  .mr-accordion-btn:hover { background:rgba(99,102,241,0.08); }
  .mr-accordion-icon { transition: transform 0.3s; }
  .mr-accordion-body { background:var(--mr-dark2); padding:0; max-height:0; overflow:hidden; transition:max-height 0.35s ease, padding 0.35s ease; }
  .mr-accordion-body.open { max-height:800px; padding:20px 24px; }

  /* ── TABS ── */
  .mr-tabs { border:1px solid var(--mr-border); border-radius:var(--mr-radius); overflow:hidden; }
  .mr-tab-bar { display:flex; background:var(--mr-dark2); border-bottom:1px solid var(--mr-border); overflow-x:auto; }
  .mr-tab-btn { background:transparent; border:none; border-bottom:2px solid transparent; color:var(--mr-muted); font-family:var(--mr-font); font-size:0.9rem; font-weight:600; padding:14px 24px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .mr-tab-btn:hover { color:var(--mr-text); }
  .mr-tab-btn.active { color:var(--mr-primary); border-bottom-color:var(--mr-primary); }
  .mr-tab-content { position:relative; }
  .mr-tab-pane { display:none; padding:24px; }
  .mr-tab-pane.active { display:block; }

  /* ── TABLE ── */
  .mr-table-wrapper { overflow-x:auto; border-radius:var(--mr-radius); border:1px solid var(--mr-border); }
  .mr-table { width:100%; border-collapse:collapse; font-size:0.95rem; }
  .mr-th { background:var(--mr-dark2); color:var(--mr-text); font-weight:700; padding:14px 20px; text-align:left; border-bottom:2px solid var(--mr-border); white-space:nowrap; }
  .mr-td { padding:13px 20px; border-bottom:1px solid var(--mr-border); color:var(--mr-muted); }
  .mr-tr:hover .mr-td { background:rgba(99,102,241,0.04); }
  .mr-tr:last-child .mr-td { border-bottom:none; }

  /* ── BADGE ── */
  .mr-badge { display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:700; letter-spacing:0.5px; border:1px solid var(--mr-border); background:var(--mr-glass); color:var(--mr-text); text-transform:uppercase; }

  /* ── TAG ── */
  .mr-tag { display:inline-block; padding:3px 10px; border-radius:6px; font-size:0.8rem; font-weight:500; background:rgba(99,102,241,0.12); color:var(--mr-primary); border:1px solid rgba(99,102,241,0.2); margin:2px; cursor:pointer; transition:all 0.2s; }
  .mr-tag:hover { background:rgba(99,102,241,0.25); }

  /* ── ALERT ── */
  .mr-alert { display:flex; align-items:flex-start; gap:12px; padding:16px 20px; border-radius:12px; font-size:0.95rem; border:1px solid; }
  .mr-alert-icon { font-size:1.1rem; font-weight:900; flex-shrink:0; }
  .mr-alert-info    { background:rgba(6,182,212,0.1);    border-color:rgba(6,182,212,0.3);    color:#67e8f9; }
  .mr-alert-success { background:rgba(34,197,94,0.1);   border-color:rgba(34,197,94,0.3);   color:#86efac; }
  .mr-alert-warning { background:rgba(234,179,8,0.1);   border-color:rgba(234,179,8,0.3);   color:#fde68a; }
  .mr-alert-error   { background:rgba(239,68,68,0.1);   border-color:rgba(239,68,68,0.3);   color:#fca5a5; }

  /* ── PROGRESS ── */
  .mr-progress-wrap { width:100%; }
  .mr-progress-label { display:flex; justify-content:space-between; font-size:0.85rem; color:var(--mr-muted); margin-bottom:6px; font-weight:500; }
  .mr-progress-bar { background:var(--mr-dark3); border-radius:999px; height:8px; overflow:hidden; }
  .mr-progress-fill { height:100%; border-radius:999px; transition:width 1s ease; background:var(--mr-primary); }

  /* ── AVATAR ── */
  .mr-avatar { border-radius:50%; object-fit:cover; display:inline-flex; align-items:center; justify-content:center; }
  .mr-avatar-initials { background:linear-gradient(135deg,var(--mr-primary),var(--mr-accent)); color:white; font-weight:800; font-size:1.1rem; }

  /* ── QUOTE ── */
  .mr-quote { border-left:4px solid var(--mr-primary); padding:20px 28px; background:var(--mr-glass); border-radius:0 var(--mr-radius) var(--mr-radius) 0; backdrop-filter:blur(10px); }
  .mr-quote-text { font-size:1.15rem; line-height:1.7; color:var(--mr-text); font-style:italic; margin-bottom:12px; }
  .mr-quote-author { color:var(--mr-primary); font-weight:600; font-size:0.9rem; }

  /* ── TESTIMONIAL ── */
  .mr-testimonial { background:var(--mr-glass); border:1px solid var(--mr-border); border-radius:var(--mr-radius); padding:28px; backdrop-filter:blur(10px); }
  .mr-testimonial-text { font-size:1.05rem; color:var(--mr-text); line-height:1.8; margin-bottom:20px; font-style:italic; }
  .mr-testimonial-author { display:flex; flex-direction:column; gap:2px; }
  .mr-testimonial-author strong { color:var(--mr-text); font-weight:700; }
  .mr-testimonial-author span { color:var(--mr-muted); font-size:0.85rem; }

  /* ── CODE ── */
  .mr-code-inline { background:var(--mr-dark3); color:var(--mr-accent); padding:2px 7px; border-radius:5px; font-family:monospace; font-size:0.9em; }
  .mr-code-block { background:var(--mr-dark2); border:1px solid var(--mr-border); border-radius:12px; padding:24px; overflow-x:auto; font-family:monospace; font-size:0.88rem; line-height:1.75; color:#94a3b8; }

  /* ── STAT ── */
  .mr-stat { display:flex; flex-direction:column; align-items:center; padding:32px 20px; }
  .mr-stat-value { font-size:3rem; font-weight:900; letter-spacing:-2px; background:linear-gradient(135deg,#fff 30%,var(--mr-primary)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; }
  .mr-stat-label { font-size:0.9rem; color:var(--mr-muted); font-weight:500; margin-top:8px; }

  /* ── SELECT ── */
  .mr-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='2' fill='none'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; cursor:pointer; }

  /* ── CHECKBOX ── */
  .mr-checkbox-wrap { display:inline-flex; align-items:center; gap:10px; cursor:pointer; }
  .mr-checkbox { width:18px; height:18px; accent-color:var(--mr-primary); cursor:pointer; }
  .mr-checkbox-label { font-size:0.95rem; color:var(--mr-text); }

  /* ── TOGGLE ── */
  .mr-toggle-wrap { display:inline-flex; align-items:center; gap:12px; cursor:pointer; }
  .mr-toggle-input { display:none; }
  .mr-toggle-slider { position:relative; width:48px; height:26px; background:var(--mr-dark3); border-radius:999px; transition:background 0.3s; flex-shrink:0; }
  .mr-toggle-slider::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; background:white; border-radius:50%; transition:transform 0.3s; }
  .mr-toggle-input:checked + .mr-toggle-slider { background:var(--mr-primary); }
  .mr-toggle-input:checked + .mr-toggle-slider::after { transform:translateX(22px); }
  .mr-toggle-label { font-size:0.95rem; color:var(--mr-text); }

  /* ── EMBED ── */
  .mr-embed-wrapper { position:relative; border-radius:var(--mr-radius); overflow:hidden; }
  .mr-embed { width:100%; border:none; border-radius:var(--mr-radius); }

  /* ── RATING ── */
  .mr-rating { display:inline-flex; align-items:center; gap:2px; }
  .mr-star { font-size:1.3rem; color:var(--mr-dark3); transition:color 0.2s; }
  .mr-star.filled { color:#f59e0b; }
  .mr-rating-label { margin-left:8px; font-size:0.9rem; color:var(--mr-muted); }

  /* ── COUNTDOWN ── */
  .mr-countdown { text-align:center; }
  .mr-countdown-title { font-size:1.1rem; color:var(--mr-muted); margin-bottom:20px; }
  .mr-countdown-timer { display:inline-flex; align-items:center; gap:8px; }
  .mr-cd-unit { display:flex; flex-direction:column; align-items:center; background:var(--mr-glass); border:1px solid var(--mr-border); border-radius:12px; padding:16px 20px; min-width:72px; }
  .mr-cd-num { font-size:2.5rem; font-weight:900; color:var(--mr-text); line-height:1; }
  .mr-cd-lbl { font-size:0.65rem; color:var(--mr-muted); text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
  .mr-cd-sep { font-size:2rem; font-weight:900; color:var(--mr-primary); }

  /* ── STEPS ── */
  .mr-steps { display:flex; flex-direction:column; gap:0; }
  .mr-step { display:flex; gap:20px; position:relative; padding-bottom:32px; }
  .mr-step:last-child { padding-bottom:0; }
  .mr-step::before { content:''; position:absolute; left:19px; top:40px; width:2px; height:calc(100% - 8px); background:var(--mr-border); }
  .mr-step:last-child::before { display:none; }
  .mr-step-num { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,var(--mr-primary),var(--mr-secondary)); color:white; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.9rem; z-index:1; }
  .mr-step-done .mr-step-num { background:linear-gradient(135deg,#22c55e,#16a34a); }
  .mr-step-body { padding-top:8px; }
  .mr-step-title { font-weight:700; color:var(--mr-text); font-size:1rem; margin-bottom:4px; }

  /* ── SIDEBAR ── */
  .mr-sidebar { background:var(--mr-dark2); border-right:1px solid var(--mr-border); padding:24px 16px; min-width:240px; }

  /* ── MODAL ── */
  .mr-modal { position:fixed; inset:0; z-index:9999; display:none; align-items:center; justify-content:center; }
  .mr-modal.open { display:flex; }
  .mr-modal-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); }
  .mr-modal-box { position:relative; background:var(--mr-dark2); border:1px solid var(--mr-border); border-radius:20px; padding:36px; max-width:560px; width:90%; max-height:80vh; overflow-y:auto; z-index:1; box-shadow:0 40px 80px rgba(0,0,0,0.5); }
  .mr-modal-close { position:absolute; top:16px; right:16px; background:var(--mr-dark3); border:none; color:var(--mr-muted); width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; }
  .mr-modal-title { font-size:1.3rem; font-weight:800; color:var(--mr-text); margin-bottom:16px; }

  /* ── DROPDOWN ── */
  .mr-dropdown { position:relative; display:inline-block; }
  .mr-dropdown-btn { background:var(--mr-glass); border:1px solid var(--mr-border); color:var(--mr-text); padding:10px 18px; border-radius:10px; cursor:pointer; font-family:var(--mr-font); font-size:0.9rem; font-weight:600; transition:all 0.2s; }
  .mr-dropdown-btn:hover { border-color:var(--mr-primary); }
  .mr-dropdown-menu { position:absolute; top:calc(100% + 8px); left:0; background:var(--mr-dark2); border:1px solid var(--mr-border); border-radius:12px; min-width:180px; padding:6px; box-shadow:0 20px 40px rgba(0,0,0,0.4); opacity:0; pointer-events:none; transform:translateY(-8px); transition:all 0.2s; z-index:100; }
  .mr-dropdown:hover .mr-dropdown-menu,
  .mr-dropdown:focus-within .mr-dropdown-menu,
  .mr-dropdown.open .mr-dropdown-menu { opacity:1; pointer-events:auto; transform:translateY(0); }
  .mr-dropdown-menu .mr-nav-item { display:block; padding:10px 14px; border-radius:8px; color:var(--mr-muted); font-size:0.9rem; }
  /* ── ANIMATION MODIFIERS ── */
  .fade-in { animation: mrFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .slide-up { animation: mrSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .pulse { animation: mrPulse 2s infinite; }
  .bounce { animation: mrBounce 2s infinite; }

  @keyframes mrFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes mrSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mrPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  @keyframes mrBounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } 60% { transform: translateY(-6px); } }

  /* ── NON-FATAL COMPILATION ERROR BOX ── */
  .mr-error-box {
    border: 1px dashed #ef4444;
    background: rgba(239, 68, 68, 0.08);
    color: #fca5a5;
    padding: 16px 20px;
    border-radius: 8px;
    margin: 16px 0;
    font-family: monospace;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .mr-error-box-header { font-weight: bold; color: #f87171; margin-bottom: 4px; }
`;

module.exports = { builtinStyles, builtinAnimations, iconMap, COLOR_MAP, SIZE_MAP };
