/**
 * MR.easy Terminal UI (TUI) — Split-Pane Live Preview Mode
 * Left pane: Live Code Editor
 * Right pane: ASCII Wireframe Preview
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { compile } = require('../core/index');

let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, bold: s=>s, gray: s=>s, white: s=>s, magenta: s=>s }; }

function startTUI(filePath) {
  const targetFile = filePath || path.join(process.cwd(), 'index.mreasy');
  let source = '';

  if (fs.existsSync(targetFile)) {
    source = fs.readFileSync(targetFile, 'utf-8');
  } else {
    source = `Mr.easy "My TUI Site"\n\nhero\n  title "Welcome to TUI Mode" big glow\n  subtitle "Live terminal ASCII wireframe preview"\n  button "Get Started" blue big\n\ngrid cols:2\n  card shadow\n    title "Card 1"\n    text "First feature"\n  card shadow\n    title "Card 2"\n    text "Second feature"\n\nfooter\n  text "Built with MR.easy 🇪🇹"\n`;
    fs.writeFileSync(targetFile, source, 'utf-8');
  }

  // Clear screen and hide cursor
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  renderTUI(targetFile, source);

  // Key handling
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'q') {
      process.stdout.write('\x1b[2J\x1b[H');
      console.log(chalk.yellow('Exited MR.easy TUI mode.'));
      process.exit(0);
    }
    if (key.ctrl && key.name === 's') {
      fs.writeFileSync(targetFile, source, 'utf-8');
      renderTUI(targetFile, source, 'Saved!');
    }
    if (key.ctrl && key.name === 'p') {
      const { html } = compile(source);
      const tmpPath = path.join(require('os').tmpdir(), 'tui_preview.html');
      fs.writeFileSync(tmpPath, html, 'utf-8');
      const startCmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${startCmd} "${tmpPath}"`);
      renderTUI(targetFile, source, 'Opened in browser!');
    }
  });
}

function renderTUI(filePath, source, toastMessage = '') {
  const termWidth  = process.stdout.columns || 100;
  const termHeight = process.stdout.rows || 30;
  const paneWidth  = Math.floor((termWidth - 3) / 2);
  const bodyHeight = termHeight - 4;

  const sourceLines = source.split('\n');
  const wireframeLines = generateAsciiWireframe(source, paneWidth, bodyHeight);

  let output = '\x1b[H'; // move cursor to top-left

  // Header
  const titleStr = ` MR.easy TUI Split-Pane Preview — ${path.basename(filePath)} `;
  output += chalk.bgCyan.black(titleStr.padEnd(termWidth, ' ')) + '\n';

  // Body rows
  for (let r = 0; r < bodyHeight; r++) {
    const codeLine = sourceLines[r] !== undefined
      ? `${String(r + 1).padStart(3, ' ')} | ${sourceLines[r].slice(0, paneWidth - 7)}`
      : '';
    const leftPad = codeLine.padEnd(paneWidth, ' ');

    const wireLine = wireframeLines[r] !== undefined ? wireframeLines[r] : '';
    const rightPad = wireLine.padEnd(paneWidth, ' ');

    output += chalk.gray('│') + chalk.white(leftPad) + chalk.cyan('│') + chalk.yellow(rightPad) + chalk.gray('│') + '\n';
  }

  // Footer / status bar
  const toastStr = toastMessage ? ` [ ${toastMessage} ] ` : '';
  const statusStr = ` Ctrl+S: Save  |  Ctrl+P: Open Browser  |  Ctrl+Q: Quit ${toastStr}`;
  output += chalk.bgDarkGray ? chalk.bgDarkGray(statusStr.padEnd(termWidth, ' ')) : chalk.bgMagenta.white(statusStr.padEnd(termWidth, ' '));

  process.stdout.write(output);
}

function generateAsciiWireframe(source, width, maxHeight) {
  const { html, errors } = compile(source);
  const lines = [];

  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  lines.push('│' + ' BROWSER ASCII WIREFRAME PREVIEW '.padStart(Math.floor((width + 30) / 2)).padEnd(width - 2, ' ') + '│');
  lines.push('├' + '─'.repeat(width - 2) + '┤');

  if (errors.length) {
    lines.push('│ ' + chalk.red('❌ Compilation Error').padEnd(width - 4, ' ') + ' │');
    lines.push('└' + '─'.repeat(width - 2) + '┘');
    return lines;
  }

  const sourceLines = source.split('\n');
  sourceLines.forEach(l => {
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('Mr.easy')) return;

    if (trimmed.startsWith('hero')) {
      lines.push('╔' + '═'.repeat(width - 4) + '╗');
      lines.push('║' + ' HERO BANNER '.padStart(Math.floor((width + 10) / 2)).padEnd(width - 4, ' ') + '║');
      lines.push('╚' + '═'.repeat(width - 4) + '╝');
    } else if (trimmed.startsWith('grid')) {
      lines.push('┌' + '─'.repeat(Math.floor(width / 2) - 3) + '┐ ┌' + '─'.repeat(Math.floor(width / 2) - 3) + '┐');
      lines.push('│ GRID COL 1 │ │ GRID COL 2 │');
      lines.push('└' + '─'.repeat(Math.floor(width / 2) - 3) + '┘ └' + '─'.repeat(Math.floor(width / 2) - 3) + '┘');
    } else if (trimmed.startsWith('card')) {
      lines.push('┌' + '─'.repeat(width - 6) + '┐');
      lines.push('│ CARD ITEM ' + ' '.repeat(width - 18) + '│');
      lines.push('└' + '─'.repeat(width - 6) + '┘');
    } else if (trimmed.startsWith('footer') || trimmed.startsWith('nav')) {
      lines.push('■ ' + trimmed.toUpperCase().padEnd(width - 6, ' '));
    }
  });

  lines.push('└' + '─'.repeat(width - 2) + '┘');
  return lines.slice(0, maxHeight);
}

module.exports = { startTUI };
