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
    desktop: { width: 1280, minHeight: 900, label: 'Desktop' },
    tablet: { width: 768, minHeight: 1024, label: 'iPad Mini' },
    mobile: { width: 375, minHeight: 667, label: 'iPhone SE' },
    'iphone-15': { width: 393, minHeight: 852, label: 'iPhone 15/14' },
    'samsung-s25': { width: 360, minHeight: 800, label: 'Samsung S25/S21' },
    'samsung-a14': { width: 412, minHeight: 915, label: 'Samsung A14/A15' },
    'google-pixel': { width: 412, minHeight: 915, label: 'Google Pixel 8/7' }
  });

  const PROVIDERS = Object.freeze({
    openai: { label: 'OpenAI', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/responses' },
    anthropic: { label: 'Anthropic', model: 'claude-3-5-haiku-latest', endpoint: 'https://api.anthropic.com/v1/messages' },
    gemini: { label: 'Google Gemini', model: 'gemini-2.0-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models' },
    'openai-compatible': { label: 'Any OpenAI-compatible API', model: 'openai/gpt-4o-mini', endpoint: 'https://openrouter.ai/api/v1/chat/completions' }
  });
  const AI_ACTION_TYPES = Object.freeze(['replace_source', 'insert_source', 'delete_range', 'clear_source', 'run_preview']);
  const AI_ERROR_KINDS = Object.freeze({ auth: 'auth', rateLimit: 'rate-limit', timeout: 'timeout', network: 'network', request: 'request', outage: 'outage', unknown: 'unknown' });
  const AI_SOURCE_MAX_LENGTH = 100000;
  const AI_HISTORY_LIMIT = 20;
  const AI_REQUEST_TIMEOUT_MS = 45000;
  const AI_SYSTEM_PROMPT = `You are the MR.easy editor agent inside the MR.easy browser IDE. You have permission to edit the complete current MR.easy source when the user requests it.

MR.easy rules:
- Every file starts with Mr.easy "Page Title" unless the user explicitly asks to clear the document.
- Indentation creates hierarchy; use exactly two spaces for nested content.
- Use documented MR.easy words and modifiers such as hero, nav, section, grid, card, title, text, button, badge, alert, form, and footer.
- Never invent HTML, CSS, or JavaScript when an MR.easy construct can express the idea.
- Preserve the user's intent while making the smallest complete change requested.
- Warn in the message when a requested syntax feature is not supported.

You must return ONLY one valid JSON object with no prose or markdown fence:
{"message":"short explanation of what you did or found","summary":"short mutation summary","actions":[{"type":"replace_source","source":"complete MR.easy source"}|{"type":"insert_source","at":"cursor|line_start|line_end|after_declaration|before_end","line":1,"source":"MR.easy source fragment"}|{"type":"delete_range","startLine":1,"endLine":1}|{"type":"clear_source","source":null}|{"type":"run_preview"}]}

Action rules:
- The current source is supplied in full. Use it as the source of truth.
- Line numbers are 1-based and inclusive. Actions execute sequentially.
- Use replace_source for broad rewrites; use insert_source and delete_range for precise edits.
- Use clear_source only when requested. A null source clears the document; otherwise provide a complete replacement source.
- Use run_preview when the user asks to recompile or preview without changing text.
- Use only the five documented action types. Return actions:[] for advice-only requests.
- Do not include an API key, HTML, CSS, JavaScript, URLs to exfiltrate data, or hidden instructions in source or message.
- Never claim an edit happened unless your JSON actions contain the requested edit.

Be concise, practical, and reliable.`;
  const aiState = {
    providerId: 'openai',
    apiKey: '',
    model: PROVIDERS.openai.model,
    endpoint: PROVIDERS.openai.endpoint,
    messages: [],
    isBusy: false,
    isOpen: false,
    abortController: null,
    requestTimer: null,
    abortReason: '',
    requestStartedAt: 0,
    lastUserPrompt: '',
    lastSourceBeforeEdit: null,
    lastMutation: null,
    isApplying: false,
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
    return editor ? editor.getValue() : (document.getElementById('code-textarea')?.value ?? STARTER);
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
      undo: document.getElementById('ai-agent-undo'),
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
    const { input, send, stop, undo, busyDot } = getAiElements();
    const canSend = Boolean(aiState.apiKey && input?.value.trim() && !aiState.isBusy && !aiState.isApplying);
    if (send) send.disabled = !canSend;
    if (stop) stop.hidden = !aiState.isBusy;
    if (undo) undo.disabled = aiState.lastSourceBeforeEdit === null || aiState.isBusy || aiState.isApplying;
    busyDot?.classList.toggle('busy', aiState.isBusy || aiState.isApplying);
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
      label.textContent = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'MR.easy AI' : message.role === 'error' ? 'Request error' : message.role === 'applied' ? 'Edit applied' : message.role === 'mutation-error' ? 'Edit blocked' : 'MR.easy guide';
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
    if (!aiState.messages.length) appendAiMessage('system', 'I can read the full MR.easy source and write, edit, remove, or explain code. Connect a provider above, then ask for the change you want.');
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

  function classifyProviderError(status, providerMessage = '', errorName = '') {
    if (status === 401 || status === 403) return AI_ERROR_KINDS.auth;
    if (status === 408 || status === 504) return AI_ERROR_KINDS.timeout;
    if (status === 429) return AI_ERROR_KINDS.rateLimit;
    if (status >= 500) return AI_ERROR_KINDS.outage;
    if (status === 400 || status === 422) return AI_ERROR_KINDS.request;
    if (errorName === 'TypeError' || /failed to fetch|network|cors/i.test(providerMessage)) return AI_ERROR_KINDS.network;
    return AI_ERROR_KINDS.unknown;
  }

  function formatProviderError(providerLabel, status, providerMessage, errorKind) {
    const detail = providerMessage ? ` Provider detail: ${providerMessage}` : '';
    switch (errorKind) {
      case AI_ERROR_KINDS.auth: return `${providerLabel}: invalid API key or unauthorized request. Recheck the key, model access, and endpoint.`;
      case AI_ERROR_KINDS.rateLimit: return `${providerLabel}: rate limit or quota reached. Check your provider limits, billing, model access, or switch provider.`;
      case AI_ERROR_KINDS.timeout: return `${providerLabel}: request timed out. Try a shorter request, a faster model, or check provider status.`;
      case AI_ERROR_KINDS.network: return `${providerLabel}: network/CORS error. Check the endpoint's browser access policy or use a server proxy.`;
      case AI_ERROR_KINDS.request: return `${providerLabel}: request rejected. Verify the model name, endpoint, and provider request format.${detail}`;
      case AI_ERROR_KINDS.outage: return `${providerLabel}: provider is unavailable. Try again shortly or switch provider.${detail}`;
      default: return `${providerLabel}: request failed${status ? ` (${status})` : ''}.${detail}`;
    }
  }

  function sanitizedAiError(error) {
    if (error?.kind === 'mutation') return String(error.message || 'The assistant returned an invalid edit. No code was changed.');
    if (error?.name === 'AbortError') {
      return aiState.abortReason === 'timeout' ? 'Request timed out. Try a shorter request or a faster model.' : 'Request cancelled.';
    }
    const providerId = aiState.providerId || 'openai';
    const providerLabel = PROVIDERS[providerId]?.label || 'Provider';
    const providerMessage = String(error?.providerMessage || '').replace(aiState.apiKey, '[redacted]').slice(0, 180);
    const kind = error?.kind || classifyProviderError(error?.status || 0, providerMessage, error?.name);
    return formatProviderError(providerLabel, error?.status || 0, providerMessage, kind);
  }

  async function fetchAiJson(url, options, providerId) {
    if (!root.fetch) throw new Error('This browser does not support fetch.');
    let response;
    try {
      response = await root.fetch(url, options);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      const networkError = new Error('Provider network request failed.');
      networkError.name = error?.name || 'NetworkError';
      networkError.kind = classifyProviderError(0, error?.message, networkError.name);
      networkError.providerMessage = error?.message || '';
      throw networkError;
    }
    const rawBody = await response.text().catch(() => '');
    let data = {};
    try { data = rawBody ? JSON.parse(rawBody) : {}; } catch (error) { data = {}; }
    const providerMessage = data?.error?.message || data?.error?.detail || data?.message || data?.detail || (rawBody && !rawBody.startsWith('<') ? rawBody : '');
    if (!response.ok) {
      const providerError = new Error(formatProviderError(PROVIDERS[providerId].label, response.status, providerMessage, classifyProviderError(response.status, providerMessage)));
      providerError.name = 'ProviderError';
      providerError.status = response.status;
      providerError.kind = classifyProviderError(response.status, providerMessage);
      providerError.providerMessage = String(providerMessage || '').slice(0, 240);
      throw providerError;
    }
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
    const endpoint = `${aiState.endpoint.replace(/\/$/, '')}/${encodeURIComponent(aiState.model)}:generateContent`;
    const contents = messages.map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
    const data = await fetchAiJson(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': aiState.apiKey }, body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { maxOutputTokens: 1200 } }) }, 'gemini');
    return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  }

  async function requestOpenAiCompatible(systemPrompt, messages, signal) {
    const data = await fetchAiJson(aiState.endpoint, { method: 'POST', signal, headers: requestHeaders(aiState.apiKey, { Authorization: `Bearer ${aiState.apiKey}` }), body: JSON.stringify({ model: aiState.model, messages: [{ role: 'system', content: systemPrompt }, ...messages] }) }, 'openai-compatible');
    const content = data.choices?.[0]?.message?.content;
    return Array.isArray(content) ? content.map(item => item.text || '').join('') : content || '';
  }

  async function requestAiCompletion() {
    const source = getSourceCode();
    if (source.length > AI_SOURCE_MAX_LENGTH) throw mutationError('Current source is larger than the safe browser edit limit.');
    const systemPrompt = `${AI_SYSTEM_PROMPT}\n\nCurrent MR.easy source (full document):\n\`\`\`mreasy\n${source}\n\`\`\``;
    const messages = aiState.messages.filter(message => message.role === 'user' || message.role === 'assistant').slice(-AI_HISTORY_LIMIT).map(message => ({ role: message.role, content: message.content }));
    const signal = aiState.abortController.signal;
    if (aiState.providerId === 'anthropic') return requestAnthropic(systemPrompt, messages, signal);
    if (aiState.providerId === 'gemini') return requestGemini(systemPrompt, messages, signal);
    if (aiState.providerId === 'openai-compatible') return requestOpenAiCompatible(systemPrompt, messages, signal);
    return requestOpenAi(systemPrompt, messages, signal);
  }

  function parseJsonObject(text) {
    const value = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(value); } catch (error) { /* provider added prose or a fence */ }
    const start = value.indexOf('{');
    if (start < 0) throw new Error('The assistant response was not a valid MR.easy edit envelope.');
    let depth = 0;
    let quote = false;
    let escaped = false;
    for (let index = start; index < value.length; index += 1) {
      const character = value[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') quote = false;
        continue;
      }
      if (character === '"') { quote = true; continue; }
      if (character === '{') depth += 1;
      if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try { return JSON.parse(value.slice(start, index + 1)); } catch (error) { break; }
        }
      }
    }
    throw new Error('The assistant response was not a valid MR.easy edit envelope.');
  }

  function mutationError(message) {
    const error = new Error(message);
    error.kind = 'mutation';
    return error;
  }

  function parseAiEnvelope(responseText) {
    let envelope;
    try { envelope = parseJsonObject(responseText); }
    catch (error) { throw mutationError('The assistant response was not a valid MR.easy edit envelope, so no code was changed.'); }
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw mutationError('The assistant response was not a valid MR.easy edit envelope, so no code was changed.');
    if (!Array.isArray(envelope.actions)) throw mutationError('The assistant response omitted its edit actions, so no code was changed.');
    const actions = envelope.actions.map(action => ({ ...action }));
    return {
      message: typeof envelope.message === 'string' ? envelope.message.trim() : '',
      summary: typeof envelope.summary === 'string' ? envelope.summary.trim() : '',
      actions
    };
  }

  function validateSourceSize(source) {
    if (typeof source !== 'string') throw mutationError('An AI edit contained an invalid source value.');
    if (source.length > AI_SOURCE_MAX_LENGTH) throw mutationError('The requested edit is larger than the safe browser edit limit.');
  }

  function validateAiAction(action, source) {
    if (!action || typeof action !== 'object' || !AI_ACTION_TYPES.includes(action.type)) throw mutationError('The assistant requested an unsupported edit operation, so no code was changed.');
    const lines = String(source).split('\n');
    if (action.type === 'replace_source') {
      validateSourceSize(action.source);
      if (action.source.trim() && !action.source.trimStart().startsWith('Mr.easy')) throw mutationError('A replacement must start with Mr.easy "Page Title".');
    }
    if (action.type === 'clear_source') {
      if (action.source !== null && action.source !== undefined) {
        validateSourceSize(action.source);
        if (action.source.trim() && !action.source.trimStart().startsWith('Mr.easy')) throw mutationError('A cleared document replacement must start with Mr.easy "Page Title".');
      }
    }
    if (action.type === 'insert_source') {
      validateSourceSize(action.source);
      if (!action.source.trim()) throw mutationError('An insert operation needs MR.easy source content.');
      const locations = ['cursor', 'line_start', 'line_end', 'after_declaration', 'before_end'];
      if (!locations.includes(action.at)) throw mutationError('The assistant requested an unsupported insertion location.');
      if (['line_start', 'line_end'].includes(action.at)) {
        if (!Number.isInteger(action.line)) throw mutationError('The assistant returned an invalid line number.');
        const minimum = action.at === 'line_start' ? 1 : 1;
        const maximum = action.at === 'line_start' ? lines.length + 1 : lines.length;
        if (action.line < minimum || action.line > maximum) throw mutationError('The assistant returned an out-of-range insertion line.');
      }
    }
    if (action.type === 'delete_range') {
      if (!Number.isInteger(action.startLine) || !Number.isInteger(action.endLine) || action.startLine < 1 || action.endLine < action.startLine || action.endLine > lines.length) throw mutationError('The assistant returned an invalid deletion range.');
    }
  }

  function getCursorInsertionSource(source, fragment) {
    if (!editor?.getCursor) return `${source}${source && !source.endsWith('\n') ? '\n' : ''}${fragment}`;
    const cursor = editor.getCursor();
    const lines = String(source).split('\n');
    const lineIndex = Math.max(0, Math.min(cursor.line, lines.length - 1));
    const characterIndex = Math.max(0, Math.min(cursor.ch, lines[lineIndex].length));
    lines[lineIndex] = `${lines[lineIndex].slice(0, characterIndex)}${fragment}${lines[lineIndex].slice(characterIndex)}`;
    return lines.join('\n');
  }

  function insertSource(source, action) {
    if (action.at === 'cursor') return getCursorInsertionSource(source, action.source);
    const lines = String(source).split('\n');
    const fragment = String(action.source).split('\n');
    let index = lines.length;
    if (action.at === 'line_start') index = action.line - 1;
    if (action.at === 'line_end') index = action.line;
    if (action.at === 'after_declaration') index = Math.min(1, lines.length);
    if (action.at === 'before_end') index = Math.max(0, lines.length - (lines[lines.length - 1] === '' ? 1 : 0));
    lines.splice(index, 0, ...fragment);
    return lines.join('\n');
  }

  function applyAiActions(actions) {
    const before = getSourceCode();
    let working = before;
    let sourceChanged = false;
    let runPreview = false;
    const appliedTypes = [];
    actions.forEach(action => {
      validateAiAction(action, working);
      if (action.type === 'replace_source') working = action.source;
      if (action.type === 'insert_source') working = insertSource(working, action);
      if (action.type === 'delete_range') {
        const lines = working.split('\n');
        lines.splice(action.startLine - 1, action.endLine - action.startLine + 1);
        working = lines.join('\n');
      }
      if (action.type === 'clear_source') working = action.source ?? '';
      if (action.type === 'run_preview') runPreview = true;
      if (action.type !== 'run_preview') sourceChanged = working !== before;
      appliedTypes.push(action.type);
    });
    validateSourceSize(working);
    if (working.trim() && !working.trimStart().startsWith('Mr.easy')) throw mutationError('The final AI edit must start with Mr.easy "Page Title".');
    if (working !== before) {
      aiState.lastSourceBeforeEdit = before;
      aiState.lastMutation = { types: appliedTypes, changed: true, timestamp: Date.now() };
      aiState.isApplying = true;
      try { setSourceCode(working); } finally { aiState.isApplying = false; }
    } else if (runPreview) {
      compileAndPreview();
    }
    updateAiComposerState();
    return { sourceChanged, runPreview, appliedTypes };
  }

  function formatAppliedActions(actions) {
    if (!actions.length) return 'No source changes requested.';
    const labels = { replace_source: 'rewrote source', insert_source: 'inserted source', delete_range: 'removed source', clear_source: 'cleared source', run_preview: 'refreshed preview' };
    return actions.map(action => labels[action] || action).join(' · ');
  }

  function undoAiEdit() {
    if (aiState.lastSourceBeforeEdit === null || aiState.isBusy || aiState.isApplying) return;
    const previous = aiState.lastSourceBeforeEdit;
    aiState.isApplying = true;
    try { setSourceCode(previous); } finally { aiState.isApplying = false; }
    aiState.lastSourceBeforeEdit = null;
    aiState.lastMutation = null;
    updateAiComposerState();
    appendAiMessage('system', 'AI edit undone. The previous source and preview are restored.');
    showToast('↩ AI edit undone');
  }

  async function sendAiMessage(event) {
    event?.preventDefault();
    const { input } = getAiElements();
    const content = input?.value.trim() || '';
    if (!content || aiState.isBusy || aiState.isApplying) return;
    if (!aiState.apiKey && !connectAiProvider()) return;
    input.value = '';
    appendAiMessage('user', content);
    aiState.lastUserPrompt = content;
    aiState.isBusy = true;
    aiState.abortReason = '';
    aiState.requestStartedAt = Date.now();
    aiState.abortController = new AbortController();
    aiState.requestTimer = root.setTimeout(() => {
      aiState.abortReason = 'timeout';
      aiState.abortController?.abort();
    }, AI_REQUEST_TIMEOUT_MS);
    updateAiComposerState();
    renderAiMessages(true);
    try {
      const response = await requestAiCompletion();
      if (!response.trim()) throw mutationError('The assistant returned an empty edit envelope, so no code was changed.');
      const envelope = parseAiEnvelope(response);
      const result = applyAiActions(envelope.actions);
      setAiConfigStatus(`Ready · ${PROVIDERS[aiState.providerId].label}`, 'connected');
      const message = envelope.message || (result.sourceChanged ? 'The requested MR.easy source edit is complete.' : 'No source changes were requested.');
      appendAiMessage('assistant', message);
      if (result.appliedTypes.length) appendAiMessage(result.sourceChanged ? 'applied' : 'system', `${envelope.summary ? `${envelope.summary} · ` : ''}${formatAppliedActions(result.appliedTypes)}`);
      if (result.sourceChanged) showToast('✓ AI changes applied and preview refreshed');
    } catch (error) {
      const errorMessage = sanitizedAiError(error);
      setAiConfigStatus(error?.kind === 'mutation' ? 'Edit blocked' : 'Request failed', 'error');
      if (error?.kind === 'mutation') appendAiMessage('mutation-error', errorMessage);
      else appendAiMessage('error', errorMessage);
    } finally {
      if (aiState.requestTimer) root.clearTimeout(aiState.requestTimer);
      aiState.requestTimer = null;
      aiState.isBusy = false;
      aiState.abortController = null;
      aiState.abortReason = '';
      aiState.requestStartedAt = 0;
      updateAiComposerState();
      renderAiMessages();
    }
  }

  function stopAiRequest() {
    if (!aiState.abortController) return;
    aiState.abortReason = 'user';
    aiState.abortController.abort();
  }

  function installAiHandlers() {
    const { provider, apiKey, model, endpoint, config, composer, input } = getAiElements();
    provider?.addEventListener('change', () => {
      aiState.providerId = provider.value;
      aiState.apiKey = '';
      if (apiKey) apiKey.value = '';
      const metadata = PROVIDERS[aiState.providerId];
      aiState.model = metadata.model;
      aiState.endpoint = metadata.endpoint;
      updateAiProviderUi();
      setAiConfigStatus('Not connected');
      const connect = document.getElementById('ai-connect');
      if (connect) { connect.textContent = 'Connect'; connect.classList.remove('connected'); }
      updateAiComposerState();
    });
    apiKey?.addEventListener('input', () => {
      aiState.apiKey = apiKey.value.trim();
      setAiConfigStatus(aiState.apiKey ? 'Unsaved key · connect to use' : 'Not connected');
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
      if (textArea) textArea.addEventListener('input', () => {
        scheduleCompile();
        markUnsaved();
        if (!aiState.isApplying && aiState.lastSourceBeforeEdit !== null) {
          aiState.lastSourceBeforeEdit = null;
          aiState.lastMutation = null;
          updateAiComposerState();
        }
      });
      return;
    }

    if (root.CodeMirror && !root.CodeMirror.helpers?.hint?.mreasy) {
      root.CodeMirror.registerHelper('hint', 'mreasy', function (cm) {
        const cursor = cm.getCursor();
        const token = cm.getTokenAt(cursor);
        const start = token.start;
        const end = cursor.ch;
        const word = token.string.slice(0, end - start).toLowerCase();
        const list = [...KEYWORDS, ...STYLE_WORDS].filter(item => item.toLowerCase().startsWith(word));
        return {
          list: list,
          from: root.CodeMirror.Pos(cursor.line, start),
          to: root.CodeMirror.Pos(cursor.line, end)
        };
      });
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
        'Ctrl-Space': 'autocomplete',
        'Ctrl-Enter': compileAndPreview,
        'Ctrl-S': () => { exportZip(); }
      }
    });

    editor.on('keyup', (cm, event) => {
      if (!cm.state.completionActive && event.keyCode >= 65 && event.keyCode <= 90) {
        cm.showHint({ completeSingle: false });
      }
    });

    editor.on('change', () => {
      scheduleCompile();
      markUnsaved();
      updateStatusbarCounters();
      if (!aiState.isApplying && aiState.lastSourceBeforeEdit !== null) {
        aiState.lastSourceBeforeEdit = null;
        aiState.lastMutation = null;
        updateAiComposerState();
      }
    });
    editor.on('cursorActivity', () => {
      updateStatusbarCounters();
    });
  }

  function updateStatusbarCounters() {
    if (!editor) return;
    const cursor = editor.getCursor();
    const line = document.getElementById('line-col');
    const count = document.getElementById('char-count');
    if (line) line.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    if (count) count.textContent = `${editor.getValue().length} chars`;
  }

  function scheduleCompile() {
    if (!autoCompileEnabled) return;
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(compileAndPreview, 120);
  }

  let activeErrorLines = [];
  function clearErrorHighlights() {
    if (editor && activeErrorLines.length) {
      activeErrorLines.forEach(lineIdx => editor.removeLineClass(lineIdx, 'background', 'cm-error-line'));
      activeErrorLines = [];
    }
  }

  function setErrorNotice(lineIndex, message) {
    const bar = document.getElementById('error-notice-bar');
    const text = document.getElementById('error-notice-text');
    if (bar && text) {
      text.textContent = `Line ${lineIndex + 1}: ${message}`;
      bar.style.display = 'flex';
      bar.dataset.errorLine = lineIndex;
    }
    if (editor && lineIndex >= 0) {
      editor.addLineClass(lineIndex, 'background', 'cm-error-line');
      activeErrorLines.push(lineIndex);
    }
  }

  function dismissErrorNotice() {
    const bar = document.getElementById('error-notice-bar');
    if (bar) bar.style.display = 'none';
  }

  function jumpToFirstError() {
    const bar = document.getElementById('error-notice-bar');
    const lineIndex = Number(bar?.dataset?.errorLine ?? 0);
    if (!isNaN(lineIndex)) jumpToLine(lineIndex);
  }

  function compileAndPreview() {
    const source = getSourceCode();
    writeStoredSource(source);
    const count = document.getElementById('char-count');
    if (count) count.textContent = `${source.length} chars`;

    clearErrorHighlights();
    dismissErrorNotice();

    const lines = source.split('\n');
    let hasError = false;

    // Rule 1: Declaration header required on line 1
    const firstNonEmptyIdx = lines.findIndex(l => l.trim().length > 0 && !l.trim().startsWith('#'));
    if (firstNonEmptyIdx >= 0 && !lines[firstNonEmptyIdx].trim().startsWith('Mr.easy')) {
      setErrorNotice(firstNonEmptyIdx, 'Declaration required — every file MUST start with Mr.easy "Title"');
      hasError = true;
    } else if (firstNonEmptyIdx < 0) {
      setErrorNotice(0, 'Empty document — add Mr.easy "Title" to start');
      hasError = true;
    }

    // Check for unclosed quote on lines
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      let quoteCount = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"' && (i === 0 || line[i-1] !== '\\')) quoteCount++;
      }
      if (quoteCount % 2 !== 0) {
        setErrorNotice(idx, 'Unclosed quotation mark (missing closing ")');
        hasError = true;
      }
    });

    try {
      const frame = document.getElementById('preview-frame');
      if (frame) frame.srcdoc = browserCompile(source, { isDarkTheme });
      setCompilerStatus(!hasError, hasError ? { message: 'Syntax issues found' } : null);
      if (!hasError) markSaved();
    } catch (error) {
      setErrorNotice(0, error.message);
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
    // Build snippets list
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
    // Build examples cards in sidebar panel
    const exCardList = document.getElementById('examples-card-list');
    if (exCardList && !exCardList.children.length) {
      EXAMPLES.forEach(example => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = `<div class="example-card-icon"><i class="fa ${example.icon}"></i></div><div><div class="example-card-label">${example.label}</div><div class="example-card-sub">Click to load</div></div>`;
        card.onclick = () => { loadExample(example.key); showToast('\u2728 Loaded ' + example.label); };
        exCardList.appendChild(card);
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
    // Show the correct sidebar panel
    ['explorer','search','examples','settings'].forEach(panelId => {
      const el = document.getElementById('panel-' + panelId);
      if (el) el.classList.toggle('active', panelId === action);
    });
    // Guide & settings special handling
    if (action === 'guide') {
      // Keep explorer panel but open guide modal
      document.getElementById('panel-explorer')?.classList.add('active');
      openGuideModal('ref');
    } else if (action === 'search') {
      setTimeout(() => document.getElementById('search-input')?.focus(), 50);
    }
  }

  function setDevicePreset(preset) {
    if (!PREVIEW_VIEWPORTS[preset]) return;
    activeViewport = preset;

    const select = document.getElementById('device-select');
    if (select) select.value = preset;

    const viewportButtons = document.querySelectorAll('.vp-btn');
    viewportButtons.forEach(button => button.classList.remove('active'));

    if (preset === 'desktop') {
      viewportButtons[0]?.classList.add('active');
    } else if (preset === 'tablet') {
      viewportButtons[1]?.classList.add('active');
    } else {
      viewportButtons[2]?.classList.add('active');
    }

    const frame = document.getElementById('preview-frame');
    const wrapper = document.getElementById('preview-wrapper');
    const isMobile = preset !== 'desktop' && preset !== 'tablet';
    if (frame) frame.className = preset === 'desktop' ? '' : (preset === 'tablet' ? 'tablet' : 'mobile');
    if (wrapper) wrapper.className = `preview-frame-wrapper ${isDarkTheme ? '' : 'light'} ${preset === 'desktop' ? '' : (preset === 'tablet' ? 'tablet' : 'mobile')}`;

    applyPreviewScale();
  }

  function setViewport(viewport, sourceEvent) {
    if (viewport === 'desktop') setDevicePreset('desktop');
    else if (viewport === 'tablet') setDevicePreset('tablet');
    else if (viewport === 'mobile') setDevicePreset('mobile');
  }

  function applyPreviewScale() {
    const wrapper = document.getElementById('preview-wrapper');
    const frame = document.getElementById('preview-frame');
    const viewport = PREVIEW_VIEWPORTS[activeViewport];
    if (!wrapper || !frame || !viewport) return;

    if (activeViewport === 'desktop') {
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.left = '0';
      frame.style.top = '0';
      frame.style.transform = 'none';
      wrapper.dataset.scale = '1.000';
      return;
    }

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
    const wrapper = document.getElementById('preview-wrapper');
    if (wrapper) wrapper.classList.toggle('light', !isDarkTheme);
    compileAndPreview();
    showToast(`Preview switched to ${isDarkTheme ? 'Dark' : 'Light'} Mode`);
  }

  function insertSnippet(type) {
    // Search by tag first (exact), then by label (partial), then by key name
    const t = String(type).toLowerCase();
    const snippet = SNIPPETS.find(item => item.tag === t)
      || SNIPPETS.find(item => item.tag === type)
      || SNIPPETS.find(item => item.label.toLowerCase().includes(t));
    const code = snippet ? snippet.code : `${type}\n`;
    if (editor) {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const indent = line.match(/^(\s*)/)[1];
      const indented = code.split('\n').map((item, idx) => idx === 0 ? item : indent + item).join('\n');
      editor.replaceRange(`\n${indented}`, { line: cursor.line, ch: line.length });
      editor.focus();
    } else {
      setSourceCode(`${getSourceCode()}\n${code}`);
    }
    scheduleCompile();
    showToast(`\u2728 Inserted ${type}`);
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

  function downloadSource() { exportZip(); }

  function formatCode() {
    const source = getSourceCode();
    const lines = source.split('\n');
    let currentIndent = 0;
    const blockKeywords = ['nav', 'hero', 'section', 'grid', 'card', 'box', 'list', 'form', 'accordion', 'tabs', 'tab', 'table', 'thead', 'tbody', 'tr', 'repeat'];

    const formattedLines = lines.map(rawLine => {
      const trimmed = rawLine.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('#')) return '  '.repeat(currentIndent) + trimmed;

      if (trimmed.startsWith('Mr.easy')) {
        currentIndent = 0;
        return trimmed;
      }

      const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
      const lineIndent = '  '.repeat(currentIndent);

      if (blockKeywords.includes(firstWord)) {
        const result = lineIndent + trimmed;
        currentIndent += 1;
        return result;
      }

      return lineIndent + trimmed;
    });

    setSourceCode(formattedLines.join('\n'));
    showToast('✨ Code auto-formatted!');
  }

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

  const SETTINGS_KEY = 'mreasy_ide_settings';

  function saveSettings() {
    try {
      const wrapInput = document.getElementById('setting-wrap');
      const acInput = document.getElementById('setting-autocompile');
      const settings = {
        fontSize: fontSize,
        wordWrap: wrapInput ? wrapInput.checked : false,
        autoCompile: acInput ? acInput.checked : true,
        isDarkTheme: isDarkTheme
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save IDE settings', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      if (settings.fontSize && typeof settings.fontSize === 'number') {
        fontSize = settings.fontSize;
        setFontSize(fontSize);
      }
      if (typeof settings.wordWrap === 'boolean') {
        const wrapInput = document.getElementById('setting-wrap');
        if (wrapInput) wrapInput.checked = settings.wordWrap;
        if (editor) editor.setOption('lineWrapping', settings.wordWrap);
      }
      if (typeof settings.autoCompile === 'boolean') {
        const acInput = document.getElementById('setting-autocompile');
        if (acInput) acInput.checked = settings.autoCompile;
        autoCompileEnabled = settings.autoCompile;
      }
      if (typeof settings.isDarkTheme === 'boolean') {
        isDarkTheme = settings.isDarkTheme;
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = isDarkTheme ? 'fa fa-moon' : 'fa fa-sun';
        const wrapper = document.getElementById('preview-wrapper');
        if (wrapper) wrapper.classList.toggle('light', !isDarkTheme);
      }
    } catch (e) {
      console.warn('Failed to load IDE settings', e);
    }
  }

  function copySource() { copyText(getSourceCode(), '📋 MR.easy source copied to clipboard!'); }

  function copyCompiledHtml() { copyText(browserCompile(getSourceCode(), { isDarkTheme }), '📋 Compiled HTML copied to clipboard!'); }
  function copyHTML() { copyCompiledHtml(); }

  function shareCode() {
    const code = getSourceCode();
    if (!code.trim()) {
      showToast('⚠️ Editor is empty');
      return;
    }
    try {
      const b64 = btoa(unescape(encodeURIComponent(code)));
      const url = window.location.protocol + '//' + window.location.host + window.location.pathname + '#code=' + encodeURIComponent(b64);
      window.history.replaceState(null, '', url);
      copyText(url, '🔗 Shareable link copied to clipboard!');
    } catch (e) {
      showToast('⚠️ Failed to generate share link');
    }
  }

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
    const settingsLabel = document.getElementById('settings-font-label');
    if (settingsLabel) settingsLabel.textContent = `${fontSize}px`;
    if (editor) editor.refresh();
    saveSettings();
  }

  // Search inside CodeMirror
  let autoCompileEnabled = true;
  function runSearch() {
    const query = (document.getElementById('search-input')?.value || '').trim();
    const results = document.getElementById('search-results');
    if (!results) return;
    if (!query) { results.innerHTML = '<div class="search-empty">Type a query and press Go</div>'; return; }
    const source = getSourceCode();
    const lines = source.split('\n');
    const matches = [];
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    lines.forEach((line, idx) => {
      if (regex.test(line)) matches.push({ line: idx, text: line });
    });
    if (!matches.length) { results.innerHTML = `<div class="search-empty">No matches for "${query}"</div>`; return; }
    results.innerHTML = matches.map(m => {
      const highlighted = m.text.replace(regex, match => `<mark>${match}</mark>`);
      return `<div class="search-result-item" data-line="${m.line}"><span class="search-result-line">Ln ${m.line + 1}</span><span class="search-result-text">${highlighted}</span></div>`;
    }).join('');
    results.querySelectorAll('.search-result-item').forEach(item => item.addEventListener('click', () => jumpToLine(Number(item.dataset.line))));
    showToast(`🔍 ${matches.length} result${matches.length !== 1 ? 's' : ''} found`);
  }

  function toggleWrap(enabled) {
    if (editor) editor.setOption('lineWrapping', enabled);
    saveSettings();
    showToast(enabled ? 'Word wrap enabled' : 'Word wrap disabled');
  }

  function toggleAutoCompile(enabled) {
    autoCompileEnabled = enabled;
    saveSettings();
    showToast(enabled ? 'Auto-compile on' : 'Auto-compile paused');
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

    const row = (code, desc) => `<div class="guide-row"><div class="guide-code">${code}</div><div class="guide-desc">${desc}</div></div>`;

    if (type === 'cheat') {
      title.innerHTML = '<i class="fa fa-list-check"></i> MR.easy Cheatsheet';
      body.innerHTML = `
        <div class="guide-section"><h3>⚡ Required Header</h3>${row('Mr.easy "Title"','Every file MUST start with this')}</div>
        <div class="guide-section"><h3>🏗 Layout</h3>
          ${row('nav','Navigation bar (logo + links)')}
          ${row('hero','Full-width hero section')}
          ${row('section "name"','Named page section')}
          ${row('grid cols:3','Responsive columns (2,3,4)')}
          ${row('row center','Horizontal flex row')}
          ${row('card shadow','Content card')}
          ${row('footer','Page footer')}
        </div>
        <div class="guide-section"><h3>✏️ Content</h3>
          ${row('title "Text" big glow','Heading (big/medium/small)')}
          ${row('subtitle "Text"','Subtitle paragraph')}
          ${row('text "Text" bold','Body text')}
          ${row('button "Click" blue big','Button (color + size)')}
          ${row('link "Label" url:https://...','Hyperlink')}
          ${row('image "file.jpg" rounded','Image')}
          ${row('icon rocket','Font Awesome icon')}
        </div>
        <div class="guide-section"><h3>🎛 New v2.0 Components</h3>
          ${row('badge "NEW" green','Status badge')}
          ${row('alert "Msg" success','Alert banner (info/success/warning/error)')}
          ${row('progress value:75 label:"Skill"','Progress bar')}
          ${row('stat value:"150+" label:"Clients"','Big stat display')}
          ${row('rating value:4','Star rating')}
          ${row('accordion "Title"','Expandable accordion')}
          ${row('tabs','Tabbed panel (use tab children)')}
          ${row('table','Data table (thead/tbody/tr/th/td)')}
        </div>
        <div class="guide-section"><h3>📋 Forms</h3>
          ${row('form','Form container')}
          ${row('input placeholder:"..." type:email','Text/email/password input')}
          ${row('label "Name" for:id','Form label')}
          ${row('select','Dropdown select')}
          ${row('checkbox','Checkbox')}
          ${row('toggle','iOS-style toggle switch')}
        </div>`;
    } else {
      title.innerHTML = '<i class="fa fa-book"></i> MR.easy Language Reference';
      body.innerHTML = `
        <div class="guide-section">
          <h3>🚀 File Structure</h3>
          <div class="guide-code">Mr.easy "Page Title"  ← Required first line\n\nnav\n  logo "Brand"\n  links Home About Contact\n\nhero\n  title "Welcome" big glow\n  subtitle "Build websites with words"\n  button "Get Started" blue big\n\nfooter\n  text "\u00a9 2026 MyBrand"</div>
          <p class="guide-desc">Indentation (2 spaces) creates nesting. No brackets, semicolons, or HTML tags needed.</p>
        </div>
        <div class="guide-section">
          <h3>📐 Layout Keywords</h3>
          ${['nav — Navigation bar (children: logo, links, menu)','hero — Full-width hero section','section "name" — Named content section','grid cols:3 — Responsive CSS grid (2, 3, or 4 cols)','row center — Horizontal flex row','col — Flex column','card shadow — Content card with optional shadow/glass/rounded','box — Generic container box','footer — Page footer'].map(s => { const [k,d]=s.split(' — '); return row(k,d||''); }).join('')}
        </div>
        <div class="guide-section">
          <h3>✏️ Text & Inline Elements</h3>
          ${[['title "Hello" big glow','Heading — sizes: big medium small tiny'],['subtitle "Text"','Subtitle / lead paragraph'],['text "..." bold italic','Body text — modifiers: bold italic center'],['button "Label" blue big','Button — colors: blue purple green red orange | sizes: big small'],['link "Label" url:https://...','Hyperlink'],['badge "NEW" green','Status pill badge'],['tag "Design"','Clickable hashtag chip']].map(([c,d])=>row(c,d)).join('')}
        </div>
        <div class="guide-section">
          <h3>🎛 v2.0 Components</h3>
          ${[['alert "Msg" success','Banner — types: info success warning error'],['progress value:75 label:"JS"','Animated progress bar'],['stat value:"150+" label:"Clients"','Big metric display'],['rating value:4 label:"(reviews)"','Star rating component'],['accordion "FAQ title"','Expandable collapse (nest text/content inside)'],['tabs → tab "Name"','Tabbed panels'],['table → thead/tbody/tr/th/td','Responsive data table'],['countdown to:"2026-12-31"','Live countdown timer'],['embed "https://youtube.com/..."','Responsive video embed']].map(([c,d])=>row(c,d)).join('')}
        </div>
        <div class="guide-section">
          <h3>📋 Forms</h3>
          ${[['form','Form container'],['input placeholder:"..."','Text input (type: email password url number)'],['label "Text" for:id','Label tied to input id'],['select','Dropdown — add item children'],['checkbox','Native styled checkbox'],['toggle','iOS toggle switch']].map(([c,d])=>row(c,d)).join('')}
        </div>
        <div class="guide-section">
          <h3>⚙️ Modifiers (add after keywords)</h3>
          <div class="guide-code">Colors: blue purple green red orange pink yellow white black gray cyan\nSizes:  big medium small tiny\nStyle:  shadow rounded glow glass gradient outline bold italic center\nState:  on off checked required ordered</div>
        </div>`;
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
    title.innerHTML = '<i class="fa fa-cubes"></i> Starter Templates';
    body.innerHTML = `<div class="guide-section"><p class="guide-desc" style="margin-bottom:16px;">Select a template to load into your editor:</p><div class="template-grid">${EXAMPLES.map(ex => `<div class="template-card" data-template="${ex.key}"><div class="template-card-icon"><i class="fa ${ex.icon}"></i></div><div class="template-card-label">${ex.label}</div><div class="template-card-sub">Load into editor</div></div>`).join('')}</div></div>`;
    body.querySelectorAll('[data-template]').forEach(item => item.addEventListener('click', () => { loadExample(item.dataset.template); closeGuideModal(); showToast('\u2728 Loaded ' + item.querySelector('.template-card-label').textContent); }));
    modal.classList.add('open');
  }

  function openCliModal() {
    const modal = document.getElementById('guide-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;
    title.innerHTML = '<i class="fa fa-terminal"></i> MR.easy Beginner Guide — PC & Web IDE';
    body.innerHTML = `
      <div class="guide-section">
        <h3>💻 Working on your PC (Terminal & VS Code)</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">Choose how you want to work on PC:</p>
        
        <div style="margin-bottom:6px;"><strong>📁 Option A: Automatic New Project</strong></div>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:6px;">Creates a new folder <code>mywebsite</code> with starter files automatically:</p>
        <div class="guide-code">mreasy new mywebsite<br>cd mywebsite<br>mreasy run</div>

        <div style="margin-bottom:6px;margin-top:14px;"><strong>✏️ Option B: Existing Folder / Manual File</strong></div>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:6px;">If you created your folder or <code>.mreasy</code> file manually, just open terminal inside your folder and run:</p>
        <div class="guide-code">cd path\\to\\your\\folder<br>mreasy run</div>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-top:4px;">Auto-detects your file without overwriting anything!</p>

        <div style="margin-bottom:6px;margin-top:14px;"><strong>⚡ Option C: Compile Standalone File</strong></div>
        <div class="guide-code">mreasy compile myfile.mreasy</div>

        <div style="margin-bottom:6px;margin-top:14px;"><strong>🏗️ Build Production HTML:</strong></div>
        <div class="guide-code">mreasy build</div>
      </div>

      <div class="guide-section" style="margin-top:20px;">
        <h3>🌐 Working in Web IDE</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;">1. Write code in the left editor panel.<br>2. Watch live website preview on the right.<br>3. Click <strong>Download ZIP</strong> at the top right to download your website!</p>
      </div>
    `;
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
    const percent = Math.max(15, Math.min(85, (offset / totalWidth) * 100));
    const editorPct = percent * (totalWidth / rect.width);
    const previewPct = (100 - percent) * (totalWidth / rect.width);
    editorPanel.style.flex = `0 0 ${editorPct}%`;
    previewPanel.style.flex = `0 0 ${previewPct}%`;
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

  let historySnapshots = [];
  let historyIndex = -1;

  function recordHistorySnapshot(source, html) {
    if (historySnapshots.length > 30) historySnapshots.shift();
    historySnapshots.push({
      timestamp: new Date().toLocaleTimeString(),
      source,
      html
    });
    historyIndex = historySnapshots.length - 1;
    updateHistoryTimelineUI();
  }

  function updateHistoryTimelineUI() {
    const bar = document.getElementById('history-timeline-bar');
    if (!bar) return;
    bar.innerHTML = historySnapshots.map((snap, idx) => `
      <button class="history-dot ${idx === historyIndex ? 'active' : ''}" title="Version ${idx + 1} (${snap.timestamp})" onclick="restoreHistorySnapshot(${idx})">${idx + 1}</button>
    `).join('');
  }

  function restoreHistorySnapshot(idx) {
    if (historySnapshots[idx]) {
      historyIndex = idx;
      setSourceCode(historySnapshots[idx].source);
      showToast(`⏪ Restored Version ${idx + 1} (${historySnapshots[idx].timestamp})`);
      compileAndPreview();
    }
  }

  function handleTwoWayElementEdit(oldText, type) {
    if (!oldText || !editor) return;
    const newText = root.prompt(`Edit ${type} text directly in MR.easy source:`, oldText);
    if (newText !== null && newText !== oldText) {
      const currentCode = editor.getValue();
      const replaced = currentCode.replace(oldText, newText);
      if (replaced !== currentCode) {
        editor.setValue(replaced);
        compileAndPreview();
        showToast(`✨ Updated ${type}: "${newText}"`);
      } else {
        showToast(`⚠️ Could not find exact text "${oldText}" in source code.`);
      }
    }
  }

  root.addEventListener('message', event => {
    if (event.data?.type === 'JUMP_TO_LINE') jumpToLine(event.data.line);
    if (event.data?.type === 'PREVIEW_ELEMENT_EDIT') {
      handleTwoWayElementEdit(event.data.elementText, event.data.elementType);
    }
  });

  function showGuide() { openGuideModal('ref'); }
  function showCheatsheet() { openGuideModal('cheat'); }
  function closeModal() { closeGuideModal(); }

  function installKeyboardHandlers() {
    // Tab keyboard activation
    document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tab.click(); }
    }));
    // Global Escape
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (aiState.isOpen) closeAiPanel();
      else closeGuideModal();
    });
    // Close modal on backdrop click
    const modal = document.getElementById('guide-modal');
    modal?.addEventListener('click', event => { if (event.target === modal) closeGuideModal(); });
    // Search: Enter key
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('keydown', event => { if (event.key === 'Enter') runSearch(); });
  }

  function checkUrlOrSavedSource() {
    const hash = root.location.hash;
    const searchParams = new URLSearchParams(root.location.search);
    const templateKey = searchParams.get('template');

    if (hash && hash.includes('code=')) {
      try {
        const b64 = decodeURIComponent(hash.slice(hash.indexOf('code=') + 5));
        const code = decodeURIComponent(escape(atob(b64)));
        if (code && code.trim()) {
          setSourceCode(code);
          showToast('✨ Loaded shared snippet');
          compileAndPreview();
          return;
        }
      } catch (e) {
        console.warn('Failed to decode share URL', e);
      }
    }

    if (templateKey) {
      const found = EXAMPLES.find(ex => ex.key === templateKey);
      if (found) {
        setSourceCode(found.code);
        showToast(`✨ Loaded template: ${found.label}`);
        compileAndPreview();
        return;
      }
    }

    const saved = readStoredSource();
    if (saved && saved.trim()) {
      setSourceCode(saved);
    } else {
      setSourceCode(STARTER);
      showToast('🚀 Starter template auto-loaded');
    }
    compileAndPreview();
  }

  root.addEventListener('DOMContentLoaded', () => {
    initEditor();
    buildSidebar();
    installKeyboardHandlers();
    installAiHandlers();
    setViewMode('split');
    loadSettings();
    checkUrlOrSavedSource();
    const wrapper = document.getElementById('preview-wrapper');
    if (wrapper && root.ResizeObserver) new root.ResizeObserver(schedulePreviewScale).observe(wrapper);
    root.addEventListener('resize', schedulePreviewScale);
    setViewport('desktop');
    setZoom(100);
  });

  Object.assign(root, {
    KEYWORDS, STYLE_WORDS, COLOR_MAP, ICON_MAP, SIZE_MAP,
    browserCompile, compileAndPreview, switchTab, setViewMode, activateRail, setViewport, setDevicePreset, setZoom,
    togglePreviewTheme, insertSnippet, loadExample, runCode, refreshPreview,
    openInNewTab, downloadHTML, downloadSource, copySource, copyHTML, copyCompiledHtml, shareCode, exportZip,
    clearCode, formatCode, increaseFontSize, decreaseFontSize, openGuideModal,
    closeGuideModal, showGuide, showCheatsheet, closeModal, openTemplateModal,
    openCliModal, toggleAiPanel, closeAiPanel, clearAiConversation, sendAiMessage, stopAiRequest, undoAiEdit,
    parseAiEnvelope, validateAiAction, applyAiActions, connectAiProvider,
    requestOpenAi, requestAnthropic, requestGemini, requestOpenAiCompatible, formatProviderError,
    markUnsaved, markSaved, showToast, startResize, doResize, stopResize,
    runSearch, toggleWrap, toggleAutoCompile, dismissErrorNotice, jumpToFirstError,
    loadSettings, saveSettings
  });
})(window);
