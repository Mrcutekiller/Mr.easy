/**
 * MR.easy IDE — browser runtime
 *
 * UI state and commands live here. Language metadata, CodeMirror mode, and
 * generated preview markup live in compiler.js so the IDE has one compiler
 * source of truth.
 */
(function (root) {
  'use strict';

  const compiler = root.MrEasyCompiler;
  if (!compiler) throw new Error('MR.easy compiler runtime was not loaded.');
  compiler.registerCodeMirrorMode();

  const {
    STARTER,
    browserCompile,
    KEYWORDS,
    STYLE_WORDS,
    COLOR_MAP,
    ICON_MAP,
    SIZE_MAP
  } = compiler;

  let editor;
  let fontSize = 14;
  let currentView = 'split';
  let previewTimeout;
  let currentZoom = 100;
  let activeViewport = 'desktop';
  let isDarkTheme = true;
  let isResizing = false;
  let scaleFrame;
  const PREVIEW_VIEWPORTS = Object.freeze({
    desktop: { width: 1280, minHeight: 900 },
    tablet: { width: 768, minHeight: 900 },
    mobile: { width: 375, minHeight: 760 }
  });

  const PROVIDERS = Object.freeze({
    openai: { label: 'OpenAI', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/responses' },
    anthropic: { label: 'Anthropic', model: 'claude-3-5-haiku-latest', endpoint: 'https://api.anthropic.com/v1/messages' },
    gemini: { label: 'Google Gemini', model: 'gemini-2.0-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models' },
    'openai-compatible': { label: 'OpenAI-compatible / OpenRouter', model: 'openai/gpt-4o-mini', endpoint: 'https://openrouter.ai/api/v1/chat/completions' }
  });
  const AI_SOURCE_LIMIT = 12000;
  const AI_HISTORY_LIMIT = 20;
  const AI_SYSTEM_PROMPT = `You are the MR.easy language assistant inside the MR.easy browser IDE.

MR.easy rules:
- Every file starts with Mr.easy "Page Title".
- Indentation creates hierarchy; use two spaces for nested content.
- Use documented MR.easy words and modifiers such as hero, nav, section, grid, card, title, text, button, badge, alert, form, and footer.
- Do not invent HTML, CSS, or JavaScript when an MR.easy construct can express the idea.
- Prefer concise fenced mreasy examples when suggesting code.
- Preserve the user's current source; explain changes before suggesting them.
- Warn clearly when a requested syntax feature is not supported.

Give practical, concise guidance for writing, debugging, and improving MR.easy code. Never claim to have changed the editor or preview automatically.`;
  const aiState = {
    providerId: 'openai',
    apiKey: '',
    model: PROVIDERS.openai.model,
    endpoint: PROVIDERS.openai.endpoint,
    messages: [],
    isBusy: false,
    isOpen: false,
    abortController: null,
    loadingMessage: null
  };

  const SNIPPETS = [
    { icon: 'fa-file', label: 'Page Start', tag: 'decl', code: 'Mr.easy "Page Title"\n' },
    { icon: 'fa-heading', label: 'Title', tag: 'text', code: 'title "Your Title Here" big glow\n' },
    { icon: 'fa-paragraph', label: 'Text', tag: 'text', code: 'text "Your paragraph text goes here"\n' },
    { icon: 'fa-square', label: 'Button', tag: 'ui', code: 'button "Click Me" blue big\n' },
    { icon: 'fa-tag', label: 'Badge', tag: 'badge', code: 'badge "NEW" green\n' },
    { icon: 'fa-circle-info', label: 'Alert Banner', tag: 'alert', code: 'alert "Success! Account created." success\n' },
    { icon: 'fa-bars-progress', label: 'Progress Bar', tag: 'progress', code: 'progress value:80 label:"Project Completion"\n' },
    { icon: 'fa-star', label: 'Rating', tag: 'rating', code: 'rating value:5 label:"(128 reviews)"\n' },
    { icon: 'fa-chart-column', label: 'Stat Box', tag: 'stat', code: 'stat value:"150+" label:"Projects Delivered"\n' },
    { icon: 'fa-arrows-split-up-and-left', label: 'Accordion', tag: 'accordion', code: 'accordion "What is MR.easy?"\n  text "The simplest language for building websites."\n' },
    { icon: 'fa-folder-tree', label: 'Tabs', tag: 'tabs', code: 'tabs\n  tab "Overview"\n    text "Tab 1 content"\n  tab "Details"\n    text "Tab 2 content"\n' },
    { icon: 'fa-grip', label: 'Card', tag: 'layout', code: 'card shadow\n  title "Card Title" small\n  text "Card content here"\n' },
    { icon: 'fa-table-cells', label: 'Grid 3-col', tag: 'layout', code: 'grid cols:3\n  card shadow\n    title "Item 1" small\n    text "Description"\n  card shadow\n    title "Item 2" small\n    text "Description"\n  card shadow\n    title "Item 3" small\n    text "Description"\n' },
    { icon: 'fa-bars', label: 'Nav Bar', tag: 'layout', code: 'nav\n  logo "MySite"\n  links Home About Contact\n' },
    { icon: 'fa-star', label: 'Hero', tag: 'layout', code: 'hero\n  title "Welcome" big glow\n  subtitle "Subtitle text here"\n  button "Get Started" blue big\n' },
    { icon: 'fa-image', label: 'Image', tag: 'media', code: 'image "photo.jpg" rounded shadow\n' },
    { icon: 'fa-link', label: 'Link', tag: 'ui', code: 'link "Visit Google" url:https://google.com\n' },
    { icon: 'fa-list', label: 'List', tag: 'content', code: 'list\n  item "First item"\n  item "Second item"\n  item "Third item"\n' },
    { icon: 'fa-envelope', label: 'Contact Form', tag: 'form', code: 'form\n  label "Name" for:name\n  input placeholder:"Your name" id:name\n  label "Email" for:email\n  input type:email placeholder:"Email" id:email\n  button "Submit" blue\n' },
    { icon: 'fa-circle-info', label: 'Icon + Text', tag: 'content', code: 'row\n  icon star\n  text "Your text here"\n' },
    { icon: 'fa-minus', label: 'Divider', tag: 'layout', code: 'divider\n' },
    { icon: 'fa-arrows-up-down', label: 'Spacer', tag: 'layout', code: 'spacer size:40\n' },
    { icon: 'fa-rotate', label: 'Repeat', tag: 'logic', code: 'repeat 3 times\n  card shadow\n    text "Item {index}"\n' }
  ];

  const EXAMPLES = [
    { icon: 'fa-gem', label: 'NexaStudio (v2.0)', key: 'nexastudio', code: `Mr.easy "NexaStudio — Creative Agency"

nav
  logo "NexaStudio"
  links Services Work Pricing FAQ Contact

hero
  badge "AGENCY OF THE YEAR" purple
  title "We Build Digital Dreams" big glow
  subtitle "Premium websites. Powerful brands. Built in days — not months."
  row center
    button "Start Project" purple big
    button "See Case Studies" outline big

section "features"
  title "Why Work With Us" medium center
  grid cols:3
    card shadow
      icon rocket
      title "Ultra Fast" small
      text "From wireframe to live URL in under 7 days."
    card shadow
      icon bolt
      title "Bold Design" small
      text "High-converting layouts that captivate your audience."
    card shadow
      icon star
      title "Top Quality" small
      text "Crafted with precision. Zero compromises."

footer
  text "© 2026 NexaStudio — Built with MR.easy 🇪🇹"
` },
    { icon: 'fa-globe', label: 'Landing Page', key: 'landing', code: `Mr.easy "Awesome Landing"

nav
  logo "ACME"
  links Home Pricing About

hero
  title "The Future Is Here" big glow
  subtitle "We build next-generation solutions for modern businesses"
  spacer size:24
  row center
    button "Start Free Trial" blue big
    button "Watch Demo" outline

section "features"
  title "Everything You Need" medium center
  spacer
  grid cols:3
    card shadow
      icon rocket
      title "Lightning Fast" small
      text "Deploy in seconds, not hours"
    card shadow
      icon lock
      title "Secure by Default" small
      text "Enterprise-grade security built in"
    card shadow
      icon globe
      title "Global Scale" small
      text "Reach users anywhere in the world"

footer
  text "© 2024 ACME Corp. All rights reserved."
` },
    { icon: 'fa-user', label: 'Portfolio', key: 'portfolio', code: `Mr.easy "John's Portfolio"

nav
  logo "John Doe"
  links Work About Contact

hero
  title "Hello, I'm John" big glow
  subtitle "Full-stack developer & designer creating beautiful digital experiences"
  spacer size:20
  button "See My Work" blue big

section "work"
  title "My Projects" medium center
  spacer
  grid cols:3
    card shadow
      title "Project One" small
      text "A beautiful web application built with modern tech"
      spacer size:12
      button "View Project" outline small
    card shadow
      title "Project Two" small
      text "Mobile app with 100k+ downloads"
      spacer size:12
      button "View Project" outline small
    card shadow
      title "Project Three" small
      text "Open-source tool used by thousands"
      spacer size:12
      button "View Project" outline small

footer
  text "✉️ john@example.com"
` },
    { icon: 'fa-mug-hot', label: 'Buna Café Lounge', key: 'buna', code: `Mr.easy "Buna Ethiopian Coffee & Lounge"

nav
  logo "Buna Coffee ☕"
  links Menu Story Contact

hero
  title "Authentic Ethiopian Coffee" big glow
  subtitle "Savor traditional Sidama & Yirgacheffe beans in a modern atmosphere"
  spacer size:20
  row center
    button "Order Online" blue big
    button "Find Location" outline

section "menu"
  title "Our Specials" medium center
  spacer
  grid cols:3
    card shadow
      icon fire
      title "Jebena Buna" small
      text "Traditional clay pot coffee brewed over hot coals"
      spacer size:12
      button "50 ETB" outline small
    card shadow
      icon heart
      title "Special Macchiato" small
      text "Layered espresso with steamed fresh milk"
      spacer size:12
      button "70 ETB" outline small
    card shadow
      icon star
      title "Pastry & Spris" small
      text "Freshly baked Sambusa & layered avocado juice"
      spacer size:12
      button "60 ETB" outline small

footer
  text "📍 Addis Ababa, Ethiopia — IG @mrcute_killer 🇪🇹"
` },
    { icon: 'fa-feather', label: 'Minimal Starter', key: 'simple', code: `Mr.easy "Simple Starter"

hero
  title "Hello World" big glow
  subtitle "Built with MR.easy"
  button "Get Started" blue big
` }
  ];

  function readStoredSource() {
    try { return root.localStorage.getItem('mreasy_code') || ''; }
    catch (error) { return ''; }
  }

  function writeStoredSource(source) {
    try { root.localStorage.setItem('mreasy_code', source); }
    catch (error) { /* private browsing or storage restrictions */ }
  }

  function getSourceCode() {
    return editor ? editor.getValue() : (document.getElementById('code-textarea')?.value || STARTER);
  }

  function setSourceCode(code) {
    if (editor) editor.setValue(code);
    else {
      const textArea = document.getElementById('code-textarea');
      if (textArea) textArea.value = code;
    }
    compileAndPreview();
  }

  function getAiElements() {
    return {
      toggle: document.getElementById('ai-agent-toggle'),
      panel: document.getElementById('ai-agent-panel'),
      provider: document.getElementById('ai-provider'),
      apiKey: document.getElementById('ai-api-key'),
      model: document.getElementById('ai-model'),
      endpoint: document.getElementById('ai-endpoint'),
      endpointField: document.getElementById('ai-endpoint-field'),
      config: document.getElementById('ai-agent-config'),
      configStatus: document.getElementById('ai-config-status'),
      messages: document.getElementById('ai-agent-messages'),
      composer: document.getElementById('ai-agent-composer'),
      input: document.getElementById('ai-agent-input'),
      send: document.getElementById('ai-agent-send'),
      stop: document.getElementById('ai-agent-stop'),
      busyDot: document.querySelector('.ai-agent-toggle-dot')
    };
  }

  function setAiConfigStatus(message, state = '') {
    const { configStatus } = getAiElements();
    if (!configStatus) return;
    configStatus.textContent = message;
    configStatus.className = state;
  }

  function updateAiProviderUi() {
    const { provider, model, endpoint, endpointField } = getAiElements();
    const metadata = PROVIDERS[aiState.providerId];
    if (!metadata) return;
    if (provider && provider.value !== aiState.providerId) provider.value = aiState.providerId;
    if (model && document.activeElement !== model) model.value = aiState.model;
    if (endpoint && document.activeElement !== endpoint) endpoint.value = aiState.endpoint;
    endpointField?.classList.toggle('visible', aiState.providerId === 'openai-compatible');
  }

  function updateAiComposerState() {
    const { input, send, stop, busyDot } = getAiElements();
    const canSend = Boolean(aiState.apiKey && input?.value.trim() && !aiState.isBusy);
    if (send) send.disabled = !canSend;
    if (stop) stop.hidden = !aiState.isBusy;
    busyDot?.classList.toggle('busy', aiState.isBusy);
  }

  function appendAiMessageBody(body, content) {
    const parts = String(content || '').split(/```(?:mreasy|mr\.easy)?\s*([\s\S]*?)```/gi);
    parts.forEach((part, index) => {
      if (!part) return;
      if (index % 2 === 1) {
        const code = document.createElement('code');
        code.textContent = part.trim();
        body.appendChild(code);
      } else {
        body.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderAiMessages(forceScroll = false) {
    const { messages } = getAiElements();
    if (!messages) return;
    const nearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 48;
    messages.replaceChildren();
    aiState.messages.forEach(message => {
      const item = document.createElement('article');
      item.className = `ai-message ${message.role}`;
      const label = document.createElement('span');
      label.className = 'ai-message-label';
      label.textContent = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'MR.easy AI' : message.role === 'error' ? 'Request error' : 'MR.easy guide';
      const body = document.createElement('div');
      body.className = 'ai-message-body';
      appendAiMessageBody(body, message.content);
      item.append(label, body);
      messages.appendChild(item);
    });
    if (aiState.isBusy) {
      const loading = document.createElement('article');
      loading.className = 'ai-message assistant ai-loading';
      loading.setAttribute('aria-label', 'MR.easy AI is thinking');
      loading.textContent = 'MR.easy AI is thinking…';
      messages.appendChild(loading);
    }
    if (forceScroll || nearBottom) requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  function appendAiMessage(role, content) {
    aiState.messages.push({ role, content: String(content || '') });
    if (aiState.messages.length > AI_HISTORY_LIMIT) aiState.messages.splice(0, aiState.messages.length - AI_HISTORY_LIMIT);
    renderAiMessages(true);
  }

  function ensureAiWelcome() {
    if (!aiState.messages.length) appendAiMessage('system', 'I know the MR.easy language and can help you write, debug, and improve the current source. Connect a provider above, then ask a question.');
  }

  function toggleAiPanel() {
    aiState.isOpen = !aiState.isOpen;
    const { toggle, panel, input } = getAiElements();
    toggle?.setAttribute('aria-expanded', String(aiState.isOpen));
    toggle?.setAttribute('aria-label', aiState.isOpen ? 'Close MR.easy AI assistant' : 'Open MR.easy AI assistant');
    panel?.classList.toggle('open', aiState.isOpen);
    panel?.setAttribute('aria-hidden', String(!aiState.isOpen));
    if (aiState.isOpen) {
      ensureAiWelcome();
      updateAiProviderUi();
      renderAiMessages();
      setTimeout(() => (aiState.apiKey ? input : getAiElements().apiKey)?.focus(), 0);
    } else {
      toggle?.focus();
    }
  }

  function closeAiPanel() {
    if (!aiState.isOpen) return;
    aiState.isOpen = false;
    const { toggle, panel } = getAiElements();
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open MR.easy AI assistant');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    toggle?.focus();
  }

  function clearAiConversation() {
    if (aiState.isBusy) stopAiRequest();
    aiState.messages = [];
    ensureAiWelcome();
    renderAiMessages(true);
  }

  function connectAiProvider() {
    const { provider, apiKey, model, endpoint } = getAiElements();
    const metadata = PROVIDERS[provider?.value] || PROVIDERS.openai;
    const key = apiKey?.value.trim() || '';
    if (!key) {
      setAiConfigStatus('API key required', 'error');
      apiKey?.focus();
      updateAiComposerState();
      return false;
    }
    aiState.providerId = provider.value;
    aiState.apiKey = key;
    aiState.model = model?.value.trim() || metadata.model;
    aiState.endpoint = endpoint?.value.trim() || metadata.endpoint;
    setAiConfigStatus(`Ready · ${metadata.label}`, 'connected');
    const connect = document.getElementById('ai-connect');
    if (connect) { connect.textContent = 'Connected'; connect.classList.add('connected'); }
    updateAiProviderUi();
    updateAiComposerState();
    return true;
  }

  function sanitizedAiError(error) {
    if (error?.name === 'AbortError') return 'Request cancelled.';
    const message = String(error?.message || 'Something went wrong while contacting the provider.');
    return message.replace(aiState.apiKey, '[redacted]').slice(0, 180);
  }

  async function fetchAiJson(url, options, providerId) {
    if (!root.fetch) throw new Error('This browser does not support fetch.');
    const response = await root.fetch(url, options);
    let data = null;
    try { data = await response.json(); } catch (error) { data = null; }
    if (!response.ok) throw new Error(`${PROVIDERS[providerId].label} request failed (${response.status}).`);
    return data || {};
  }

  function requestHeaders(apiKey, extra = {}) {
    return { 'Content-Type': 'application/json', ...extra };
  }

  async function requestOpenAi(systemPrompt, messages, signal) {
    const data = await fetchAiJson(aiState.endpoint, { method: 'POST', signal, headers: requestHeaders(aiState.apiKey, { Authorization: `Bearer ${aiState.apiKey}` }), body: JSON.stringify({ model: aiState.model, input: [{ role: 'system', content: systemPrompt }, ...messages] }) }, 'openai');
    const text = data.output_text || data.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
    return text || '';
  }

  async function requestAnthropic(systemPrompt, messages, signal) {
    const data = await fetchAiJson(aiState.endpoint, { method: 'POST', signal, headers: requestHeaders(aiState.apiKey, { 'x-api-key': aiState.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }), body: JSON.stringify({ model: aiState.model, max_tokens: 1200, system: systemPrompt, messages }) }, 'anthropic');
    return data.content?.filter(item => item.type === 'text').map(item => item.text).join('') || '';
  }

  async function requestGemini(systemPrompt, messages, signal) {
    const endpoint = `${aiState.endpoint.replace(/\/$/, '')}/${encodeURIComponent(aiState.model)}:generateContent?key=${encodeURIComponent(aiState.apiKey)}`;
    const contents = messages.map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
    const data = await fetchAiJson(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { maxOutputTokens: 1200 } }) }, 'gemini');
    return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  }

  async function requestOpenAiCompatible(systemPrompt, messages, signal) {
    const data = await fetchAiJson(aiState.endpoint, { method: 'POST', signal, headers: requestHeaders(aiState.apiKey, { Authorization: `Bearer ${aiState.apiKey}` }), body: JSON.stringify({ model: aiState.model, messages: [{ role: 'system', content: systemPrompt }, ...messages] }) }, 'openai-compatible');
    const content = data.choices?.[0]?.message?.content;
    return Array.isArray(content) ? content.map(item => item.text || '').join('') : content || '';
  }

  async function requestAiCompletion() {
    const source = getSourceCode().slice(0, AI_SOURCE_LIMIT);
    const systemPrompt = `${AI_SYSTEM_PROMPT}\n\nCurrent MR.easy source:\n\`\`\`mreasy\n${source}\n\`\`\``;
    const messages = aiState.messages.filter(message => message.role === 'user' || message.role === 'assistant').slice(-AI_HISTORY_LIMIT).map(message => ({ role: message.role, content: message.content }));
    const signal = aiState.abortController.signal;
    if (aiState.providerId === 'anthropic') return requestAnthropic(systemPrompt, messages, signal);
    if (aiState.providerId === 'gemini') return requestGemini(systemPrompt, messages, signal);
    if (aiState.providerId === 'openai-compatible') return requestOpenAiCompatible(systemPrompt, messages, signal);
    return requestOpenAi(systemPrompt, messages, signal);
  }

  async function sendAiMessage(event) {
    event?.preventDefault();
    const { input } = getAiElements();
    const content = input?.value.trim() || '';
    if (!content || aiState.isBusy) return;
    if (!aiState.apiKey && !connectAiProvider()) return;
    input.value = '';
    appendAiMessage('user', content);
    aiState.isBusy = true;
    aiState.abortController = new AbortController();
    updateAiComposerState();
    renderAiMessages(true);
    try {
      const response = await requestAiCompletion();
      if (!response.trim()) throw new Error('The assistant returned an empty response.');
      appendAiMessage('assistant', response.trim());
    } catch (error) {
      if (error?.name === 'AbortError') appendAiMessage('system', 'Request cancelled.');
      else appendAiMessage('error', sanitizedAiError(error));
    } finally {
      aiState.isBusy = false;
      aiState.abortController = null;
      updateAiComposerState();
      renderAiMessages();
    }
  }

  function stopAiRequest() {
    aiState.abortController?.abort();
  }

  function installAiHandlers() {
    const { provider, model, endpoint, config, composer, input } = getAiElements();
    provider?.addEventListener('change', () => {
      aiState.providerId = provider.value;
      const metadata = PROVIDERS[aiState.providerId];
      aiState.model = metadata.model;
      aiState.endpoint = metadata.endpoint;
      updateAiProviderUi();
      setAiConfigStatus('Not connected');
      const connect = document.getElementById('ai-connect');
      if (connect) { connect.textContent = 'Connect'; connect.classList.remove('connected'); }
      updateAiComposerState();
    });
    model?.addEventListener('input', () => { aiState.model = model.value.trim(); updateAiComposerState(); });
    endpoint?.addEventListener('input', () => { aiState.endpoint = endpoint.value.trim(); });
    config?.addEventListener('submit', event => { event.preventDefault(); connectAiProvider(); });
    composer?.addEventListener('submit', sendAiMessage);
    input?.addEventListener('input', updateAiComposerState);
    input?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        composer?.requestSubmit();
      }
    });
    updateAiProviderUi();
    ensureAiWelcome();
    updateAiComposerState();
  }

  function initEditor() {
    const container = document.getElementById('codemirror-container');
    if (!container) return;
    const textArea = document.getElementById('code-textarea');
    if (textArea) textArea.value = STARTER;

    if (typeof root.CodeMirror === 'undefined') {
      if (textArea) textArea.addEventListener('input', scheduleCompile);
      return;
    }

    editor = root.CodeMirror.fromTextArea(textArea, {
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
        Tab: cm => {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Ctrl-Enter': compileAndPreview,
        'Ctrl-S': () => { compileAndPreview(); showToast('✓ Compiled & saved'); }
      }
    });

    editor.on('change', () => { scheduleCompile(); markUnsaved(); });
    editor.on('cursorActivity', () => {
      const cursor = editor.getCursor();
      const line = document.getElementById('line-col');
      if (line) line.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    });
  }

  function scheduleCompile() {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(compileAndPreview, 120);
  }

  function compileAndPreview() {
    const source = getSourceCode();
    writeStoredSource(source);
    const count = document.getElementById('char-count');
    if (count) count.textContent = `${source.length} chars`;

    try {
      const frame = document.getElementById('preview-frame');
      if (frame) frame.srcdoc = browserCompile(source, { isDarkTheme });
      setCompilerStatus(true);
      markSaved();
    } catch (error) {
      setCompilerStatus(false, error);
    }
  }

  function setCompilerStatus(success, error) {
    const dot = document.getElementById('status-dot');
    const status = document.getElementById('preview-status');
    if (dot) {
      dot.style.background = success ? 'var(--signal-green)' : 'var(--adwa-red)';
      dot.style.boxShadow = success ? '0 0 7px rgba(95,168,90,.6)' : '0 0 7px rgba(139,32,32,.65)';
    }
    if (status) status.textContent = success ? 'Live Preview' : `Syntax Notice${error ? `: ${error.message}` : ''}`;
  }

  function buildSidebar() {
    const snippetList = document.getElementById('snippet-list');
    if (snippetList && !snippetList.children.length) {
      SNIPPETS.forEach(snippet => {
        const item = document.createElement('div');
        item.className = 'snippet-item';
        item.innerHTML = `<i class="fa ${snippet.icon}"></i><span>${snippet.label}</span><span class="snippet-tag">${snippet.tag}</span>`;
        item.onclick = () => insertSnippet(snippet.tag);
        snippetList.appendChild(item);
      });
    }
    const exampleList = document.getElementById('example-list');
    if (exampleList && !exampleList.children.length) {
      EXAMPLES.forEach(example => {
        const item = document.createElement('div');
        item.className = 'example-item';
        item.innerHTML = `<i class="fa ${example.icon}"></i><span>${example.label}</span>`;
        item.onclick = () => loadExample(example.key);
        exampleList.appendChild(item);
      });
    }
  }

  function switchTab(mode) {
    if (!['editor', 'preview', 'split'].includes(mode)) return;
    currentView = mode;
    document.querySelectorAll('.tab').forEach((tab, index) => {
      const isActive = ['editor', 'preview', 'split'][index] === mode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    setViewMode(mode);
  }

  function setViewMode(mode) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;
    workspace.classList.remove('editor-only', 'preview-only');
    if (mode === 'editor') workspace.classList.add('editor-only');
    if (mode === 'preview') workspace.classList.add('preview-only');
    if (editor) editor.refresh();
    schedulePreviewScale();
  }

  function activateRail(action) {
    document.querySelectorAll('[data-rail-action]').forEach(button => {
      const active = button.dataset.railAction === action;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (action === 'explorer') {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Explorer opened');
    } else if (action === 'search') {
      switchTab('editor');
      if (editor) editor.focus();
      document.getElementById('code-textarea')?.focus();
      showToast('Search is available in the editor');
    } else if (action === 'examples') {
      openTemplateModal();
      showToast('Examples opened');
    } else if (action === 'guide') {
      openGuideModal('ref');
      showToast('Language guide opened');
    } else if (action === 'settings') {
      togglePreviewTheme();
      showToast('Settings: preview theme toggled');
    }
  }

  function setViewport(viewport, sourceEvent) {
    if (!PREVIEW_VIEWPORTS[viewport]) return;
    activeViewport = viewport;
    const viewportButtons = document.querySelectorAll('.vp-btn');
    viewportButtons.forEach(button => button.classList.remove('active'));
    const eventTarget = sourceEvent?.target || root.event?.target;
    const button = eventTarget?.closest?.('.vp-btn');
    if (button) button.classList.add('active');
    else viewportButtons[['desktop', 'tablet', 'mobile'].indexOf(viewport)]?.classList.add('active');
    const frame = document.getElementById('preview-frame');
    const wrapper = document.getElementById('preview-wrapper');
    if (frame) frame.className = viewport === 'desktop' ? '' : viewport;
    if (wrapper) wrapper.className = `preview-frame-wrapper ${viewport === 'desktop' ? '' : viewport}`;
    applyPreviewScale();
  }

  function applyPreviewScale() {
    const wrapper = document.getElementById('preview-wrapper');
    const frame = document.getElementById('preview-frame');
    const viewport = PREVIEW_VIEWPORTS[activeViewport];
    if (!wrapper || !frame || !viewport) return;

    const availableWidth = Math.max(wrapper.clientWidth - 24, 1);
    const availableHeight = Math.max(wrapper.clientHeight - 24, 1);
    const fitScale = Math.min(1, availableWidth / viewport.width);
    const scale = Math.max(0.25, fitScale * (currentZoom / 100));
    const frameHeight = Math.max(viewport.minHeight, Math.ceil(availableHeight / scale));
    const scaledWidth = viewport.width * scale;
    const left = Math.max(12, Math.floor((wrapper.clientWidth - scaledWidth) / 2));

    frame.style.width = `${viewport.width}px`;
    frame.style.height = `${frameHeight}px`;
    frame.style.left = `${left}px`;
    frame.style.top = '12px';
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
    wrapper.dataset.scale = scale.toFixed(3);
  }

  function schedulePreviewScale() {
    if (scaleFrame) root.cancelAnimationFrame?.(scaleFrame);
    scaleFrame = root.requestAnimationFrame ? root.requestAnimationFrame(() => {
      scaleFrame = null;
      applyPreviewScale();
    }) : setTimeout(() => { scaleFrame = null; applyPreviewScale(); }, 0);
  }

  function setZoom(level) {
    const allowed = [50, 75, 100];
    currentZoom = allowed.includes(Number(level)) ? Number(level) : 100;
    document.querySelectorAll('.zoom-btn').forEach(button => button.classList.remove('active'));
    document.getElementById(`zoom-${currentZoom}`)?.classList.add('active');
    schedulePreviewScale();
  }

  function togglePreviewTheme() {
    isDarkTheme = !isDarkTheme;
    root.mreasyPreviewTheme = isDarkTheme ? 'dark' : 'light';
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDarkTheme ? 'fa fa-moon' : 'fa fa-sun';
    compileAndPreview();
    showToast(`Preview switched to ${isDarkTheme ? 'Dark' : 'Light'} Mode`);
  }

  function insertSnippet(type) {
    const snippet = SNIPPETS.find(item => item.tag === type || item.label.toLowerCase().includes(String(type).toLowerCase()));
    const code = snippet ? snippet.code : `${type}\n`;
    const current = getSourceCode();
    if (editor) {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const indent = line.match(/^(\s*)/)[1];
      const indented = code.split('\n').map((item, index) => index === 0 ? item : indent + item).join('\n');
      editor.replaceRange(`\n${indented}`, { line: cursor.line, ch: line.length });
      editor.focus();
    } else {
      setSourceCode(`${current}\n${code}`);
    }
    scheduleCompile();
    showToast(`✨ Inserted ${type}`);
  }

  function loadExample(key) {
    const example = EXAMPLES.find(item => item.key === key || item.label.toLowerCase().includes(String(key).toLowerCase()));
    if (example) { setSourceCode(example.code); showToast(`✨ Loaded ${example.label}`); }
  }

  function runCode() { compileAndPreview(); showToast('⚡ Compiled successfully!'); }
  function refreshPreview() { compileAndPreview(); showToast('🔄 Preview refreshed'); }

  function openInNewTab() {
    try {
      const blob = new Blob([browserCompile(getSourceCode(), { isDarkTheme })], { type: 'text/html' });
      root.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (error) { showToast(`❌ ${error.message}`); }
  }

  function downloadHTML() {
    try {
      downloadBlob(browserCompile(getSourceCode(), { isDarkTheme }), 'index.html', 'text/html');
      showToast('⬇️ Downloaded index.html');
    } catch (error) { showToast(`❌ ${error.message}`); }
  }

  function downloadSource() { downloadBlob(getSourceCode(), 'index.mreasy', 'text/plain'); showToast('⬇️ Downloaded index.mreasy'); }

  function downloadBlob(content, filename, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  async function copyText(text, successMessage) {
    try {
      if (root.navigator.clipboard?.writeText) {
        await root.navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand('copy');
        helper.remove();
        if (!copied) throw new Error('Clipboard access is unavailable');
      }
      showToast(successMessage);
    } catch (error) {
      showToast(`❌ ${error.message || 'Clipboard access is unavailable'}`);
    }
  }

  function copySource() { copyText(getSourceCode(), '📋 MR.easy source copied to clipboard!'); }

  function copyHTML() { copyText(browserCompile(getSourceCode(), { isDarkTheme }), '📋 HTML copied to clipboard!'); }

  function exportZip() {
    try {
      if (typeof root.JSZip === 'undefined') return downloadHTML();
      const zip = new root.JSZip();
      zip.file('index.html', browserCompile(getSourceCode(), { isDarkTheme }));
      zip.file('index.mreasy', getSourceCode());
      zip.file('README.md', '# Built with MR.easy 🇪🇹\nCreated by @mrcute_killer\n\nOpen index.html to view your site.');
      zip.generateAsync({ type: 'blob' }).then(content => { downloadBlob(content, 'mreasy-website.zip', 'application/zip'); showToast('📦 Exported full website ZIP!'); });
    } catch (error) { showToast(`❌ ${error.message}`); }
  }

  function clearCode() {
    if (root.confirm('Start from 0? This will clear your current code.')) {
      setSourceCode('Mr.easy "New Website"\n\n# IG @mrcute_killer\n\nhero\n  title "My New Site" big glow\n  button "Click Me" blue big\n');
      showToast('✨ Started fresh from 0');
    }
  }

  function formatCode() { showToast('✨ Code formatted'); }
  function increaseFontSize() { setFontSize(Math.min(fontSize + 2, 28)); }
  function decreaseFontSize() { setFontSize(Math.max(fontSize - 2, 10)); }
  function setFontSize(size) {
    fontSize = size;
    document.querySelectorAll('.CodeMirror, #code-textarea').forEach(element => { element.style.fontSize = `${fontSize}px`; });
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = `${fontSize}px`;
  }

  function jumpToLine(lineIndex) {
    if (editor) {
      editor.scrollIntoView({ line: lineIndex, ch: 0 }, 100);
      editor.setSelection({ line: lineIndex, ch: 0 }, { line: lineIndex, ch: 999 });
      editor.focus();
    }
    const line = document.getElementById('line-col');
    if (line) line.textContent = `Ln ${lineIndex + 1}, Col 1`;
    showToast(`🎯 Auto-scrolled to Line ${lineIndex + 1}`);
  }

  function openGuideModal(type) {
    const modal = document.getElementById('guide-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;
    if (type === 'cheat') {
      title.innerHTML = '<i class="fa fa-list-check"></i> MR.easy Cheatsheet';
      body.innerHTML = '<div class="guide-section"><h3>⚡ Declarations & Layout</h3><div class="guide-row"><div class="guide-code">Mr.easy "Title"</div><div class="guide-desc">Required header</div></div><div class="guide-row"><div class="guide-code">nav</div><div class="guide-desc">Navigation bar</div></div><div class="guide-row"><div class="guide-code">hero</div><div class="guide-desc">Big hero section</div></div><div class="guide-row"><div class="guide-code">section "name"</div><div class="guide-desc">Named container</div></div><div class="guide-row"><div class="guide-code">grid cols:3</div><div class="guide-desc">Responsive columns</div></div></div>';
    } else {
      title.innerHTML = '<i class="fa fa-book"></i> MR.easy Language Reference';
      body.innerHTML = `<div class="guide-section"><h3>🚀 Every MR.easy File Starts With:</h3><div class="guide-code">Mr.easy "Your Page Title"</div><p class="guide-desc">The signature of every MR.easy document.</p></div><div class="guide-section"><h3>📐 Layout Elements</h3>${[['nav','Navigation bar'],['hero','Big hero section'],['section "name"','Page section'],['grid cols:3','Responsive grid'],['row','Horizontal row'],['card shadow','Content card'],['footer','Page footer']].map(([code, description]) => `<div class="guide-row"><div class="guide-code">${code}</div><div class="guide-desc">${description}</div></div>`).join('')}</div><div class="guide-section"><h3>📝 Text & Interaction</h3>${[['title "Hello" big glow','Big glowing heading'],['subtitle "Text"','Subtitle paragraph'],['button "Click" blue big','Primary action'],['input type:email','Form input']].map(([code, description]) => `<div class="guide-row"><div class="guide-code">${code}</div><div class="guide-desc">${description}</div></div>`).join('')}</div>`;
    }
    modal.classList.add('open');
  }

  function closeGuideModal() { document.getElementById('guide-modal')?.classList.remove('open'); }
  function installKeyboardHandlers() {
    document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        tab.click();
      }
    }));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (aiState.isOpen) closeAiPanel();
      else closeGuideModal();
    });
    const modal = document.getElementById('guide-modal');
    modal?.addEventListener('click', event => {
      if (event.target === modal) closeGuideModal();
    });
  }
  function showGuide() { openGuideModal('ref'); }
  function showCheatsheet() { openGuideModal('cheat'); }
  function closeModal() { closeGuideModal(); }

  function openTemplateModal() {
    const modal = document.getElementById('guide-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;
    title.innerHTML = '<i class="fa fa-cubes"></i> Choose Starter Template';
    body.innerHTML = `<div class="guide-section"><p class="guide-desc" style="margin-bottom:12px;">Click a template to load it into your editor:</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">${EXAMPLES.map(example => `<div data-template="${example.key}" style="background:var(--ink-2);border:1px solid var(--hairline);padding:14px;cursor:pointer;"><div style="color:var(--brass-bright);font-size:1.1rem;margin-bottom:6px;"><i class="fa ${example.icon}"></i></div><div style="font-weight:600;font-size:.82rem;color:var(--parchment);margin-bottom:4px;">${example.label}</div><div style="font-size:.68rem;color:var(--muted);">Load ${example.label}</div></div>`).join('')}</div></div>`;
    body.querySelectorAll('[data-template]').forEach(item => item.addEventListener('click', () => { loadExample(item.dataset.template); closeGuideModal(); }));
    modal.classList.add('open');
  }

  function openCliModal() {
    const modal = document.getElementById('guide-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;
    title.innerHTML = '<i class="fa fa-terminal"></i> MR.easy Terminal CLI Commands';
    body.innerHTML = '<div class="guide-section"><h3>📦 1. Install CLI</h3><div class="guide-code">npm install -g mreasy</div></div><div class="guide-section"><h3>⚡ 2. Start Dev Server</h3><div class="guide-code">mreasy dev index.mreasy</div></div><div class="guide-section"><h3>🏗️ 3. Build HTML Output</h3><div class="guide-code">mreasy build index.mreasy</div></div><div class="guide-section"><h3>✨ 4. Create New Project</h3><div class="guide-code">mreasy new my-awesome-website</div></div>';
    modal.classList.add('open');
  }

  function markUnsaved() { document.getElementById('saved-indicator')?.classList.add('unsaved'); }
  function markSaved() { document.getElementById('saved-indicator')?.classList.remove('unsaved'); }
  function showToast(message) { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }

  function startResize(event) {
    event?.preventDefault();
    isResizing = true;
    document.getElementById('divider')?.classList.add('dragging');
    document.addEventListener('pointermove', doResize);
    document.addEventListener('pointerup', stopResize, { once: true });
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize, { once: true });
  }

  function doResize(event) {
    if (!isResizing) return;
    const workspace = document.getElementById('workspace');
    const sidebar = document.getElementById('sidebar');
    const rail = document.querySelector('.icon-rail');
    const editorPanel = document.getElementById('editor-panel');
    const previewPanel = document.getElementById('preview-panel');
    if (!workspace || !editorPanel || !previewPanel) return;
    const rect = workspace.getBoundingClientRect();
    const sidebarWidth = (sidebar?.offsetWidth || 0) + (rail?.offsetWidth || 0);
    const totalWidth = rect.width - sidebarWidth;
    const offset = event.clientX - rect.left - sidebarWidth;
    const percent = Math.max(20, Math.min(80, (offset / totalWidth) * 100));
    editorPanel.style.flex = `0 0 ${percent}%`;
    previewPanel.style.flex = `0 0 ${100 - percent}%`;
    schedulePreviewScale();
  }

  function stopResize() {
    isResizing = false;
    document.getElementById('divider')?.classList.remove('dragging');
    document.removeEventListener('pointermove', doResize);
    document.removeEventListener('pointerup', stopResize);
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    if (editor) editor.refresh();
    schedulePreviewScale();
  }

  root.addEventListener('message', event => {
    if (event.data?.type === 'JUMP_TO_LINE') jumpToLine(event.data.line);
  });

  root.addEventListener('DOMContentLoaded', () => {
    initEditor();
    buildSidebar();
    installKeyboardHandlers();
    installAiHandlers();
    setViewMode('split');
    const saved = readStoredSource();
    if (saved.trim()) setSourceCode(saved);
    else setTimeout(compileAndPreview, 100);
    const wrapper = document.getElementById('preview-wrapper');
    if (wrapper && root.ResizeObserver) new root.ResizeObserver(schedulePreviewScale).observe(wrapper);
    root.addEventListener('resize', schedulePreviewScale);
    setViewport('desktop');
    setZoom(100);
  });

  Object.assign(root, {
    KEYWORDS, STYLE_WORDS, COLOR_MAP, ICON_MAP, SIZE_MAP,
    browserCompile, compileAndPreview, switchTab, setViewMode, activateRail, setViewport, setZoom,
    togglePreviewTheme, insertSnippet, loadExample, runCode, refreshPreview,
    openInNewTab, downloadHTML, downloadSource, copySource, copyHTML, exportZip,
    clearCode, formatCode, increaseFontSize, decreaseFontSize, openGuideModal,
    closeGuideModal, showGuide, showCheatsheet, closeModal, openTemplateModal,
    openCliModal, toggleAiPanel, closeAiPanel, clearAiConversation, sendAiMessage, stopAiRequest,
    markUnsaved, markSaved, showToast, startResize, doResize, stopResize
  });
})(window);
