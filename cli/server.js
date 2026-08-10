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

const PORT      = process.env.PORT || 3000;
const WS_PORT   = PORT + 1;

function startServer(cwd) {
  // Find the entry file
  const rcPath = path.join(cwd, '.mreasyrc');
  let entry = 'index.mreasy';
  if (fs.existsSync(rcPath)) {
    try { entry = JSON.parse(fs.readFileSync(rcPath)).entry || entry; } catch {}
  }

  const entryFile = path.join(cwd, entry);
  if (!fs.existsSync(entryFile)) {
    console.log(chalk.yellow(`  ⚠ No "${entry}" found. Creating a starter file...\n`));
    const starter = `Mr.easy "My Website"\n\nhero\n  title "Hello World" big glow\n  subtitle "Edit index.mreasy to get started!"\n  button "I Love MR.easy" blue big\n`;
    fs.writeFileSync(entryFile, starter);
  }

  // ── WebSocket Server (for hot reload) ────────────────────────────────────
  const wss = new WebSocketServer({ port: WS_PORT });
  const clients = new Set();
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  function broadcast(type, data) {
    const msg = JSON.stringify({ type, ...data });
    clients.forEach(ws => { try { ws.send(msg); } catch {} });
  }

  // ── HTTP Server ────────────────────────────────────────────────────────────
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let url = requestUrl.pathname || '/';

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
        const { html } = compileFile(entryFile);
        const injected = injectLiveReload(html, WS_PORT);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(injected);
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
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
  if (chokidar) {
    const watcher = chokidar.watch(path.join(cwd, '**/*.mreasy'), {
      ignoreInitial: true,
      ignored: /node_modules/
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
    fs.watch(entryFile, () => {
      console.log(chalk.cyan('  ↻ File changed — reloading...'));
      broadcast('reload', {});
    });
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

module.exports = { startServer };
