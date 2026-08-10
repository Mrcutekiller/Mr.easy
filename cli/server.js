/**
 * MR.easy Live Preview Server
 * Watches .mreasy files and sends updates to the browser via WebSocket.
 */

'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { WebSocketServer } = require('ws');

let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, cyan: s=>s, yellow: s=>s, gray: s=>s }; }

let chokidar;
try { chokidar = require('chokidar'); } catch { chokidar = null; }

let openPkg;
try { openPkg = require('open'); } catch { openPkg = null; }

const { compileFile, compile } = require('../core/index');

function startServer(cwd, customPort) {
  const PORT    = customPort || process.env.PORT || 3000;
  const WS_PORT = PORT + 1;

  // Find the entry file
  const rcPath = path.join(cwd, '.mreasyrc');
  let entry = 'index.mreasy';
  if (fs.existsSync(rcPath)) {
    try { entry = JSON.parse(fs.readFileSync(rcPath)).entry || entry; } catch {}
  }

  let entryFile = path.join(cwd, entry);
  if (!fs.existsSync(entryFile)) {
    try {
      const files = fs.readdirSync(cwd).filter(f => f.endsWith('.mreasy'));
      if (files.length > 0) {
        entry = files[0];
        entryFile = path.join(cwd, entry);
      }
    } catch {}
  }

  // ── WebSocket Server (for hot reload) ────────────────────────────────────
  let wss;
  try {
    wss = new WebSocketServer({ port: WS_PORT });
    wss.on('error', err => {
      console.log(chalk.yellow(`  ⚠ Live reload WebSocket warning: ${err.message}`));
    });
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ Live reload WebSocket warning: ${err.message}`));
  }

  const clients = new Set();
  if (wss) {
    wss.on('connection', ws => {
      clients.add(ws);
      ws.on('close', () => clients.delete(ws));
    });
  }

  function broadcast(type, data) {
    const msg = JSON.stringify({ type, ...data });
    clients.forEach(ws => { try { ws.send(msg); } catch {} });
  }

  // ── HTTP Server ────────────────────────────────────────────────────────────
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let url = requestUrl.pathname || '/';

    // Prevent browser caching during live preview
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Keep relative IDE assets rooted under /ide/ instead of resolving from /.
    if (url === '/ide') {
      res.writeHead(301, { Location: '/ide/' });
      res.end();
      return;
    }
    if (url === '/') url = '/index.html';
    if (url === '/ide/') url = '/ide/index.html';

    // Serve compiled preview
    if (url === '/index.html' || url === '/__preview__') {
      try {
        if (!fs.existsSync(entryFile) || fs.readFileSync(entryFile, 'utf-8').trim().length === 0) {
          const emptyPage = buildEmptyStatePage(entry);
          const injected = injectLiveReload(emptyPage, WS_PORT);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(injected);
          return;
        }

        const { html } = compileFile(entryFile);
        const injected = injectLiveReload(html, WS_PORT);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(injected);
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1 style="color:red;font-family:sans-serif;padding:40px">Error: ${err.message}</h1>`);
      }
      return;
    }

    // Serve static files (images, etc.)
    const filePath = path.join(cwd, url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
        '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404); res.end('Not found');
  });

  server.listen(PORT, () => {
    console.log(chalk.green(`  ✓ MR.easy live server running!\n`));
    console.log(chalk.cyan(`  🌐 Preview:  http://localhost:${PORT}`));
    console.log(chalk.gray(`  🔄 Watching: ${entry}`));
    console.log(chalk.gray(`  ⚡ Hot reload active\n`));
    console.log(chalk.yellow(`  Press Ctrl+C to stop\n`));

    // Auto-open browser
    if (openPkg) {
      openPkg(`http://localhost:${PORT}`).catch(() => {});
    }
  });

  // ── File Watcher ───────────────────────────────────────────────────────────
  const watchPath = cwd.replace(/\\/g, '/') + '/**/*.mreasy';
  const entryPath = entryFile.replace(/\\/g, '/');

  if (chokidar) {
    const watcher = chokidar.watch([watchPath, entryPath], {
      ignoreInitial: true,
      ignored: /(^|[\/\\])\..|node_modules|dist/,
      usePolling: true,
      interval: 300
    });

    watcher.on('change', (fp) => {
      const rel = path.relative(cwd, fp);
      console.log(chalk.cyan(`  ↻ Changed: ${rel}`));
      try {
        const { html, errors } = compileFile(fp);
        if (errors.length) errors.forEach(e => console.log(chalk.yellow(`  ⚠ ${e}`)));
        broadcast('reload', { file: rel });
      } catch (err) {
        broadcast('error', { message: err.message });
      }
    });

    watcher.on('add', (fp) => {
      console.log(chalk.green(`  + Added: ${path.relative(cwd, fp)}`));
      broadcast('reload', {});
    });
  } else {
    // Fallback: poll with fs.watch
    try {
      fs.watch(entryFile, () => {
        console.log(chalk.cyan('  ↻ File changed — reloading...'));
        broadcast('reload', {});
      });
    } catch {}
  }
}

/** Inject the live-reload WebSocket client script into HTML */
function injectLiveReload(html, wsPort) {
  const script = `
<script>
(function() {
  var ws = new WebSocket('ws://localhost:${wsPort}');
  var overlay = null;

  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') {
      window.location.reload();
    } else if (msg.type === 'error') {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ef4444;color:white;padding:16px 24px;border-radius:12px;font-family:monospace;font-size:14px;z-index:99999;max-width:400px;box-shadow:0 10px 30px rgba(0,0,0,0.5)';
        document.body.appendChild(overlay);
      }
      overlay.textContent = '❌ ' + msg.message;
    }
  };

  ws.onopen = function() {
    console.log('%c MR.easy live reload connected ✓ ', 'background:#6366f1;color:white;padding:4px 8px;border-radius:4px');
  };

  ws.onclose = function() {
    console.log('MR.easy: server stopped');
  };
})();
</script>`;

  // Insert before </body>
  return html.replace('</body>', script + '\n</body>');
}

/** Render a clean, helpful page when entry file is empty or missing */
function buildEmptyStatePage(filename) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MR.easy — Ready For Code</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=DM+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    body { background: #0b0f19; color: #f1f5f9; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 44px; max-width: 580px; width: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.5); backdrop-filter: blur(12px); text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 16px; display: inline-block; }
    h1 { font-size: 1.8rem; margin: 0 0 10px; color: #818cf8; font-weight: 800; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 24px; }
    p code { background: rgba(255,255,255,0.08); color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 0.85em; }
    .code-box { background: #030712; border: 1px solid rgba(129,140,248,0.25); border-radius: 12px; padding: 20px; text-align: left; font-family: 'DM Mono', monospace; font-size: 0.88rem; color: #cbd5e1; line-height: 1.8; position: relative; overflow: auto; }
    .code-box .kw { color: #818cf8; font-weight: 600; }
    .code-box .str { color: #86efac; }
    .code-box .mod { color: #fde047; }
    .hint { margin-top: 24px; font-size: 0.82rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📝</div>
    <h1>No Code Found in ${filename}</h1>
    <p>Your file <code>${filename}</code> is empty.<br>Open <code>${filename}</code> in VS Code or any text editor and type your MR.easy code!</p>
    
    <div class="code-box">
      <div><span class="kw">Mr.easy</span> <span class="str">"My Website"</span></div>
      <div><br></div>
      <div><span class="kw">hero</span></div>
      <div>&nbsp;&nbsp;<span class="kw">title</span> <span class="str">"Welcome to My Site"</span> <span class="mod">big glow</span></div>
      <div>&nbsp;&nbsp;<span class="kw">subtitle</span> <span class="str">"Written with MR.easy"</span></div>
      <div>&nbsp;&nbsp;<span class="kw">button</span> <span class="str">"Get Started"</span> <span class="mod">blue big</span></div>
    </div>
    
    <div class="hint">⚡ Save your file and this page will update live automatically!</div>
  </div>
</body>
</html>`;
}

module.exports = { startServer };
